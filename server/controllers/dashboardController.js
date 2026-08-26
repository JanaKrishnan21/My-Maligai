import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import { getPendingCreditCustomers } from '../services/reminderService.js';
import { getSalesReport } from '../services/reportService.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Bills and Sales
    const todayBills = await Bill.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
      paymentStatus: { $ne: 'cancelled' },
    });

    let todaySales = 0;
    let todayEstimatedCost = 0;
    let todayDiscount = 0;

    todayBills.forEach((bill) => {
      todaySales += bill.total || 0;
      todayDiscount += bill.discount || 0;
      if (bill.items) {
        bill.items.forEach((i) => {
          todayEstimatedCost += (i.purchasePrice || 0) * (i.quantity || 1);
        });
      }
    });

    const todayProfit = todaySales - todayEstimatedCost;

    // 2. Today's Payments by Mode (Cash / UPI / Card)
    const todayPayments = await Payment.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;

    todayPayments.forEach((p) => {
      if (p.paymentMethod === 'cash') todayCash += p.amount;
      if (p.paymentMethod === 'upi') todayUpi += p.amount;
      if (p.paymentMethod === 'card') todayCard += p.amount;
    });

    // 3. Customer Total Pending Credit
    const creditCustomers = await Customer.find({ balance: { $gt: 0 } }).sort({ balance: -1 });
    let totalPendingCredit = 0;
    creditCustomers.forEach((c) => {
      totalPendingCredit += c.balance || 0;
    });

    // 4. Low stock & out of stock products
    const outOfStockProducts = await Product.find({ active: true, stock: { $lte: 0 } }).limit(10);
    const lowStockProducts = await Product.find({
      active: true,
      $expr: {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$minimumStock'] },
        ],
      },
    }).limit(10);

    const outOfStockCount = await Product.countDocuments({ active: true, stock: { $lte: 0 } });
    const lowStockCount = await Product.countDocuments({
      active: true,
      $expr: {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$minimumStock'] },
        ],
      },
    });

    // 5. Pending Payment Reminders due
    const pendingReminders = await getPendingCreditCustomers();

    // 6. Recent Bills
    const recentBills = await Bill.find()
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    // 7. Mini 7-day trend chart
    const salesReport7d = await getSalesReport({ range: '7d' });

    // 8. Construct actionable alerts
    const alerts = [];
    if (outOfStockCount > 0) {
      alerts.push({
        id: 'alert-out-of-stock',
        type: 'danger',
        title: `${outOfStockCount} Product${outOfStockCount > 1 ? 's' : ''} Out of Stock`,
        description: 'Immediate restocking needed to avoid lost sales.',
        link: '/inventory?tab=out_of_stock',
        count: outOfStockCount,
      });
    }

    if (lowStockCount > 0) {
      alerts.push({
        id: 'alert-low-stock',
        type: 'warning',
        title: `${lowStockCount} Product${lowStockCount > 1 ? 's' : ''} Low in Stock`,
        description: 'Stock levels below minimum threshold.',
        link: '/inventory?tab=low_stock',
        count: lowStockCount,
      });
    }

    if (totalPendingCredit > 0) {
      alerts.push({
        id: 'alert-pending-credit',
        type: 'info',
        title: `₹${totalPendingCredit.toLocaleString('en-IN')} Customer Credit Pending`,
        description: `${creditCustomers.length} customers have active khata balances.`,
        link: '/credit',
        count: creditCustomers.length,
      });
    }

    if (pendingReminders.length > 0) {
      alerts.push({
        id: 'alert-reminders-due',
        type: 'primary',
        title: `${pendingReminders.length} Payment Reminders Due`,
        description: 'Customers overdue for gentle reminder notifications.',
        link: '/credit?tab=reminders',
        count: pendingReminders.length,
      });
    }

    res.json({
      success: true,
      stats: {
        todaySales: Number(todaySales.toFixed(2)),
        todayBillsCount: todayBills.length,
        todayProfit: Number(todayProfit.toFixed(2)),
        todayCash: Number(todayCash.toFixed(2)),
        todayUpi: Number(todayUpi.toFixed(2)),
        todayCard: Number(todayCard.toFixed(2)),
        todayDiscount: Number(todayDiscount.toFixed(2)),
        totalPendingCredit: Number(totalPendingCredit.toFixed(2)),
        totalDebtorsCount: creditCustomers.length,
        lowStockCount,
        outOfStockCount,
      },
      alerts,
      recentBills,
      topCreditCustomers: creditCustomers.slice(0, 6),
      lowStockProducts,
      outOfStockProducts,
      pendingReminders: pendingReminders.slice(0, 6),
      salesTrend: salesReport7d.chartData,
    });
  } catch (error) {
    next(error);
  }
};
