import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import { settleCustomerCredit } from '../services/customerService.js';
import { getPaymentReport } from '../services/reportService.js';

export const getPayments = async (req, res, next) => {
  try {
    const {
      customerId,
      paymentMethod,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
    } = req.query;

    const query = {};

    if (customerId) query.customer = customerId;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
    if (type && type !== 'all') query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate('customer', 'name phone balance')
      .populate('bill', 'invoiceNumber total')
      .populate('receivedBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      payments,
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { customerId, amount, paymentMethod, notes } = req.body;
    const result = await settleCustomerCredit({
      customerId,
      amount,
      paymentMethod,
      notes,
      receivedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${amount} recorded successfully`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (req, res, next) => {
  try {
    const data = await getPaymentReport();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
