import express from 'express';
import {
  getCustomers,
  getCustomerByPhone,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedgerHandler,
  settleCreditHandler,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.get('/phone/:phone', getCustomerByPhone);
router.get('/:id/ledger', getCustomerLedgerHandler);
router.post('/:id/pay', settleCreditHandler);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

export default router;
