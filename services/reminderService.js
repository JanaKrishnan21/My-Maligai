import cron from 'node-cron';
import Customer from '../models/Customer.js';
import Reminder from '../models/Reminder.js';
import Setting from '../models/Setting.js';
import { formatWhatsAppReminderMessage, sendWhatsAppCloudAPIMessage, generateWhatsAppLink } from './whatsappService.js';

export const getPendingCreditCustomers = async () => {
  const setting = await Setting.findOne();
  const intervalDays = setting?.reminderIntervalDays || 2;
  const cutoffDate = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000);

  // Find customers with positive balance whose last reminder is older than intervalDays or null
  const customers = await Customer.find({
    balance: { $gt: 0 },
    $or: [
      { lastReminderAt: null },
      { lastReminderAt: { $lte: cutoffDate } },
    ],
  }).sort({ balance: -1 });

  return customers.map((c) => {
    const msg = formatWhatsAppReminderMessage(c, setting);
    return {
      customer: c,
      balance: c.balance,
      lastPurchaseAt: c.lastPurchaseAt,
      lastReminderAt: c.lastReminderAt,
      reminderCount: c.reminderCount || 0,
      reminderMessage: msg,
      reminderLink: generateWhatsAppLink(c.phone, msg),
    };
  });
};

export const sendCustomerReminder = async (customerId, manual = true) => {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.balance <= 0) {
    throw new Error('Customer has no pending balance');
  }

  const setting = await Setting.findOne();
  const message = formatWhatsAppReminderMessage(customer, setting);
  
  // Try sending via WhatsApp Cloud API
  const apiResult = await sendWhatsAppCloudAPIMessage(customer.phone, message, setting);

  const nextIntervalDays = setting?.reminderIntervalDays || 2;
  customer.lastReminderAt = new Date();
  customer.nextReminderAt = new Date(Date.now() + nextIntervalDays * 24 * 60 * 60 * 1000);
  customer.reminderCount = (customer.reminderCount || 0) + 1;
  await customer.save();

  const reminder = await Reminder.create({
    customer: customer._id,
    amount: customer.balance,
    type: 'whatsapp',
    status: apiResult.success ? 'sent' : 'pending',
    responsePayload: apiResult,
    notes: manual ? 'Manual reminder trigger' : 'Scheduled auto reminder',
  });

  return {
    success: true,
    customer,
    reminder,
    apiResult,
    whatsAppLink: apiResult.link,
    message,
  };
};

export const initReminderScheduler = () => {
  // Run every morning at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ [Cron Job] Running automated payment reminder scan...');
    try {
      const setting = await Setting.findOne();
      if (!setting || !setting.enableAutoReminders) {
        console.log('ℹ️ [Cron Job] Auto reminders are disabled in settings');
        return;
      }

      const pending = await getPendingCreditCustomers();
      console.log(`📊 [Cron Job] Found ${pending.length} customers due for credit reminder`);

      // If WhatsApp credentials exist, send automatic messages
      if (setting.whatsappConfig?.accessToken && setting.whatsappConfig?.phoneNumberId) {
        for (const item of pending) {
          try {
            await sendCustomerReminder(item.customer._id, false);
            console.log(`✅ [Cron Job] Reminder sent to ${item.customer.name} (${item.customer.phone})`);
          } catch (err) {
            console.error(`❌ [Cron Job] Failed to send reminder to ${item.customer.name}:`, err.message);
          }
        }
      } else {
        console.log('ℹ️ [Cron Job] No WhatsApp Cloud API token configured. Reminders listed on dashboard for manual 1-click dispatch.');
      }
    } catch (error) {
      console.error('❌ [Cron Job Error]:', error.message);
    }
  });

  console.log('🕒 Automated Payment Reminder Scheduler Initialized (Cron 09:00 AM)');
};
