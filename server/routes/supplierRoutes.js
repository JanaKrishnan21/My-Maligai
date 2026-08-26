import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(authorize('admin'), createSupplier);

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('admin'), updateSupplier)
  .delete(authorize('admin'), deleteSupplier);

export default router;
