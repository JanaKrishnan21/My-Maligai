import express from 'express';
import {
  getInventorySummaryHandler,
  restockHandler,
  adjustStockHandler,
  getStockMovements,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getInventorySummaryHandler);
router.post('/restock', restockHandler);
router.post('/adjust', adjustStockHandler);
router.get('/movements', getStockMovements);

export default router;
