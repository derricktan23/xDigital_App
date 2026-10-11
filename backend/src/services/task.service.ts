/**
 * Task business logic service.
 * Manages task workflows, validates inputs, and ensures developers have required skills before assignment.
 */
import { TaskRepository } from '../models/task.repository';
import { DeveloperRepository } from '../models/developer.repository';
import { SkillRepository } from '../models/skill.repository';
import { TaskWithDetails, CreateTaskDTO, CustomError } from '../types';

export class TaskService {
  constructor(
    private taskRepository: TaskRepository = new TaskRepository(),
    private developerRepository: DeveloperRepository = new DeveloperRepository(),
    private skillRepository: SkillRepository = new SkillRepository()
  ) {}

  async createTask(dto: CreateTaskDTO): Promise<TaskWithDetails> {
    if (!dto.title || dto.title.trim() === '') {
      throw new CustomError('Task title is required', 400);
    }

    const status = dto.status || 'To-do';
    const task = await this.taskRepository.create(dto.title, status);

    if (dto.task_skills && dto.task_skills.length > 0) {
      await this.taskRepository.addTaskSkills(task.id, dto.task_skills);
    }

    const createdTask = await this.taskRepository.findWithSkillsById(task.id);
    if (!createdTask) {
      throw new CustomError('Failed to fetch created task', 500);
    }
    return createdTask;
  }

  async getTaskById(id: number): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findWithSkillsById(id);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }
    return task;
  }

  async getAllTasks(): Promise<TaskWithDetails[]> {
    return this.taskRepository.findAllWithDetails();
  }

  async assignDeveloperToTask(taskId: number, developerId: number): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }

    const developer = await this.developerRepository.findById(developerId);
    if (!developer) {
      throw new CustomError('Developer not found', 404);
    }

    const requiredSkills = await this.taskRepository.getTaskSkills(taskId);
    const developerSkills = await this.developerRepository.getDeveloperSkills(developerId);

    const devSkillIdSet = new Set(developerSkills.map((s) => s.id));
    const missingSkills = requiredSkills.filter((skill) => !devSkillIdSet.has(skill.id));

    if (missingSkills.length > 0) {
      const missingSkillNames = missingSkills.map((s) => s.name).join(', ');
      throw new CustomError(
        `Developer ${developer.name} lacks required skill(s): ${missingSkillNames}`,
        400
      );
    }

    await this.taskRepository.assignDeveloper(taskId, developerId);

    const updatedTask = await this.taskRepository.findWithSkillsById(taskId);
    if (!updatedTask) {
      throw new CustomError('Failed to fetch updated task', 500);
    }

    return updatedTask;
  }

  async updateTaskStatus(taskId: number, status: string): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }

    if (!status || status.trim() === '') {
      throw new CustomError('Status is required', 400);
    }

    await this.taskRepository.updateStatus(taskId, status);

    const updatedTask = await this.taskRepository.findWithSkillsById(taskId);
    if (!updatedTask) {
      throw new CustomError('Failed to fetch updated task', 500);
    }

    return updatedTask;
  }
}
