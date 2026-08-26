import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['whatsapp', 'sms', 'system'],
      default: 'whatsapp',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'sent',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ createdAt: -1 });

export default mongoose.model('Reminder', reminderSchema);
