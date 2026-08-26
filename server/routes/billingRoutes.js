import express from 'express';
import {
  createBill,
  getBills,
  getBillById,
  cancelBill,
  getNextInvoice,
} from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBills)
  .post(createBill);

router.get('/next-invoice', getNextInvoice);

router.route('/:id')
  .get(getBillById);

router.post('/:id/cancel', authorize('admin'), cancelBill);

export default router;
