/**
 * Skill HTTP controller.
 * Handles incoming skill requests and delegates operations to SkillService.
 */
import { Request, Response, NextFunction } from 'express';
import { SkillService } from '../services/skill.service';

export class SkillController {
  constructor(private skillService: SkillService = new SkillService()) {}

  getSkillById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid skill ID' });
        return;
      }
      const skill = await this.skillService.getSkillById(id);
      res.status(200).json(skill);
    } catch (error) {
      next(error);
    }
  };

  getAllSkills = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const skills = await this.skillService.getAllSkills();
      res.status(200).json(skills);
    } catch (error) {
      next(error);
    }
  };
}
