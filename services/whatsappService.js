import axios from 'axios';
import Setting from '../models/Setting.js';

export const formatWhatsAppBillMessage = (bill, shopSetting) => {
  const shopName = shopSetting?.shopName || 'MY MALIGAI';
  const shopPhone = shopSetting?.phone || '';
  const customerName = bill.customerSnapshot?.name || 'Customer';
  const invoiceNumber = bill.invoiceNumber;
  const dateStr = new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let itemsList = '';
  if (bill.items && bill.items.length > 0) {
    itemsList = bill.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} - ${item.quantity} ${item.unit || 'pc'} × ₹${item.sellingPrice.toFixed(2)} = ₹${item.total.toFixed(2)}`
      )
      .join('\n');
  }

  const subtotal = bill.subtotal.toFixed(2);
  const discountText = bill.discount > 0 ? `\nDiscount: -₹${bill.discount.toFixed(2)}` : '';
  const total = bill.total.toFixed(2);
  const paid = bill.amountPaid.toFixed(2);
  const balance = bill.balance.toFixed(2);
  const totalKhata = (bill.newCustomerBalance || 0).toFixed(2);

  let balanceInfo = `\nRemaining Balance: ₹${balance}`;
  if (bill.newCustomerBalance && bill.newCustomerBalance > 0 && bill.newCustomerBalance !== bill.balance) {
    balanceInfo += `\nTotal Outstanding Balance: ₹${totalKhata}`;
  }

  const message = 
`---------------------------------------
              MY MALIGAI
       Grocery Shop Management
---------------------------------------
Invoice: ${invoiceNumber}
Date: ${dateStr}
Customer: ${customerName}

---------------------------------------
ITEMS:
---------------------------------------
${itemsList}
---------------------------------------
Subtotal: ₹${subtotal}${discountText}
TOTAL: ₹${total}
Paid: ₹${paid} (${(bill.paymentMethod || 'cash').toUpperCase()})${balanceInfo}
---------------------------------------
Thank you for shopping at My Maligai!
${shopPhone ? `Phone: ${shopPhone}` : ''}`.trim();

  return message;
};

export const formatWhatsAppReminderMessage = (customer, shopSetting) => {
  const shopName = shopSetting?.shopName || 'MY MALIGAI';
  const shopPhone = shopSetting?.phone || '';
  const customerName = customer.name;
  const balance = customer.balance.toFixed(2);

  const message = 
`---------------------------------------
              MY MALIGAI
          Payment Reminder
---------------------------------------
Dear ${customerName},

This is a reminder regarding your pending balance of ₹${balance} at ${shopName}.

Kindly settle the amount during your next visit.

Thank you!
${shopPhone ? `Phone: ${shopPhone}` : ''}`.trim();

  return message;
};

export const generateWhatsAppLink = (phone, message) => {
  let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India country code
  }
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const sendWhatsAppCloudAPIMessage = async (phone, message, shopSetting) => {
  const token = shopSetting?.whatsappConfig?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = shopSetting?.whatsappConfig?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v19.0';

  if (!token || !phoneNumberId) {
    return {
      success: false,
      fallbackUsed: true,
      link: generateWhatsAppLink(phone, message),
      message: 'WhatsApp Cloud API credentials not configured. Use the generated direct WhatsApp link.',
    };
  }

  let cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  try {
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { body: message },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
      link: generateWhatsAppLink(phone, message),
    };
  } catch (error) {
    console.error('WhatsApp Cloud API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      fallbackUsed: true,
      link: generateWhatsAppLink(phone, message),
    };
  }
};
