/**
 * Task database repository.
 * Handles SQL queries for creating, reading, updating, and assigning tasks in PostgreSQL.
 */
import { Pool } from 'pg';
import defaultPool from '../config/db';
import { Task, TaskWithDetails, Skill } from '../types';

export class TaskRepository {
  private pool: Pool;

  constructor(poolInstance: Pool = defaultPool) {
    this.pool = poolInstance;
  }

  async create(title: string, status: string = 'To-do'): Promise<Task> {
    const query = 'INSERT INTO tasks (title, status) VALUES ($1, $2) RETURNING id, title, status, assigned_developer_id';
    const result = await this.pool.query(query, [title, status]);
    return result.rows[0];
  }

  async addTaskSkills(taskId: number, skillIds: number[]): Promise<void> {
    if (!skillIds || skillIds.length === 0) return;

    // Filter unique skillIds to prevent primary key collisions
    const uniqueSkills = Array.from(new Set(skillIds));
    const valuePlaceholders = uniqueSkills
      .map((_, index) => `($1, $${index + 2})`)
      .join(', ');

    const query = `INSERT INTO task_skills (task_id, skill_id) VALUES ${valuePlaceholders} ON CONFLICT DO NOTHING`;
    await this.pool.query(query, [taskId, ...uniqueSkills]);
  }

  async findById(id: number): Promise<Task | null> {
    const query = 'SELECT id, title, status, assigned_developer_id FROM tasks WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findWithSkillsById(id: number): Promise<TaskWithDetails | null> {
    const taskQuery = `
      SELECT t.id, t.title, t.status, t.assigned_developer_id, d.name as developer_name
      FROM tasks t
      LEFT JOIN developers d ON t.assigned_developer_id = d.id
      WHERE t.id = $1
    `;
    const taskResult = await this.pool.query(taskQuery, [id]);

    if (taskResult.rows.length === 0) {
      return null;
    }

    const row = taskResult.rows[0];
    const skillsQuery = `
      SELECT s.id, s.name
      FROM skills s
      JOIN task_skills ts ON s.id = ts.skill_id
      WHERE ts.task_id = $1
      ORDER BY s.id ASC
    `;
    const skillsResult = await this.pool.query(skillsQuery, [id]);

    return {
      id: row.id,
      title: row.title,
      status: row.status,
      assigned_developer_id: row.assigned_developer_id,
      assigned_developer: row.assigned_developer_id
        ? { id: row.assigned_developer_id, name: row.developer_name }
        : null,
      skills: skillsResult.rows,
    };
  }

  async getTaskSkills(taskId: number): Promise<Skill[]> {
    const query = `
      SELECT s.id, s.name
      FROM skills s
      JOIN task_skills ts ON s.id = ts.skill_id
      WHERE ts.task_id = $1
      ORDER BY s.id ASC
    `;
    const result = await this.pool.query(query, [taskId]);
    return result.rows;
  }

  async assignDeveloper(taskId: number, developerId: number | null): Promise<Task> {
    const query = 'UPDATE tasks SET assigned_developer_id = $1 WHERE id = $2 RETURNING id, title, status, assigned_developer_id';
    const result = await this.pool.query(query, [developerId, taskId]);
    return result.rows[0];
  }

  async updateStatus(taskId: number, status: string): Promise<Task> {
    const query = 'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING id, title, status, assigned_developer_id';
    const result = await this.pool.query(query, [status, taskId]);
    return result.rows[0];
  }

  async findAllWithDetails(): Promise<TaskWithDetails[]> {
    const query = `
      SELECT 
        t.id as task_id,
        t.title,
        t.status,
        t.assigned_developer_id,
        d.name as developer_name,
        s.id as skill_id,
        s.name as skill_name
      FROM tasks t
      LEFT JOIN developers d ON t.assigned_developer_id = d.id
      LEFT JOIN task_skills ts ON t.id = ts.task_id
      LEFT JOIN skills s ON ts.skill_id = s.id
      ORDER BY t.id ASC, s.id ASC
    `;
    const result = await this.pool.query(query);

    const taskMap = new Map<number, TaskWithDetails>();

    for (const row of result.rows) {
      if (!taskMap.has(row.task_id)) {
        taskMap.set(row.task_id, {
          id: row.task_id,
          title: row.title,
          status: row.status,
          assigned_developer_id: row.assigned_developer_id,
          assigned_developer: row.assigned_developer_id
            ? { id: row.assigned_developer_id, name: row.developer_name }
            : null,
          skills: [],
        });
      }
      if (row.skill_id) {
        taskMap.get(row.task_id)!.skills.push({
          id: row.skill_id,
          name: row.skill_name,
        });
      }
    }

    return Array.from(taskMap.values());
  }
}
