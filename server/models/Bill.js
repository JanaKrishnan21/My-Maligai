import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: 'piece',
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be at least 0.01'],
  },
  purchasePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: [0, 'Selling price cannot be negative'],
  },
  total: {
    type: Number,
    required: true,
  },
});

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerSnapshot: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0, // Unpaid amount that becomes customer credit
    },
    previousCustomerBalance: {
      type: Number,
      default: 0,
    },
    newCustomerBalance: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partially_paid', 'credit', 'cancelled'],
      default: 'paid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'credit', 'split'],
      default: 'cash',
    },
    splitDetails: {
      cash: { type: Number, default: 0 },
      upi: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ createdAt: -1 });

export default mongoose.model('Bill', billSchema);
