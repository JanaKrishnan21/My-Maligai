import express from 'express';
import { login, getMe, logout, listUsers, createUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), listUsers);
router.post('/users', protect, authorize('admin'), createUser);

export default router;
