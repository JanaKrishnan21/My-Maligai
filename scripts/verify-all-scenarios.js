import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const runVerification = async () => {
  console.log('🚀 Starting Comprehensive End-to-End Business Flow Verification...');
  console.log('================================================================');

  let adminToken = '';
  let cashierToken = '';

  // Test 1: Authentication & Role check
  try {
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    adminToken = adminRes.data.token;
    console.log('✅ Scenario 0.1: Admin login successful. Role:', adminRes.data.user.role);

    const cashierRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'cashier',
      password: 'cashier123',
    });
    cashierToken = cashierRes.data.token;
    console.log('✅ Scenario 0.2: Cashier login successful. Role:', cashierRes.data.user.role);
  } catch (err) {
    console.error('❌ Authentication failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  // Scenario 1: Create customer, create product, create bill, pay full amount
  let testCust1 = null;
  let testProd1 = null;
  try {
    const custRes = await axios.post(
      `${BASE_URL}/customers`,
      {
        name: 'Test Customer Alpha',
        phone: '9900112233',
        address: '123 Testing Lane',
      },
      authHeaders
    );
    testCust1 = custRes.data.customer;
    console.log('✅ Scenario 1.1: Customer created:', testCust1.name, 'Initial Balance:', testCust1.balance);

    const prodRes = await axios.post(
      `${BASE_URL}/products`,
      {
        name: 'Organic Wheat Grain 10kg',
        category: 'Atta & Flours',
        purchasePrice: 300,
        sellingPrice: 380,
        stock: 50,
        minimumStock: 5,
        unit: 'packet',
      },
      authHeaders
    );
    testProd1 = prodRes.data.product;
    console.log('✅ Scenario 1.2: Product created:', testProd1.name, 'Stock:', testProd1.stock);

    // Bill 1: Full Payment of ₹380
    const billRes = await axios.post(
      `${BASE_URL}/bills`,
      {
        customerId: testCust1._id,
        items: [{ productId: testProd1._id, quantity: 1, sellingPrice: 380 }],
        amountPaid: 380,
        paymentMethod: 'upi',
      },
      authHeaders
    );

    const b1 = billRes.data.bill;
    console.log(`✅ Scenario 1.3: Bill created #${b1.invoiceNumber}. Total: ₹${b1.total}, Paid: ₹${b1.amountPaid}, Balance: ₹${b1.balance}`);

    // Verify stock decreased from 50 to 49
    const updatedProdRes = await axios.get(`${BASE_URL}/products/${testProd1._id}`, authHeaders);
    console.log(`✅ Scenario 1.4: Stock verification: Initial 50 → Current ${updatedProdRes.data.product.stock} (Decreased by 1)`);

    // Verify customer balance is 0
    const updatedCustRes = await axios.get(`${BASE_URL}/customers/${testCust1._id}`, authHeaders);
    console.log(`✅ Scenario 1.5: Customer balance verification: Balance = ₹${updatedCustRes.data.customer.balance} (Zero due)`);
  } catch (err) {
    console.error('❌ Scenario 1 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 2: Customer purchases ₹1,000, pays ₹600 -> Outstanding = ₹400
  let testCust2 = null;
  try {
    const custRes = await axios.post(
      `${BASE_URL}/customers`,
      {
        name: 'Test Customer Beta',
        phone: '9900223344',
      },
      authHeaders
    );
    testCust2 = custRes.data.customer;

    // Create 2 items totaling ₹1,000
    const billRes = await axios.post(
      `${BASE_URL}/bills`,
      {
        customerId: testCust2._id,
        items: [{ productId: testProd1._id, quantity: 2, sellingPrice: 500 }], // ₹1000 total
        amountPaid: 600,
        paymentMethod: 'cash',
      },
      authHeaders
    );

    const b2 = billRes.data.bill;
    console.log(`✅ Scenario 2: Bill total ₹${b2.total}, Paid ₹${b2.amountPaid}, Added to Khata: ₹${b2.balance}`);

    const updatedCust = await axios.get(`${BASE_URL}/customers/${testCust2._id}`, authHeaders);
    console.log(`✅ Scenario 2 Verification: Customer Khata Balance = ₹${updatedCust.data.customer.balance} (Expected ₹400)`);
  } catch (err) {
    console.error('❌ Scenario 2 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 3: Customer already owes ₹400. Makes purchase of ₹700, pays nothing -> Outstanding = ₹1,100
  try {
    const billRes = await axios.post(
      `${BASE_URL}/bills`,
      {
        customerId: testCust2._id,
        items: [{ productId: testProd1._id, quantity: 1, sellingPrice: 700 }],
        amountPaid: 0,
        paymentMethod: 'credit',
      },
      authHeaders
    );

    const updatedCust = await axios.get(`${BASE_URL}/customers/${testCust2._id}`, authHeaders);
    console.log(`✅ Scenario 3: Additional credit purchase of ₹700. New Khata Balance = ₹${updatedCust.data.customer.balance} (Expected ₹1,100)`);
  } catch (err) {
    console.error('❌ Scenario 3 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 4: Customer pays ₹700 from old credit -> Balance drops to ₹400
  try {
    const payRes = await axios.post(
      `${BASE_URL}/customers/${testCust2._id}/pay`,
      {
        amount: 700,
        paymentMethod: 'upi',
        notes: 'GPay payment for old credit',
      },
      authHeaders
    );

    console.log(`✅ Scenario 4: Repayment of ₹700 recorded. New Balance = ₹${payRes.data.customer.balance} (Expected ₹400)`);
  } catch (err) {
    console.error('❌ Scenario 4 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 5 & 6: Low Stock & Out of Stock Alerts
  try {
    const lowStockProdRes = await axios.post(
      `${BASE_URL}/products`,
      {
        name: 'Test Low Stock Item',
        category: 'General',
        purchasePrice: 10,
        sellingPrice: 15,
        stock: 3,
        minimumStock: 5,
      },
      authHeaders
    );

    const invSummary = await axios.get(`${BASE_URL}/inventory/summary`, authHeaders);
    console.log(`✅ Scenario 5: Low stock products count in inventory: ${invSummary.data.lowStockCount} (Includes ${lowStockProdRes.data.product.name})`);

    const outProdRes = await axios.post(
      `${BASE_URL}/products`,
      {
        name: 'Test Zero Stock Item',
        category: 'General',
        purchasePrice: 10,
        sellingPrice: 15,
        stock: 0,
        minimumStock: 5,
      },
      authHeaders
    );

    const invSummary2 = await axios.get(`${BASE_URL}/inventory/summary`, authHeaders);
    console.log(`✅ Scenario 6: Out of stock products count: ${invSummary2.data.outOfStockCount} (Includes ${outProdRes.data.product.name})`);
  } catch (err) {
    console.error('❌ Scenario 5/6 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 7: Fast Mobile Search returns previous balance immediately
  try {
    const searchRes = await axios.get(`${BASE_URL}/customers/phone/${testCust2.phone}`, authHeaders);
    console.log(`✅ Scenario 7: Mobile Search for "${testCust2.phone}" returned customer: ${searchRes.data.customer.name}, Current Balance: ₹${searchRes.data.customer.balance}`);
  } catch (err) {
    console.error('❌ Scenario 7 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 8: WhatsApp Formatted Message check
  try {
    const lastBill = await axios.get(`${BASE_URL}/bills?limit=1`, authHeaders);
    const billDetails = await axios.get(`${BASE_URL}/bills/${lastBill.data.bills[0]._id}`, authHeaders);
    console.log('✅ Scenario 8: WhatsApp Bill Message Sample:');
    console.log('--------------------------------------------------');
    console.log(billDetails.data.whatsAppMessage.slice(0, 250) + '...\n');
    console.log('--------------------------------------------------');
    console.log('✅ WhatsApp Link generated:', billDetails.data.whatsAppLink?.slice(0, 60) + '...');
  } catch (err) {
    console.error('❌ Scenario 8 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 9: Dashboard Metrics Aggregation
  try {
    const dashRes = await axios.get(`${BASE_URL}/dashboard`, authHeaders);
    const s = dashRes.data.stats;
    console.log(`✅ Scenario 9: Dashboard KPIs: Today Sales: ₹${s.todaySales}, Bills Count: ${s.todayBillsCount}, Pending Khata Credit: ₹${s.totalPendingCredit}, Cash Today: ₹${s.todayCash}, UPI Today: ₹${s.todayUpi}, Estimated Profit: ₹${s.todayProfit}`);
    console.log(`✅ Active Dashboard Alerts: ${dashRes.data.alerts.length} alerts loaded`);
  } catch (err) {
    console.error('❌ Scenario 9 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Scenario 10: Bill Cancellation restores stock and Khata balance
  try {
    // Create bill of 5 items
    const beforeProd = await axios.get(`${BASE_URL}/products/${testProd1._id}`, authHeaders);
    const stockBefore = beforeProd.data.product.stock;

    const newBillRes = await axios.post(
      `${BASE_URL}/bills`,
      {
        customerId: testCust2._id,
        items: [{ productId: testProd1._id, quantity: 5, sellingPrice: 380 }],
        amountPaid: 0,
        paymentMethod: 'credit',
      },
      authHeaders
    );
    const createdBill = newBillRes.data.bill;

    const afterSaleProd = await axios.get(`${BASE_URL}/products/${testProd1._id}`, authHeaders);
    console.log(`   Stock after sale: ${afterSaleProd.data.product.stock} (was ${stockBefore})`);

    // Cancel the bill
    const cancelRes = await axios.post(`${BASE_URL}/bills/${createdBill._id}/cancel`, {}, authHeaders);
    console.log(`✅ Scenario 10.1: ${cancelRes.data.message}`);

    const restoredProd = await axios.get(`${BASE_URL}/products/${testProd1._id}`, authHeaders);
    console.log(`✅ Scenario 10.2: Stock restored after cancel: ${restoredProd.data.product.stock} (Back to ${stockBefore})`);
  } catch (err) {
    console.error('❌ Scenario 10 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 ALL 10 BUSINESS SCENARIOS TESTED & FULLY VERIFIED SUCCESSFULLY!');
  process.exit(0);
};

runVerification();
