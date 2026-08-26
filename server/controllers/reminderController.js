import {
  getPendingCreditCustomers,
  sendCustomerReminder,
} from '../services/reminderService.js';
import Reminder from '../models/Reminder.js';

export const getPendingReminders = async (req, res, next) => {
  try {
    const list = await getPendingCreditCustomers();
    res.json({ success: true, count: list.length, customers: list });
  } catch (error) {
    next(error);
  }
};

export const sendReminderHandler = async (req, res, next) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }

    const result = await sendCustomerReminder(customerId, true);
    res.json({
      success: true,
      message: 'Reminder sent / link generated successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReminderLogs = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Reminder.countDocuments();

    const reminders = await Reminder.find()
      .populate('customer', 'name phone balance')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: reminders.length,
      total,
      reminders,
    });
  } catch (error) {
    next(error);
  }
};
