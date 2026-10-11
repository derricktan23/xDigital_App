import axios from 'axios';
import { Task, Developer, Skill, CreateTaskPayload, TaskStatus } from '../types';

// Standard base URL pointing to backend API server (5001)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>('/tasks');
  return response.data;
};

export const getDevelopers = async (): Promise<Developer[]> => {
  const response = await api.get<Developer[]>('/developers');
  return response.data;
};

export const getSkills = async (): Promise<Skill[]> => {
  const response = await api.get<Skill[]>('/skills');
  return response.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const response = await api.post<Task>('/tasks', payload);
  return response.data;
};

export const assignDeveloper = async (taskId: number, developerId: number | null): Promise<Task> => {
  const response = await api.patch<Task>(`/tasks/${taskId}/assign`, {
    developer_id: developerId,
  });
  return response.data;
};

export const updateTaskStatus = async (taskId: number, status: TaskStatus): Promise<Task> => {
  const response = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const updateTaskSkills = async (taskId: number, skillIds: number[]): Promise<Task> => {
  const response = await api.patch<Task>(`/tasks/${taskId}/skills`, { skill_ids: skillIds });
  return response.data;
};
