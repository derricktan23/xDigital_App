/**
 * Developer business logic service.
 * Coordinates developer operations and enforces business rules for DeveloperRepository.
 */
import { DeveloperRepository } from '../models/developer.repository';
import { DeveloperWithSkills, CustomError } from '../types';

export class DeveloperService {
  constructor(private developerRepository: DeveloperRepository = new DeveloperRepository()) {}

  async getDeveloperById(id: number): Promise<DeveloperWithSkills> {
    const developer = await this.developerRepository.findWithSkillsById(id);
    if (!developer) {
      throw new CustomError('Developer not found', 404);
    }
    return developer;
  }

  async getAllDevelopers(): Promise<DeveloperWithSkills[]> {
    return this.developerRepository.findAllWithSkills();
  }
}
