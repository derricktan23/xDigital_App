/**
 * Task business logic service.
 * Manages task workflows, validates inputs, and ensures developers have required skills before assignment.
 */
import { TaskRepository } from '../models/task.repository';
import { DeveloperRepository } from '../models/developer.repository';
import { SkillRepository } from '../models/skill.repository';
import { LLMService } from './llm.service';
import { Skill, TaskWithDetails, CreateTaskDTO, CustomError } from '../types';

export class TaskService {
  constructor(
    private taskRepository: TaskRepository = new TaskRepository(),
    private developerRepository: DeveloperRepository = new DeveloperRepository(),
    private skillRepository: SkillRepository = new SkillRepository(),
    private llmService: LLMService = new LLMService()
  ) {}

  async createTask(dto: CreateTaskDTO, parentTaskId: number | null = null): Promise<TaskWithDetails> {
    if (!dto.title || dto.title.trim() === '') {
      throw new CustomError('Task title is required', 400);
    }

    const status = dto.status || 'To-do';
    const parentId = dto.parent_task_id ?? parentTaskId;
    const task = await this.taskRepository.create(dto.title, status, parentId);

    // If user provided task_skills, attach them directly.
    if (dto.task_skills && dto.task_skills.length > 0) {
      await this.taskRepository.addTaskSkills(task.id, dto.task_skills);
    }

    if (dto.subtasks && dto.subtasks.length > 0) {
      for (const subtaskDto of dto.subtasks) {
        await this.createTask(subtaskDto, task.id);
      }
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

  async assignDeveloperToTask(taskId: number, developerId: number | null): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }

    if (developerId === null) {
      await this.taskRepository.assignDeveloper(taskId, null);
      const updatedTask = await this.taskRepository.findWithSkillsById(taskId);
      if (!updatedTask) {
        throw new CustomError('Failed to fetch updated task', 500);
      }
      return updatedTask;
    }

    const developer = await this.developerRepository.findById(developerId);
    if (!developer) {
      throw new CustomError('Developer not found', 404);
    }

    const requiredSkills = await this.taskRepository.getTaskSkills(taskId);
    if (requiredSkills.length === 0) {
      throw new CustomError('Cannot assign developer: Task has no required skills defined', 400);
    }

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

    // Business Rule 4.2: A task can only have its status changed to "Done" if all its subtasks are "Done"
    if (status === 'Done') {
      const incompleteSubtasks = await this.taskRepository.getIncompleteSubtasks(taskId);
      if (incompleteSubtasks.length > 0) {
        const incompleteList = incompleteSubtasks
          .map((sub) => `"${sub.title}" (${sub.status})`)
          .join(', ');
        throw new CustomError(
          `Cannot mark task as Done: all subtasks must be Done first. Incomplete subtask(s): ${incompleteList}`,
          400
        );
      }
    }

    await this.taskRepository.updateStatus(taskId, status);

    const updatedTask = await this.taskRepository.findWithSkillsById(taskId);
    if (!updatedTask) {
      throw new CustomError('Failed to fetch updated task', 500);
    }

    return updatedTask;
  }

  async updateTaskSkills(taskId: number, skillIds: number[]): Promise<TaskWithDetails> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }

    // If developer is currently assigned, ensure developer has all new required skills
    if (task.assigned_developer_id && skillIds.length > 0) {
      const developerSkills = await this.developerRepository.getDeveloperSkills(task.assigned_developer_id);
      const devSkillIdSet = new Set(developerSkills.map((s) => s.id));
      const missingSkillIds = skillIds.filter((skId) => !devSkillIdSet.has(skId));

      if (missingSkillIds.length > 0) {
        const developer = await this.developerRepository.findById(task.assigned_developer_id);
        const devName = developer ? developer.name : 'The assigned developer';
        throw new CustomError(
          `Assigned developer ${devName} lacks one or more newly required skills. Please unassign or reassign first.`,
          400
        );
      }
    }

    await this.taskRepository.setTaskSkills(taskId, skillIds);

    const updatedTask = await this.taskRepository.findWithSkillsById(taskId);
    if (!updatedTask) {
      throw new CustomError('Failed to fetch updated task', 500);
    }

    return updatedTask;
  }

  async recommendSkillsForTask(taskId: number): Promise<{ taskId: number; identifiedSkills: string[]; skills: Skill[] }> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new CustomError('Task not found', 404);
    }

    const allSkills = await this.skillRepository.findAll();
    const rec = await this.llmService.identifySkillsDetail(task.title, allSkills);
    const recommendedSkills = allSkills.filter((s) => rec.skillIds.includes(s.id));

    return {
      taskId: task.id,
      identifiedSkills: rec.identifiedNames,
      skills: recommendedSkills,
    };
  }
}
