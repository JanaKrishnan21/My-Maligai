import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSpinner';
import { CreditPaymentModal } from '../components/customer/CreditPaymentModal';
import { useShop } from '../context/ShopContext';
import {
  CreditCard,
  Banknote,
  QrCode,
  PlusCircle,
  Calendar,
  Filter,
  Search,
  IndianRupee,
  Layers,
} from 'lucide-react';
import api from '../services/api';

export const Payments = () => {
  const { addToast } = useShop();
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [paymentType, setPaymentType] = useState('all');

  // Customer for quick collect pay
  const [payingCustomer, setPayingCustomer] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/payments?limit=100';
      if (paymentMethod !== 'all') url += `&paymentMethod=${paymentMethod}`;
      if (paymentType !== 'all') url += `&type=${paymentType}`;

      const [payRes, statsRes] = await Promise.all([
        api.get(url),
        api.get('/payments/stats'),
      ]);

      if (payRes.data?.success) setPayments(payRes.data.payments || []);
      if (statsRes.data?.success) setStats(statsRes.data);
    } catch {
      addToast('Failed to load payment logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [paymentMethod, paymentType, addToast]);

  useEffect(() => {
    fetchPayments();

    if (location.state?.openPaymentModal && location.state.customer) {
      setPayingCustomer(location.state.customer);
    }
  }, [fetchPayments, location.state]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Payments & Collections</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor daily cash counter payments, UPI receipts, and credit settlements
          </p>
        </div>

        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => {
            // Trigger customer search to pick someone for payment
            window.location.href = '/credit';
          }}
          className="font-bold shadow-sm"
        >
          Collect Khata Payment
        </Button>
      </div>

      {/* Payment Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Today's Total</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 font-mono">
            ₹{(stats?.todayTotal || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
            Total collections today
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Cash Collected</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{(stats?.cashTotal || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
            Today: ₹{stats?.todayCash || 0}
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">UPI Received</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-700 mt-1 font-mono">
            ₹{(stats?.upiTotal || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-blue-500 font-medium block mt-0.5">
            Today: ₹{stats?.todayUpi || 0}
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total All Time</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-800 mt-1 font-mono">
            ₹{(stats?.totalCollected || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-purple-500 font-medium block mt-0.5">
            Cumulative payments
          </span>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 uppercase">Payment Mode:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Modes</option>
            <option value="cash">Cash Only</option>
            <option value="upi">UPI / QR Only</option>
            <option value="card">Card Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 uppercase">Transaction Type:</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Transactions</option>
            <option value="credit_settlement">Khata Repayments</option>
            <option value="bill_payment">Counter Bill Payments</option>
          </select>
        </div>
      </Card>

      {/* Payments History Table */}
      <Card>
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3">Balance Trail</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(p.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{p.customer?.name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.customer?.phone}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 uppercase font-mono text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {p.type === 'credit_settlement' ? (
                        <Badge variant="purple" size="sm">Khata Repayment</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Bill Counter</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{p.amount?.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      ₹{p.previousBalance} → <strong className="text-slate-900">₹{p.newBalance}</strong>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold">No payments found</p>
          </div>
        )}
      </Card>

      {/* Collect Payment Modal if triggered */}
      {payingCustomer && (
        <CreditPaymentModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          customer={payingCustomer}
          onSuccess={fetchPayments}
        />
      )}
    </div>
  );
};
