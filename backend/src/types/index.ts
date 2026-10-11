/**
 * Application TypeScript types and interfaces.
 * Defines domain entities, Data Transfer Objects (DTOs), and custom error classes.
 */
export interface Skill {
  id: number;
  name: string;
}

export interface Developer {
  id: number;
  name: string;
}

export interface DeveloperWithSkills extends Developer {
  skills: Skill[];
}

export type TaskStatus = 'To-do' | 'In Progress' | 'Done';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus | string;
  assigned_developer_id: number | null;
}

export interface TaskWithDetails extends Task {
  skills: Skill[];
  assigned_developer?: Developer | null;
}

export interface CreateTaskDTO {
  title: string;
  status?: string;
  task_skills?: number[]; // array of skill IDs
}

export interface AssignTaskDTO {
  developer_id: number | null;
}

export interface UpdateStatusDTO {
  status: string;
}

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
