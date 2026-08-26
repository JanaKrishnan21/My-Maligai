import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import StockMovement from '../models/StockMovement.js';
import Setting from '../models/Setting.js';
import { processNewBill, generateInvoiceNumber } from '../services/billingService.js';
import { formatWhatsAppBillMessage, generateWhatsAppLink } from '../services/whatsappService.js';

export const createBill = async (req, res, next) => {
  try {
    const {
      customerId,
      customerPhone,
      customerName,
      items,
      discount,
      amountPaid,
      paymentMethod,
      splitDetails,
      notes,
    } = req.body;

    const result = await processNewBill({
      customerId,
      customerPhone,
      customerName,
      items,
      discount,
      amountPaid,
      paymentMethod,
      splitDetails,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Bill #${result.bill.invoiceNumber} created successfully`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const {
      search,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
      ];
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

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
    const total = await Bill.countDocuments(query);

    const bills = await Bill.find(query)
      .populate('customer', 'name phone balance')
      .populate('createdBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: bills.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      bills,
    });
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name phone address balance')
      .populate('createdBy', 'name username');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const shopSetting = await Setting.findOne();
    const whatsAppMessage = formatWhatsAppBillMessage(bill, shopSetting);
    const targetPhone = bill.customer?.phone || bill.customerSnapshot?.phone;
    const whatsAppLink = targetPhone ? generateWhatsAppLink(targetPhone, whatsAppMessage) : null;

    res.json({
      success: true,
      bill,
      shopSetting,
      whatsAppMessage,
      whatsAppLink,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.paymentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Bill is already cancelled' });
    }

    // 1. Restore product inventory
    for (const item of bill.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const oldStock = product.stock;
        const newStock = Number((oldStock + item.quantity).toFixed(2));
        product.stock = newStock;
        await product.save();

        await StockMovement.create({
          product: product._id,
          type: 'return',
          quantity: item.quantity,
          previousStock: oldStock,
          newStock,
          purchasePrice: item.purchasePrice || 0,
          reference: `Cancelled Bill #${bill.invoiceNumber}`,
          notes: 'Bill cancellation return',
          createdBy: req.user._id,
        });
      }
    }

    // 2. Revert customer balance if credit was given
    if (bill.customer && bill.balance > 0) {
      const customer = await Customer.findById(bill.customer);
      if (customer) {
        customer.balance = Math.max(0, Number((customer.balance - bill.balance).toFixed(2)));
        customer.totalPurchases = Math.max(0, Number((customer.totalPurchases - bill.total).toFixed(2)));
        customer.totalPaid = Math.max(0, Number((customer.totalPaid - bill.amountPaid).toFixed(2)));
        await customer.save();
      }
    }

    bill.paymentStatus = 'cancelled';
    bill.notes = `${bill.notes || ''} [CANCELLED by ${req.user.name} on ${new Date().toLocaleString('en-IN')}]`.trim();
    await bill.save();

    res.json({
      success: true,
      message: `Bill #${bill.invoiceNumber} has been cancelled and stock restored`,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextInvoice = async (req, res, next) => {
  try {
    const nextInvoice = await generateInvoiceNumber();
    res.json({ success: true, nextInvoiceNumber: nextInvoice });
  } catch (error) {
    next(error);
  }
};
