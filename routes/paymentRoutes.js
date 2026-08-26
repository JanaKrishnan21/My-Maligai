import express from 'express';
import {
  getPayments,
  createPayment,
  getPaymentStats,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.get('/stats', getPaymentStats);

export default router;
