/**
 * Developer route definitions.
 * Maps developer REST endpoints to DeveloperController handlers.
 */
import { Router } from 'express';
import { DeveloperController } from '../controllers/developer.controller';

const router = Router();
const developerController = new DeveloperController();

router.get('/', developerController.getAllDevelopers);
router.get('/:id', developerController.getDeveloperById);

export default router;
