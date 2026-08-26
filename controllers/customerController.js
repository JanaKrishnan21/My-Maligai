import Customer from '../models/Customer.js';
import { findCustomerByPhone, settleCustomerCredit, getCustomerLedger } from '../services/customerService.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, hasBalance, sortBy = 'createdAt', order = 'desc', limit = 50, page = 1 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasBalance === 'true') {
      query.balance = { $gt: 0 };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const result = await findCustomerByPhone(phone);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Customer not found with this phone number' });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes, initialBalance = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      notes: notes || '',
      balance: Number(initialBalance || 0),
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (phone && phone.trim() !== customer.phone) {
      const existing = await Customer.findOne({ phone: phone.trim() });
      if (existing && existing._id.toString() !== customer._id.toString()) {
        return res.status(400).json({ success: false, message: 'Another customer already uses this phone number' });
      }
      customer.phone = phone.trim();
    }

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();
    if (address !== undefined) customer.address = address.trim();
    if (notes !== undefined) customer.notes = notes;

    await customer.save();

    res.json({ success: true, message: 'Customer updated successfully', customer });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (customer.balance > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with an active credit balance of ₹${customer.balance}. Please clear the balance first.`,
      });
    }

    await customer.deleteOne();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCustomerLedgerHandler = async (req, res, next) => {
  try {
    const data = await getCustomerLedger(req.params.id);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const settleCreditHandler = async (req, res, next) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const result = await settleCustomerCredit({
      customerId: req.params.id,
      amount,
      paymentMethod,
      notes,
      receivedBy: req.user._id,
    });

    res.json({
      success: true,
      message: `Payment of ₹${amount} recorded successfully`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
