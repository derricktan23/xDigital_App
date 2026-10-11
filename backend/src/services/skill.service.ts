/**
 * Skill business logic service.
 * Coordinates skill operations and enforces business rules for SkillRepository.
 */
import { SkillRepository } from '../models/skill.repository';
import { Skill, CustomError } from '../types';

export class SkillService {
  constructor(private skillRepository: SkillRepository = new SkillRepository()) {}

  async getSkillById(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new CustomError('Skill not found', 404);
    }
    return skill;
  }

  async getAllSkills(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }
}
