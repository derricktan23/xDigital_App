/**
 * Developer database repository.
 * Executes SQL queries to retrieve developer and skill data from PostgreSQL.
 */
import { Pool } from 'pg';
import defaultPool from '../config/db';
import { Developer, DeveloperWithSkills, Skill } from '../types';

export class DeveloperRepository {
  private pool: Pool;

  constructor(poolInstance: Pool = defaultPool) {
    this.pool = poolInstance;
  }

  async findById(id: number): Promise<Developer | null> {
    const query = 'SELECT id, name FROM developers WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findWithSkillsById(id: number): Promise<DeveloperWithSkills | null> {
    const devQuery = 'SELECT id, name FROM developers WHERE id = $1';
    const devResult = await this.pool.query(devQuery, [id]);

    if (devResult.rows.length === 0) {
      return null;
    }

    const developer = devResult.rows[0];

    const skillsQuery = `
      SELECT s.id, s.name 
      FROM skills s
      JOIN developer_skills ds ON s.id = ds.skill_id
      WHERE ds.developer_id = $1
      ORDER BY s.id ASC
    `;
    const skillsResult = await this.pool.query(skillsQuery, [id]);

    return {
      ...developer,
      skills: skillsResult.rows,
    };
  }

  async getDeveloperSkills(developerId: number): Promise<Skill[]> {
    const query = `
      SELECT s.id, s.name 
      FROM skills s
      JOIN developer_skills ds ON s.id = ds.skill_id
      WHERE ds.developer_id = $1
      ORDER BY s.id ASC
    `;
    const result = await this.pool.query(query, [developerId]);
    return result.rows;
  }

  async findAllWithSkills(): Promise<DeveloperWithSkills[]> {
    const query = `
      SELECT 
        d.id as developer_id, 
        d.name as developer_name, 
        s.id as skill_id, 
        s.name as skill_name
      FROM developers d
      LEFT JOIN developer_skills ds ON d.id = ds.developer_id
      LEFT JOIN skills s ON ds.skill_id = s.id
      ORDER BY d.id ASC, s.id ASC
    `;
    const result = await this.pool.query(query);

    const devMap = new Map<number, DeveloperWithSkills>();

    for (const row of result.rows) {
      if (!devMap.has(row.developer_id)) {
        devMap.set(row.developer_id, {
          id: row.developer_id,
          name: row.developer_name,
          skills: [],
        });
      }
      if (row.skill_id) {
        devMap.get(row.developer_id)!.skills.push({
          id: row.skill_id,
          name: row.skill_name,
        });
      }
    }

    return Array.from(devMap.values());
  }
}
