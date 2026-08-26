import {
  getSalesReport,
  getPaymentReport,
  getCreditReport,
  getProductReport,
} from '../services/reportService.js';

export const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, range } = req.query;
    const data = await getSalesReport({ startDate, endDate, range });
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const data = await getPaymentReport();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getCredit = async (req, res, next) => {
  try {
    const data = await getCreditReport();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const data = await getProductReport();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
