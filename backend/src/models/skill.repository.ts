/**
 * Skill database repository.
 * Executes SQL queries to retrieve skill records from PostgreSQL.
 */
import { Pool } from 'pg';
import defaultPool from '../config/db';
import { Skill } from '../types';

export class SkillRepository {
  private pool: Pool;

  constructor(poolInstance: Pool = defaultPool) {
    this.pool = poolInstance;
  }

  async findById(id: number): Promise<Skill | null> {
    const query = 'SELECT id, name FROM skills WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<Skill[]> {
    const query = 'SELECT id, name FROM skills ORDER BY id ASC';
    const result = await this.pool.query(query);
    return result.rows;
  }
}
