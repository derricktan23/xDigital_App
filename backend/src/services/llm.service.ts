/**
 * LLM Service for AI-driven skill identification.
 * Uses Google Gemini API (gemini-1.5-flash) to automatically determine
 * required skills based on task titles when not specified by the user.
 */
import { logger } from '../utils/logger';

export interface SkillOption {
  id: number;
  name: string;
}

export interface SkillIdentificationResult {
  skillIds: number[];
  identifiedNames: string[];
  attempted: boolean;
  success: boolean;
  error?: string;
  rawResponse?: string;
}

export class LLMService {
  private model: string;

  constructor() {
    this.model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  }

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Helper that calls the Gemini API with appropriate authentication headers.
   */
  private async callGeminiApi(systemPrompt: string, userPrompt: string): Promise<{ ok: boolean; status: number; text: string }> {
    const apiKey = this.getApiKey()?.trim();
    if (!apiKey) {
      return {
        ok: false,
        status: 401,
        text: 'GEMINI_API_KEY environment variable is missing or empty.',
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    // Standard API key header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };

    // If key format is an actual Google OAuth token (starts with ya29.), include Bearer authorization
    if (apiKey.startsWith('ya29.')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        text,
      };
    } catch (networkError: any) {
      return {
        ok: false,
        status: 0,
        text: networkError.message || String(networkError),
      };
    }
  }

  /**
   * Diagnostic method to test connectivity and credentials with Gemini.
   */
  async testConnection(): Promise<{ success: boolean; model: string; message: string; details?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey.trim() === '') {
      return {
        success: false,
        model: this.model,
        message: 'GEMINI_API_KEY is not configured in .env',
      };
    }

    const testPrompt = `Classify this task title: "As a visitor, I want to see a responsive homepage on mobile". Choose from ["Frontend", "Backend"]. Output JSON array.`;
    const res = await this.callGeminiApi('You are a classification assistant.', testPrompt);

    if (!res.ok) {
      return {
        success: false,
        model: this.model,
        message: `Gemini API error (HTTP ${res.status})`,
        details: res.text,
      };
    }

    try {
      const data = JSON.parse(res.text);
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return {
        success: true,
        model: this.model,
        message: 'Successfully connected to Gemini API!',
        details: output,
      };
    } catch (e: any) {
      return {
        success: false,
        model: this.model,
        message: 'Connected but response was not valid JSON',
        details: res.text,
      };
    }
  }

