import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { CreditPaymentModal } from '../components/customer/CreditPaymentModal';
import {
  ShoppingCart,
  IndianRupee,
  Receipt,
  AlertTriangle,
  Phone,
  Printer,
  Send,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

export const Dashboard = () => {
  const { settings, addToast } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  // Quick Customer Search State
  const [quickPhone, setQuickPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerResult, setCustomerResult] = useState(null);
  const [customerNotFound, setCustomerNotFound] = useState(false);

  // Modals
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleInlineCustomerSearch = async (e) => {
    e.preventDefault();
    const clean = quickPhone.trim();
    if (!clean) return;

    setSearchingCustomer(true);
    setCustomerNotFound(false);
    setCustomerResult(null);

    try {
      const res = await api.get(`/customers/phone/${clean}`);
      if (res.data?.success && res.data.customer) {
        setCustomerResult(res.data);
      }
    } catch {
      try {
        const searchRes = await api.get(`/customers?search=${clean}&limit=1`);
        if (searchRes.data?.customers && searchRes.data.customers.length > 0) {
          const cust = searchRes.data.customers[0];
          const fullRes = await api.get(`/customers/phone/${cust.phone}`);
          setCustomerResult(fullRes.data);
        } else {
          setCustomerNotFound(true);
        }
      } catch {
        setCustomerNotFound(true);
      }
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleOpenReceipt = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      if (res.data?.success) {
        setSelectedBillForReceipt(res.data);
      }
    } catch {
      addToast('Failed to load invoice details', 'error');
    }
  };

  const handleSendReminder = (link) => {
    if (link) {
      window.open(link, '_blank');
      addToast('Opening WhatsApp reminder...', 'success');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." size="lg" className="min-h-[50vh]" />;
  }

  const stats = data?.stats || {};
  const recentBills = data?.recentBills || [];
  const topCreditCustomers = data?.topCreditCustomers || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const outOfStockProducts = data?.outOfStockProducts || [];
  const allLowStock = [...outOfStockProducts, ...lowStockProducts].slice(0, 8);

  const lowStockTotalCount = (stats.lowStockCount || 0) + (stats.outOfStockCount || 0);

  return (
    <div className="space-y-5">
      {/* Header Bar & Quick Customer Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {settings?.shopName || 'My Maligai'}
            </h2>
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              className={`p-1 text-slate-400 hover:text-slate-700 rounded transition-transform ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grocery shop management overview
          </p>
        </div>

        {/* Customer Mobile Search Bar */}
        <form onSubmit={handleInlineCustomerSearch} className="flex gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
              placeholder="Search customer mobile..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" loading={searchingCustomer}>
            Search
          </Button>
        </form>
      </div>

      {/* Quick Search Result Banner if active */}
      {customerResult && customerResult.customer && (
        <div className="p-3.5 bg-white border border-emerald-300 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{customerResult.customer.name}</span>
              <span className="font-mono text-slate-500">({customerResult.customer.phone})</span>
              {customerResult.customer.balance > 0 ? (
                <Badge variant="danger">Due: ₹{customerResult.customer.balance}</Badge>
              ) : (
                <Badge variant="success">No Due</Badge>
              )}
            </div>
            <span className="text-slate-500 mt-0.5 block">
              Total Purchases: ₹{(customerResult.customer.totalPurchases || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="xs"
              variant="primary"
              icon={ShoppingCart}
              onClick={() => navigate('/billing', { state: { selectedCustomer: customerResult.customer } })}
            >
              New Bill
            </Button>
            <Button
              size="xs"
              variant="secondary"
              icon={CreditCard}
              onClick={() => setSelectedCustomerForPayment(customerResult.customer)}
            >
              Collect Payment
            </Button>
            {customerResult.customer.balance > 0 && customerResult.reminderLink && (
              <Button
                size="xs"
                variant="whatsapp"
                icon={Send}
                onClick={() => handleSendReminder(customerResult.reminderLink)}
              >
                Reminder
              </Button>
            )}
          </div>
        </div>
      )}

      {customerNotFound && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <span>No customer found matching "{quickPhone}".</span>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => navigate('/customers', { state: { openCreateModal: true, initialPhone: quickPhone } })}
          >
            + Add Customer
          </Button>
        </div>
      )}

      {/* 4 Focused KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            ₹{(stats.todaySales || 0).toLocaleString('en-IN')}
          </p>
        </Card>

        {/* Today's Bills */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Bills</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {stats.todayBillsCount || 0}
          </p>
        </Card>

        {/* Pending Payments */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Payments</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            ₹{(stats.totalPendingCredit || 0).toLocaleString('en-IN')}
          </p>
        </Card>

        {/* Low Stock */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-mono">
            {lowStockTotalCount}
          </p>
        </Card>
      </div>

      {/* 3 Focused Tables / Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Section 1: Recent Bills */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Bills</h3>
              <p className="text-xs text-slate-500">Latest customer purchases</p>
            </div>
            <Button size="xs" variant="secondary" onClick={() => navigate('/bills')}>
              View All
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBills.length > 0 ? (
                    recentBills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {b.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium block text-slate-900">
                            {b.customerSnapshot?.name || 'Customer'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {b.customerSnapshot?.phone}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{b.total?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            size="sm"
                            variant={
                              b.paymentStatus === 'paid'
                                ? 'success'
                                : b.paymentStatus === 'partially_paid'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {b.paymentStatus === 'paid' ? 'Paid' : b.paymentStatus === 'partially_paid' ? 'Partial' : 'Credit'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(b._id)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                            title="View / Print Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No bills created yet today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Pending Payments */}
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Payments</h3>
              <p className="text-xs text-slate-500">Customers with credit</p>
            </div>
            <Button size="xs" variant="secondary" onClick={() => navigate('/credit')}>
              View All
            </Button>
          </CardHeader>
          <CardBody className="p-3 flex-1 flex flex-col justify-between">
            <div className="divide-y divide-slate-100 space-y-2">
              {topCreditCustomers.length > 0 ? (
                topCreditCustomers.map((cust) => (
                  <div key={cust._id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{cust.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{cust.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-rose-600 font-mono">₹{cust.balance}</span>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => setSelectedCustomerForPayment(cust)}
                      >
                        Collect
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No pending payments
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section 3: Low Stock Items */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Low Stock Items</h3>
            <p className="text-xs text-slate-500">Products that need restocking</p>
          </div>
          <Button size="xs" variant="secondary" onClick={() => navigate('/products')}>
            Manage Products
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Available Stock</th>
                  <th className="py-2.5 px-3 text-center">Minimum Required</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allLowStock.length > 0 ? (
                  allLowStock.map((prod) => (
                    <tr key={prod._id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {prod.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {prod.category || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">
                        {prod.stock} {prod.unit || 'pc'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {prod.minimumStock || 5} {prod.unit || 'pc'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {prod.stock <= 0 ? (
                          <Badge size="sm" variant="danger">Out of Stock</Badge>
                        ) : (
                          <Badge size="sm" variant="warning">Low Stock</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      All products have healthy stock levels
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Bill Receipt Modal */}
      {selectedBillForReceipt && (
        <ThermalReceipt
          isOpen={!!selectedBillForReceipt}
          onClose={() => setSelectedBillForReceipt(null)}
          bill={selectedBillForReceipt.bill}
          shopSetting={selectedBillForReceipt.shopSetting}
          whatsAppMessage={selectedBillForReceipt.whatsAppMessage}
          whatsAppLink={selectedBillForReceipt.whatsAppLink}
        />
      )}

      {/* Credit Settlement Payment Modal */}
      {selectedCustomerForPayment && (
        <CreditPaymentModal
          isOpen={!!selectedCustomerForPayment}
          onClose={() => setSelectedCustomerForPayment(null)}
          customer={selectedCustomerForPayment}
          onSuccess={() => {
            fetchDashboardData(true);
            setSelectedCustomerForPayment(null);
          }}
        />
      )}
    </div>
  );
};
