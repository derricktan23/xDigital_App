/**
 * Task HTTP controller.
 * Handles API endpoints for creating, retrieving, assigning, and updating tasks.
 */
import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';

export class TaskController {
  constructor(private taskService: TaskService = new TaskService()) {}

  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, status, task_skills, parent_task_id, subtasks } = req.body;
      const task = await this.taskService.createTask({
        title,
        status,
        task_skills,
        parent_task_id,
        subtasks,
      });
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }
      const task = await this.taskService.getTaskById(id);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  getAllTasks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await this.taskService.getAllTasks();
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  };

  assignDeveloper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const developerId = parseInt(req.body.developer_id, 10);

      if (isNaN(taskId)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }
      if (isNaN(developerId)) {
        res.status(400).json({ error: 'Invalid or missing developer_id' });
        return;
      }

      const updatedTask = await this.taskService.assignDeveloperToTask(taskId, developerId);
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { status } = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const updatedTask = await this.taskService.updateTaskStatus(taskId, status);
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  updateTaskSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { skill_ids } = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }
      if (!Array.isArray(skill_ids)) {
        res.status(400).json({ error: 'skill_ids must be an array of skill IDs' });
        return;
      }

      const updatedTask = await this.taskService.updateTaskSkills(taskId, skill_ids);
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  recommendSkillsForTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id, 10);
      if (isNaN(taskId)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }
      const result = await this.taskService.recommendSkillsForTask(taskId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
