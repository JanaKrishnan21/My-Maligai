import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSpinner';
import { CreditPaymentModal } from '../components/customer/CreditPaymentModal';
import { useShop } from '../context/ShopContext';
import {
  BookOpen,
  Send,
  CreditCard,
  Phone,
  Search,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import api from '../services/api';

export const CreditLedger = () => {
  const { addToast } = useShop();
  const navigate = useNavigate();

  const [debtors, setDebtors] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [payingCustomer, setPayingCustomer] = useState(null);

  const fetchCreditData = useCallback(async () => {
    setLoading(true);
    try {
      const [credRes, custRes] = await Promise.all([
        api.get('/reports/credit'),
        api.get(`/customers?hasBalance=true&search=${search}&limit=100`),
      ]);

      if (credRes.data?.success) {
        setTotalOutstanding(credRes.data.totalOutstanding || 0);
      }
      if (custRes.data?.success) {
        setDebtors(custRes.data.customers || []);
      }
    } catch {
      addToast('Failed to load Khata credit ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  const handleSendReminder = async (customer) => {
    try {
      const res = await api.post('/reminders/send', { customerId: customer._id });
      if (res.data?.whatsAppLink) {
        window.open(res.data.whatsAppLink, '_blank');
        addToast(`Opening WhatsApp reminder for ${customer.name}...`, 'success');
        fetchCreditData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send reminder', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-2xl p-6 text-white shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-xs font-semibold uppercase tracking-wider border border-rose-400/30">
              Khata Credit Management
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Credit Book</h2>
          <p className="text-xs text-rose-200/80 mt-0.5">
            Track unpaid grocery tabs, schedule automated gentle reminders, and collect repayments
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right min-w-[200px]">
          <span className="text-xs text-rose-200 uppercase font-semibold block">Total Outstanding Due</span>
          <span className="text-3xl font-black font-mono block mt-0.5 text-white">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-rose-200 font-medium block">
            {debtors.length} Customers with active dues
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-3.5 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search debtors by name or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchCreditData}
        >
          Refresh List
        </Button>
      </Card>

      {/* Debtors List Table */}
      <Card>
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : debtors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone & Address</th>
                  <th className="px-4 py-3 text-right">Outstanding Khata</th>
                  <th className="px-4 py-3">Last Purchase</th>
                  <th className="px-4 py-3">Last Reminder</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {debtors.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${c._id}`)}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {c.name}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.address && <p className="text-[10px] text-slate-400 font-sans truncate max-w-xs">{c.address}</p>}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="text-base font-black text-rose-600 font-mono">
                        ₹{c.balance?.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {c.lastPurchaseAt
                        ? new Date(c.lastPurchaseAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'None'}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {c.lastReminderAt ? (
                        <div className="text-[11px]">
                          <span>
                            {new Date(c.lastReminderAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            ({c.reminderCount || 1} sent)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not sent yet</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="whatsapp"
                          icon={Send}
                          onClick={() => handleSendReminder(c)}
                        >
                          Reminder
                        </Button>

                        <Button
                          size="xs"
                          variant="primary"
                          icon={CreditCard}
                          onClick={() => setPayingCustomer(c)}
                        >
                          Collect Pay
                        </Button>

                        <Button
                          size="xs"
                          variant="secondary"
                          icon={ArrowRight}
                          onClick={() => navigate(`/customers/${c._id}`)}
                        >
                          Ledger
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-700">No Customers With Outstanding Dues!</p>
            <p className="text-xs text-slate-400 mt-1">All customers have settled their grocery balances.</p>
          </div>
        )}
      </Card>

      {/* Collect Payment Modal */}
      {payingCustomer && (
        <CreditPaymentModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          customer={payingCustomer}
          onSuccess={fetchCreditData}
        />
      )}
    </div>
  );
};
