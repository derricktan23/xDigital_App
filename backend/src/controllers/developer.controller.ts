/**
 * Developer HTTP controller.
 * Handles incoming developer requests and delegates operations to DeveloperService.
 */
import { Request, Response, NextFunction } from 'express';
import { DeveloperService } from '../services/developer.service';

export class DeveloperController {
  constructor(private developerService: DeveloperService = new DeveloperService()) { }

  getDeveloperById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid developer ID' });
        return;
      }
      const developer = await this.developerService.getDeveloperById(id);
      res.status(200).json(developer);
    } catch (error) {
      next(error);
    }
  };

  getAllDevelopers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const developers = await this.developerService.getAllDevelopers();
      res.status(200).json(developers);
    } catch (error) {
      next(error);
    }
  };
}
