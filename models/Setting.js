import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'My Maligai',
    },
    shopTagline: {
      type: String,
      default: 'Grocery Shop Management',
    },
    ownerName: {
      type: String,
      default: 'Shop Owner',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@mymaligai.com',
    },
    address: {
      type: String,
      default: '12/4 Market Road, Near City Bus Stand, City - 600001',
    },
    gstNumber: {
      type: String,
      default: '33AAAAA0000A1Z5',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
    },
    reminderIntervalDays: {
      type: Number,
      default: 2,
    },
    lowStockThresholdDefault: {
      type: Number,
      default: 5,
    },
    enableAutoReminders: {
      type: Boolean,
      default: true,
    },
    whatsappConfig: {
      accessToken: { type: String, default: '' },
      phoneNumberId: { type: String, default: '' },
      businessAccountId: { type: String, default: '' },
    },
    thermalPaperWidth: {
      type: String,
      enum: ['58mm', '80mm', 'a4'],
      default: '80mm',
    },
    footerMessage: {
      type: String,
      default: 'Thank you for shopping with us! Visit again.',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Setting', settingSchema);
