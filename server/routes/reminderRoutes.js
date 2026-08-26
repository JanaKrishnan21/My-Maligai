import express from 'express';
import {
  getPendingReminders,
  sendReminderHandler,
  getReminderLogs,
} from '../controllers/reminderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/pending', getPendingReminders);
router.post('/send', sendReminderHandler);
router.get('/logs', getReminderLogs);

export default router;
