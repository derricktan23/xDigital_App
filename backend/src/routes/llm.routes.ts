/**
 * LLM diagnostic and testing routes.
 * Provides endpoints for checking Gemini API credentials and model connectivity.
 */
import { Router } from 'express';
import { LLMService } from '../services/llm.service';

const router = Router();
const llmService = new LLMService();

router.get('/status', async (_req, res) => {
  const result = await llmService.testConnection();
  res.status(result.success ? 200 : 500).json(result);
});

export default router;
