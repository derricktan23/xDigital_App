export type TaskStatus = 'To-do' | 'In Progress' | 'Done';

export interface Skill {
  id: number;
  name: string;
}

export interface Developer {
  id: number;
  name: string;
  skills: Skill[];
}

export interface AIRecommendationResult {
  attempted: boolean;
  success: boolean;
  identifiedSkills?: string[];
  error?: string;
}

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assigned_developer_id: number | null;
  assigned_developer?: { id: number; name: string } | null;
  skills: Skill[];
  parent_task_id?: number | null;
  ai_recommendation?: AIRecommendationResult;
}

export interface CreateTaskPayload {
  title: string;
  status?: TaskStatus;
  task_skills?: number[];
  parent_task_id?: number | null;
  subtasks?: CreateTaskPayload[];
}

