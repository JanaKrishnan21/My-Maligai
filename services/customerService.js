import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import { formatWhatsAppReminderMessage, generateWhatsAppLink } from './whatsappService.js';

export const findCustomerByPhone = async (phone) => {
  if (!phone) return null;
  const cleanPhone = phone.trim();

  // Try exact match first
  let customer = await Customer.findOne({ phone: cleanPhone });
  
  // If not found, try suffix matching (for 10-digit mobile if +91 was entered or vice versa)
  if (!customer && cleanPhone.length >= 10) {
    const last10 = cleanPhone.slice(-10);
    customer = await Customer.findOne({ phone: new RegExp(last10 + '$') });
  }

  if (!customer) return null;

  // Fetch recent bill and payment
  const lastBill = await Bill.findOne({ customer: customer._id }).sort({ createdAt: -1 });
  const recentPayments = await Payment.find({ customer: customer._id })
    .sort({ createdAt: -1 })
    .limit(5);

  const shopSetting = await Setting.findOne();
  const reminderMessage = formatWhatsAppReminderMessage(customer, shopSetting);
  const reminderLink = generateWhatsAppLink(customer.phone, reminderMessage);

  return {
    customer,
    lastBill,
    recentPayments,
    reminderMessage,
    reminderLink,
  };
};

export const settleCustomerCredit = async ({ customerId, amount, paymentMethod = 'cash', notes = '', receivedBy }) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const payAmount = Number(amount);
  if (payAmount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const previousBalance = customer.balance || 0;
  const newBalance = Number((previousBalance - payAmount).toFixed(2));

  customer.balance = newBalance;
  customer.totalPaid = Number(((customer.totalPaid || 0) + payAmount).toFixed(2));
  await customer.save();

  const payment = await Payment.create({
    customer: customer._id,
    amount: payAmount,
    paymentMethod,
    type: 'credit_settlement',
    previousBalance,
    newBalance,
    notes: notes || `Settlement of outstanding credit. Old: ₹${previousBalance}, New: ₹${newBalance}`,
    receivedBy,
  });

  const shopSetting = await Setting.findOne();
  const receiptMessage = 
`🧾 *PAYMENT RECEIPT - ${(shopSetting?.shopName || 'MY MALIGAI').toUpperCase()}*

Dear *${customer.name}*,

We have received your payment of *₹${payAmount.toFixed(2)}* via *${paymentMethod.toUpperCase()}*.

• Previous Balance: ₹${previousBalance.toFixed(2)}
• Amount Paid: ₹${payAmount.toFixed(2)}
• Remaining Balance: *₹${newBalance.toFixed(2)}*

Thank you for your timely payment!
📞 Contact: ${shopSetting?.phone || ''}`;

  const whatsAppLink = generateWhatsAppLink(customer.phone, receiptMessage);

  return {
    customer,
    payment,
    whatsAppReceiptMessage: receiptMessage,
    whatsAppLink,
  };
};

export const getCustomerLedger = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error('Customer not found');

  const bills = await Bill.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');

  const payments = await Payment.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate('receivedBy', 'name');

  // Combine bills and payments into a chronological timeline
  const timeline = [
    ...bills.map((b) => ({
      _id: b._id,
      type: 'bill',
      date: b.createdAt,
      reference: b.invoiceNumber,
      description: `Purchase: ${b.items.length} items`,
      billTotal: b.total,
      paid: b.amountPaid,
      balanceAdded: b.balance,
      paymentMethod: b.paymentMethod,
      itemsSummary: b.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', '),
      operator: b.createdBy?.name || 'Staff',
      details: b,
    })),
    ...payments.map((p) => ({
      _id: p._id,
      type: 'payment',
      date: p.createdAt,
      reference: p.type === 'credit_settlement' ? 'CREDIT-PAY' : 'BILL-PAY',
      description: p.type === 'credit_settlement' ? 'Credit Repayment' : 'Bill Counter Payment',
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      previousBalance: p.previousBalance,
      newBalance: p.newBalance,
      notes: p.notes,
      operator: p.receivedBy?.name || 'Staff',
      details: p,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    customer,
    timeline,
    billsCount: bills.length,
    paymentsCount: payments.length,
  };
};
