import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useShop } from '../context/ShopContext';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  IndianRupee,
  Package,
  Calendar,
  Percent,
  Receipt,
  Download,
} from 'lucide-react';
import api from '../services/api';

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

export const Reports = () => {
  const { addToast } = useShop();

  const [range, setRange] = useState('7d'); // 'today', '7d', '30d'
  const [salesData, setSalesData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes, prRes] = await Promise.all([
        api.get(`/reports/sales?range=${range}`),
        api.get('/reports/payments'),
        api.get('/reports/products'),
      ]);

      if (sRes.data?.success) setSalesData(sRes.data);
      if (pRes.data?.success) setPaymentData(sRes.data);
      if (prRes.data?.success) setProductData(sRes.data);
    } catch {
      addToast('Failed to load reports and analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [range, addToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return <LoadingSpinner text="Analyzing grocery shop sales data..." size="lg" className="min-h-[50vh]" />;
  }

  const chartData = salesData?.chartData || [];
  const paymentDistribution = paymentData?.distribution || [];
  const bestSellers = productData?.bestSellers || [];

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sales & Profit Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Business performance analytics, payment method breakdown, and top moving products
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Sales Revenue</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{salesData?.totalSales?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
            {salesData?.totalBills || 0} Bills Generated
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-teal-50/40 border-teal-200">
          <span className="text-xs font-bold text-slate-500 uppercase block">Estimated Gross Profit</span>
          <p className="text-2xl font-black text-teal-700 mt-1 font-mono">
            ₹{salesData?.estimatedProfit?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-teal-600 font-semibold block mt-0.5">
            {salesData?.profitMargin || 0}% Average Margin
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase block">Average Bill Value</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{salesData?.averageBillValue?.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            Per customer invoice
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase block">Total Discounts Given</span>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            ₹{salesData?.totalDiscount?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
            Promotional discounts
          </span>
        </Card>
      </div>

      {/* Two Chart Section: Sales Trend Area Chart & Payment Mode Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sales vs Gross Profit</h3>
              <p className="text-xs text-slate-500">Timeline revenue and estimated profit margins</p>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            {chartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="sales" name="Sales (₹)" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Gross Profit (₹)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No transaction data for this date range
              </div>
            )}
          </CardBody>
        </Card>

        {/* Payment Modes Distribution Donut */}
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Payment Modes</h3>
              <p className="text-xs text-slate-500">Cash vs UPI vs Card vs Credit</p>
            </div>
          </CardHeader>
          <CardBody className="p-4 flex flex-col items-center justify-center">
            {paymentDistribution.length > 0 ? (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {paymentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-1.5 mt-2 text-xs">
                  {paymentDistribution.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 font-mono">
                        ₹{item.value.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No payment data available
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Best Selling Products */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Top Revenue Generating Products</h3>
            <p className="text-xs text-slate-500">Fastest selling Kirana items</p>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Units Sold</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
                <th className="px-4 py-3 text-right">Estimated Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bestSellers.map((item, idx) => (
                <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-medium">
                    {item.totalQuantitySold} {item.unit || 'pcs'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{item.totalRevenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    ₹{item.totalEstimatedProfit.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
