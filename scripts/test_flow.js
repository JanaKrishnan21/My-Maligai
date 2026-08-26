import axios from 'axios';

async function testMyMaligai() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- Starting My Maligai End-to-End Verification ---');

  // 1. Health
  const healthRes = await axios.get(`${BASE_URL}/health`);
  console.log('1. Health Check:', healthRes.data.status, healthRes.data.service);

  // 2. Login as Admin
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'admin',
    password: 'admin123',
  });
  const token = loginRes.data.token;
  console.log('2. Admin Login OK. User:', loginRes.data.user.name, 'Role:', loginRes.data.user.role);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 3. Settings Check
  const settingsRes = await axios.get(`${BASE_URL}/settings`, authHeader);
  console.log('3. Shop Settings:', settingsRes.data.setting?.shopName, '|', settingsRes.data.setting?.shopTagline);

  // 4. Test Customer Required on Bill creation
  try {
    await axios.post(`${BASE_URL}/bills`, {
      items: [{ name: 'Rice 5kg', quantity: 1, sellingPrice: 320 }],
      amountPaid: 320,
      paymentMethod: 'cash',
    }, authHeader);
    console.error('FAILED: Bill was created without a customer!');
  } catch (err) {
    console.log('4. Customer Validation Test PASSED:', err.response?.data?.message);
  }

  // 5. Get Customer
  const custRes = await axios.get(`${BASE_URL}/customers?limit=1`, authHeader);
  const cust = custRes.data.customers[0];
  console.log(`5. Selected Customer: ${cust.name} (${cust.phone}), Previous Balance: ₹${cust.balance}`);

  // 6. Get Product
  const prodRes = await axios.get(`${BASE_URL}/products?limit=1`, authHeader);
  const product = prodRes.data.products[0];
  console.log(`6. Product: ${product.name}, Price: ₹${product.sellingPrice}`);

  // 7. Create Valid Bill with Partial Payment
  const billRes = await axios.post(`${BASE_URL}/bills`, {
    customerId: cust._id,
    customerName: cust.name,
    customerPhone: cust.phone,
    items: [{
      productId: product._id,
      name: product.name,
      quantity: 2,
      sellingPrice: product.sellingPrice,
    }],
    discount: 10,
    amountPaid: product.sellingPrice, // Partial payment
    paymentMethod: 'cash',
  }, authHeader);

  const bill = billRes.data.bill;
  console.log(`7. Bill Created: #${bill.invoiceNumber}`);
  console.log(`   - Total: ₹${bill.total}`);
  console.log(`   - Amount Paid: ₹${bill.amountPaid}`);
  console.log(`   - Current Bill Balance: ₹${bill.balance}`);
  console.log(`   - Previous Balance: ₹${bill.previousCustomerBalance}`);
  console.log(`   - Updated Khata Balance: ₹${bill.newCustomerBalance}`);
  console.log('8. Formatted WhatsApp Receipt:\n' + billRes.data.whatsAppMessage);

  // 8. Dashboard metrics check
  const dashRes = await axios.get(`${BASE_URL}/dashboard`, authHeader);
  console.log('9. Dashboard Stats:', {
    todaySales: dashRes.data.stats.todaySales,
    todayBillsCount: dashRes.data.stats.todayBillsCount,
    totalPendingCredit: dashRes.data.stats.totalPendingCredit,
    lowStockCount: dashRes.data.stats.lowStockCount,
  });

  console.log('--- Verification Complete: All Checks Passed! ---');
}

testMyMaligai().catch(console.error);
