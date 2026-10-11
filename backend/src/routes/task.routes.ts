/**
 * Task route definitions.
 * Maps task REST endpoints to TaskController handlers.
 */
import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const router = Router();
const taskController = new TaskController();

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.patch('/:id/assign', taskController.assignDeveloper);
router.patch('/:id/status', taskController.updateStatus);
router.patch('/:id/skills', taskController.updateTaskSkills);

export default router;
