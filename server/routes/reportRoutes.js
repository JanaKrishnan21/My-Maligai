import express from 'express';
import { getSales, getPayments, getCredit, getProducts } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Reports are owner/admin level

router.get('/sales', getSales);
router.get('/payments', getPayments);
router.get('/credit', getCredit);
router.get('/products', getProducts);

export default router;