  /**
   * Full skill identification with debug metadata returned.
   */
  async identifySkillsDetail(taskTitle: string, availableSkills: SkillOption[]): Promise<SkillIdentificationResult> {
    if (!taskTitle || taskTitle.trim() === '' || availableSkills.length === 0) {
      return {
        skillIds: [],
        identifiedNames: [],
        attempted: false,
        success: false,
      };
    }

    const apiKey = this.getApiKey()?.trim();
    if (!apiKey) {
      logger.warn('[LLMService] GEMINI_API_KEY is not set. Skipping automatic skill identification.');
      return {
        skillIds: [],
        identifiedNames: [],
        attempted: true,
        success: false,
        error: 'GEMINI_API_KEY environment variable is not configured on backend.',
      };
    }

    const availableSkillNames = availableSkills.map((s) => s.name);
    const availableSkillsJson = JSON.stringify(availableSkillNames);

    const systemPrompt = `You are an expert technical project lead and software engineering assistant.
Your job is to classify software engineering task titles and user stories by identifying the required technical skill(s) from a strictly defined list of available skills.

Guidelines:
1. You must ONLY select skills from the provided list: ${availableSkillsJson}.
2. Do not invent, hallucinate, or abbreviate new skills.
3. A task may require:
   - A single skill (e.g. ["Frontend"] or ["Backend"]).
   - Multiple skills if both client-side and server-side/database work are involved (e.g. ["Frontend", "Backend"]).
   - An empty array [] if the task title is completely non-technical or does not clearly match any of the available skills.
4. Return ONLY a valid JSON array of matching skill names.`;

    const userPrompt = `Available Skills: ${availableSkillsJson}

Here are examples of correct classifications:

Example 1:
Task: "As a visitor, I want to see a responsive homepage so that I can easily navigate on both desktop and mobile devices."
Output: ["Frontend"]

Example 2:
Task: "As a system administrator, I want audit logs of all data access and modifications so that I can ensure compliance with data protection regulations and investigate any security incidents."
Output: ["Backend"]

Example 3:
Task: "As a logged-in user, I want to update my profile information and upload a profile picture so that my account details are accurate and personalized."
Output: ["Frontend", "Backend"]

Now classify the following task:
Task: "${taskTitle}"
Output:`;

    logger.info(`[LLMService] Evaluating task: "${taskTitle}"`);
    logger.info(`[LLMService] Calling Gemini API (${this.model}) with key prefix: ${apiKey.slice(0, 4)}...`);

    const result = await this.callGeminiApi(systemPrompt, userPrompt);

    if (!result.ok) {
      let cleanError = result.text;
      try {
        const errorJson = JSON.parse(result.text);
        cleanError = errorJson?.error?.message || result.text;
      } catch {}

      logger.warn(`[LLMService] Gemini API error (${result.status}): ${cleanError}. Using intelligent fallback.`);
      return this.fallbackClassify(taskTitle, availableSkills);
    }

    try {
      const data: any = JSON.parse(result.text);
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        logger.warn('[LLMService] No content parts returned from Gemini API.');
        return {
          skillIds: [],
          identifiedNames: [],
          attempted: true,
          success: false,
          error: 'Gemini API returned empty candidate content.',
        };
      }

      logger.info(`[LLMService] Gemini raw output: ${rawText.trim()}`);

      let identifiedNames: string[] = [];
      try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          identifiedNames = parsed.map((item) => String(item).trim());
        }
      } catch (parseError) {
        logger.warn(`[LLMService] Failed to parse JSON response: "${rawText}"`);
        return {
          skillIds: [],
          identifiedNames: [],
          attempted: true,
          success: false,
          error: `Failed to parse AI output: "${rawText}"`,
        };
      }

      // Map returned skill names case-insensitively to available skill IDs
      const skillNameMap = new Map<string, number>();
      for (const skill of availableSkills) {
        skillNameMap.set(skill.name.toLowerCase(), skill.id);
      }

      const matchedSkillIds: number[] = [];
      for (const name of identifiedNames) {
        const id = skillNameMap.get(name.toLowerCase());
        if (id && !matchedSkillIds.includes(id)) {
          matchedSkillIds.push(id);
        }
      }

      logger.info(
        `[LLMService] Classification success -> Skills: ${JSON.stringify(identifiedNames)} | IDs: ${JSON.stringify(matchedSkillIds)}`
      );

      return {
        skillIds: matchedSkillIds,
        identifiedNames,
        attempted: true,
        success: true,
        rawResponse: rawText,
      };
    } catch (err: any) {
      logger.error(`[LLMService] Error parsing Gemini response: ${err.message || err}`);
      return {
        skillIds: [],
        identifiedNames: [],
        attempted: true,
        success: false,
        error: `Error processing AI response: ${err.message || err}`,
      };
    }
  }

  /**
   * Returns matching skill IDs (for backwards compatibility).
   */
  /**
   * Fallback rule-based classification when LLM quota is exhausted or network is unavailable.
   */
  private fallbackClassify(title: string, skills: SkillOption[]): SkillIdentificationResult {
    const lower = title.toLowerCase();
    const isFrontend = /frontend|ui|page|layout|design|drawer|screen|client|homepage|view|button|css|html|react|responsive|profile|settings/i.test(lower);
    const isBackend = /backend|api|database|backup|server|endpoint|storage|s3|auth|crud|sql|data|log|security|compliance/i.test(lower);
    const names: string[] = [];
    if (isFrontend) names.push('Frontend');
    if (isBackend) names.push('Backend');
    const matched = skills.filter((s) => names.includes(s.name));
    return {
      skillIds: matched.map((s) => s.id),
      identifiedNames: matched.map((s) => s.name),
      attempted: true,
      success: true,
    };
  }
}
