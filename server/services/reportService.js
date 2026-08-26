import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const getSalesReport = async ({ startDate, endDate, range = '7d' }) => {
  let start = new Date();
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === '30d') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    } else {
      // default 7 days
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    }
  }

  const bills = await Bill.find({
    createdAt: { $gte: start, $lte: end },
    paymentStatus: { $ne: 'cancelled' },
  }).sort({ createdAt: 1 });

  let totalSales = 0;
  let totalDiscount = 0;
  let totalCashCollected = 0;
  let totalCreditGiven = 0;
  let totalEstimatedCost = 0;

  const chartMap = {};

  bills.forEach((bill) => {
    totalSales += bill.total || 0;
    totalDiscount += bill.discount || 0;
    totalCashCollected += bill.amountPaid || 0;
    totalCreditGiven += bill.balance || 0;

    // Calculate cost for this bill
    if (bill.items) {
      bill.items.forEach((item) => {
        totalEstimatedCost += (item.purchasePrice || 0) * (item.quantity || 1);
      });
    }

    const dayKey = new Date(bill.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    if (!chartMap[dayKey]) {
      chartMap[dayKey] = {
        date: dayKey,
        sales: 0,
        paid: 0,
        credit: 0,
        profit: 0,
        billsCount: 0,
      };
    }

    chartMap[dayKey].sales += bill.total || 0;
    chartMap[dayKey].paid += bill.amountPaid || 0;
    chartMap[dayKey].credit += bill.balance || 0;
    chartMap[dayKey].billsCount += 1;
    
    // Profit for the day
    let billCost = 0;
    if (bill.items) {
      bill.items.forEach((i) => {
        billCost += (i.purchasePrice || 0) * (i.quantity || 1);
      });
    }
    chartMap[dayKey].profit += (bill.total || 0) - billCost;
  });

  const chartData = Object.values(chartMap).map((d) => ({
    ...d,
    sales: Number(d.sales.toFixed(2)),
    paid: Number(d.paid.toFixed(2)),
    credit: Number(d.credit.toFixed(2)),
    profit: Number(d.profit.toFixed(2)),
  }));

  const estimatedProfit = totalSales - totalEstimatedCost;
  const averageBillValue = bills.length > 0 ? totalSales / bills.length : 0;

  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalCashCollected: Number(totalCashCollected.toFixed(2)),
    totalCreditGiven: Number(totalCreditGiven.toFixed(2)),
    estimatedProfit: Number(estimatedProfit.toFixed(2)),
    totalBills: bills.length,
    averageBillValue: Number(averageBillValue.toFixed(2)),
    profitMargin: totalSales > 0 ? Number(((estimatedProfit / totalSales) * 100).toFixed(1)) : 0,
    chartData,
    dateRange: { start, end },
  };
};

export const getPaymentReport = async () => {
  const allPayments = await Payment.find().sort({ createdAt: -1 });

  let cashTotal = 0;
  let upiTotal = 0;
  let cardTotal = 0;
  let creditTotal = 0;

  allPayments.forEach((p) => {
    if (p.paymentMethod === 'cash') cashTotal += p.amount;
    else if (p.paymentMethod === 'upi') upiTotal += p.amount;
    else if (p.paymentMethod === 'card') cardTotal += p.amount;
    else if (p.paymentMethod === 'credit') creditTotal += p.amount;
  });

  // Calculate today's payments
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const todayPayments = await Payment.find({ createdAt: { $gte: startToday } });
  let todayCash = 0;
  let todayUpi = 0;
  let todayTotal = 0;

  todayPayments.forEach((p) => {
    todayTotal += p.amount;
    if (p.paymentMethod === 'cash') todayCash += p.amount;
    if (p.paymentMethod === 'upi') todayUpi += p.amount;
  });

  const total = cashTotal + upiTotal + cardTotal + creditTotal;

  const distribution = [
    { name: 'Cash', value: Number(cashTotal.toFixed(2)), color: '#10b981' },
    { name: 'UPI', value: Number(upiTotal.toFixed(2)), color: '#3b82f6' },
    { name: 'Card', value: Number(cardTotal.toFixed(2)), color: '#8b5cf6' },
    { name: 'Credit Pay Later', value: Number(creditTotal.toFixed(2)), color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return {
    totalCollected: Number(total.toFixed(2)),
    cashTotal: Number(cashTotal.toFixed(2)),
    upiTotal: Number(upiTotal.toFixed(2)),
    cardTotal: Number(cardTotal.toFixed(2)),
    creditTotal: Number(creditTotal.toFixed(2)),
    todayTotal: Number(todayTotal.toFixed(2)),
    todayCash: Number(todayCash.toFixed(2)),
    todayUpi: Number(todayUpi.toFixed(2)),
    distribution,
    recentPayments: allPayments.slice(0, 20),
  };
};

export const getCreditReport = async () => {
  const debtors = await Customer.find({ balance: { $gt: 0 } }).sort({ balance: -1 });

  let totalOutstanding = 0;
  debtors.forEach((c) => {
    totalOutstanding += c.balance || 0;
  });

  return {
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalDebtorsCount: debtors.length,
    topDebtors: debtors.slice(0, 15),
    allDebtors: debtors,
  };
};

export const getProductReport = async () => {
  // Aggregate sales by product
  const bills = await Bill.find({ paymentStatus: { $ne: 'cancelled' } });

  const productMap = {};

  bills.forEach((bill) => {
    if (bill.items) {
      bill.items.forEach((item) => {
        const pId = String(item.product);
        if (!productMap[pId]) {
          productMap[pId] = {
            productId: item.product,
            name: item.name,
            unit: item.unit,
            totalQuantitySold: 0,
            totalRevenue: 0,
            totalEstimatedProfit: 0,
          };
        }
        productMap[pId].totalQuantitySold += item.quantity || 0;
        productMap[pId].totalRevenue += item.total || 0;
        productMap[pId].totalEstimatedProfit +=
          (item.sellingPrice - (item.purchasePrice || 0)) * (item.quantity || 0);
      });
    }
  });

  const productStats = Object.values(productMap).map((p) => ({
    ...p,
    totalRevenue: Number(p.totalRevenue.toFixed(2)),
    totalEstimatedProfit: Number(p.totalEstimatedProfit.toFixed(2)),
    totalQuantitySold: Number(p.totalQuantitySold.toFixed(2)),
  }));

  const bestSellers = [...productStats].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
  const mostProfitable = [...productStats].sort((a, b) => b.totalEstimatedProfit - a.totalEstimatedProfit).slice(0, 10);

  return {
    bestSellers,
    mostProfitable,
    allTrackedProducts: productStats,
  };
};
