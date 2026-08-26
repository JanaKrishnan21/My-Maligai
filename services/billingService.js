import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import StockMovement from '../models/StockMovement.js';
import Setting from '../models/Setting.js';
import { formatWhatsAppBillMessage, generateWhatsAppLink } from './whatsappService.js';

export const generateInvoiceNumber = async () => {
  const setting = await Setting.findOne();
  const prefix = setting?.invoicePrefix || 'INV';
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Find the highest invoice number for today
  const searchPattern = new RegExp(`^${prefix}-${dateStr}-`);
  const lastBill = await Bill.findOne({ invoiceNumber: searchPattern })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let seq = 1;
  if (lastBill && lastBill.invoiceNumber) {
    const parts = lastBill.invoiceNumber.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(seq).padStart(4, '0');
  return `${prefix}-${dateStr}-${paddedSeq}`;
};

export const processNewBill = async ({
  customerId,
  customerPhone,
  customerName,
  items,
  discount = 0,
  amountPaid = 0,
  paymentMethod = 'cash',
  splitDetails = {},
  notes = '',
  userId,
}) => {
  if (!items || items.length === 0) {
    throw new Error('Bill must contain at least one item');
  }

  // 1. Resolve and validate customer (Strictly required)
  let customer = null;
  let prevBalance = 0;

  if (customerId) {
    customer = await Customer.findById(customerId);
  } else if (customerPhone && customerPhone.trim()) {
    customer = await Customer.findOne({ phone: customerPhone.trim() });
    if (!customer && customerName && customerName.trim()) {
      // Auto-create customer if name provided with phone
      customer = await Customer.create({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        balance: 0,
      });
    }
  }

  if (!customer) {
    throw new Error('Please enter or select a customer before proceeding to payment.');
  }

  if (!customer.name || !customer.phone) {
    throw new Error('Customer name and valid mobile number are required.');
  }

  prevBalance = customer.balance || 0;

  // 2. Validate products and calculate server totals
  let calculatedSubtotal = 0;
  const processedItems = [];
  const stockDeductions = [];

  for (const item of items) {
    const product = await Product.findById(item.productId || item.product);
    if (!product) {
      throw new Error(`Product not found: ${item.name || item.productId}`);
    }

    const qty = Number(item.quantity);
    if (qty <= 0) {
      throw new Error(`Invalid quantity for product: ${product.name}`);
    }

    if (product.stock < qty) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock} ${product.unit}, Requested: ${qty}`);
    }

    const sellingPrice = Number(item.sellingPrice !== undefined ? item.sellingPrice : product.sellingPrice);
    const purchasePrice = Number(product.purchasePrice || 0);
    const lineTotal = Number((qty * sellingPrice).toFixed(2));

    calculatedSubtotal += lineTotal;

    processedItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku || '',
      unit: product.unit || 'piece',
      quantity: qty,
      purchasePrice,
      sellingPrice,
      total: lineTotal,
    });

    stockDeductions.push({
      product,
      quantity: qty,
      purchasePrice,
    });
  }

  calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
  const cleanDiscount = Math.min(Number(discount || 0), calculatedSubtotal);
  const calculatedTotal = Number((calculatedSubtotal - cleanDiscount).toFixed(2));
  const totalOutstanding = Number((prevBalance + calculatedTotal).toFixed(2));
  const cleanAmountPaid = Math.min(Number(amountPaid || 0), totalOutstanding);
  const billPaidPortion = Math.min(cleanAmountPaid, calculatedTotal);
  const billBalance = Number((calculatedTotal - billPaidPortion).toFixed(2));
  const newBalance = Math.max(0, Number((totalOutstanding - cleanAmountPaid).toFixed(2)));

  // Determine Payment Status
  let paymentStatus = 'paid';
  if (cleanAmountPaid === 0) {
    paymentStatus = 'credit';
  } else if (cleanAmountPaid < calculatedTotal) {
    paymentStatus = 'partially_paid';
  }

  const invoiceNumber = await generateInvoiceNumber();

  // 3. Update customer balance and purchase statistics
  if (customer) {
    customer.balance = newBalance;
    customer.totalPurchases = Number(((customer.totalPurchases || 0) + calculatedTotal).toFixed(2));
    customer.totalPaid = Number(((customer.totalPaid || 0) + cleanAmountPaid).toFixed(2));
    customer.lastPurchaseAt = new Date();
    await customer.save();
  }

  // 4. Create the Bill
  const newBill = await Bill.create({
    invoiceNumber,
    customer: customer ? customer._id : null,
    customerSnapshot: {
      name: customer ? customer.name : (customerName || 'Customer'),
      phone: customer ? customer.phone : (customerPhone || ''),
    },
    items: processedItems,
    subtotal: calculatedSubtotal,
    discount: cleanDiscount,
    total: calculatedTotal,
    amountPaid: cleanAmountPaid,
    balance: billBalance,
    previousCustomerBalance: prevBalance,
    newCustomerBalance: newBalance,
    paymentStatus,
    paymentMethod,
    splitDetails,
    notes,
    createdBy: userId,
  });

  // 5. Deduct stock and record stock movements
  for (const deduction of stockDeductions) {
    const { product, quantity, purchasePrice } = deduction;
    const oldStock = product.stock;
    const updatedStock = Number((oldStock - quantity).toFixed(2));

    product.stock = updatedStock;
    await product.save();

    await StockMovement.create({
      product: product._id,
      type: 'sale',
      quantity: -quantity,
      previousStock: oldStock,
      newStock: updatedStock,
      purchasePrice,
      reference: `Bill #${invoiceNumber}`,
      createdBy: userId,
      notes: `Sale to ${customer ? customer.name : (customerName || 'Walk-in')}`,
    });
  }

  // 6. Record Payment entry if amount was paid
  if (cleanAmountPaid > 0 && customer) {
    await Payment.create({
      customer: customer._id,
      bill: newBill._id,
      amount: cleanAmountPaid,
      paymentMethod,
      type: 'bill_payment',
      previousBalance: prevBalance,
      newBalance: Number((prevBalance + billBalance).toFixed(2)),
      receivedBy: userId,
      notes: `Payment for Bill #${invoiceNumber}`,
    });
  }

  // 7. Prepare WhatsApp payload
  const shopSetting = await Setting.findOne();
  const whatsAppMessage = formatWhatsAppBillMessage(newBill, shopSetting);
  const targetPhone = customer ? customer.phone : customerPhone;
  const whatsAppLink = targetPhone ? generateWhatsAppLink(targetPhone, whatsAppMessage) : null;

  return {
    bill: newBill,
    whatsAppMessage,
    whatsAppLink,
  };
};
