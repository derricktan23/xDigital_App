/**
 * Skill route definitions.
 * Maps skill REST endpoints to SkillController handlers.
 */
import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';

const router = Router();
const skillController = new SkillController();

router.get('/', skillController.getAllSkills);
router.get('/:id', skillController.getSkillById);

export default router;
