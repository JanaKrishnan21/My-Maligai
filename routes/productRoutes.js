import express from 'express';
import {
  getProducts,
  getProductByBarcode,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.get('/barcode/:barcode', getProductByBarcode);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(authorize('admin'), deleteProduct);

export default router;
