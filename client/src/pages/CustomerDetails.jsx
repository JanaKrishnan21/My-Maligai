import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreditPaymentModal } from '../components/customer/CreditPaymentModal';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { useShop } from '../context/ShopContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
  Send,
  ArrowLeft,
  Calendar,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';

export const CustomerDetails = () => {
  const { id } = useParams();
  const { addToast } = useShop();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState(null);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await api.get(`/customers/${id}/ledger`);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load customer ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleSendReminder = async () => {
    if (!data?.customer) return;
    try {
      const res = await api.post('/reminders/send', { customerId: data.customer._id });
      if (res.data?.whatsAppLink) {
        window.open(res.data.whatsAppLink, '_blank');
        addToast('WhatsApp reminder opened', 'success');
        fetchLedger();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send reminder', 'error');
    }
  };

  const handleOpenReceipt = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      if (res.data?.success) {
        setSelectedBillForReceipt(res.data);
      }
    } catch {
      addToast('Failed to load bill receipt', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading customer ledger..." size="lg" className="min-h-[50vh]" />;
  }

  if (!data?.customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">Customer not found</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/customers')} className="mt-3">
          Back to Customers
        </Button>
      </div>
    );
  }

  const customer = data.customer;
  const timeline = data.timeline || [];

  return (
    <div className="space-y-6">
      {/* Back Button & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>{customer.name}</span>
            {customer.balance > 0 ? (
              <Badge variant="danger" dot>Khata Due: ₹{customer.balance}</Badge>
            ) : (
              <Badge variant="success" dot>No Due</Badge>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5" /> {customer.phone}
          </p>
        </div>
      </div>

      {/* Customer Profile & Financial Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact info */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Customer Information
          </span>
          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{customer.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.phone}</span>
            </div>
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Purchase Metrics */}
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Lifetime Statistics
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Total Purchases</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                ₹{(customer.totalPurchases || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block">Total Paid</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                ₹{(customer.totalPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Invoices: {data.billsCount || 0} • Payment Records: {data.paymentsCount || 0}
          </div>
        </Card>

        {/* Khata Balance & Quick Action */}
        <Card className="p-4 bg-gradient-to-br from-white to-rose-50/40 border-rose-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
              Outstanding Khata Balance
            </span>
            <span
              className={`text-3xl font-black font-mono block mt-1 ${
                customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{customer.balance?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="primary"
              icon={ShoppingBag}
              onClick={() => navigate('/billing', { state: { selectedCustomer: customer } })}
              className="flex-1 text-xs"
            >
              New Bill
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={CreditCard}
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex-1 text-xs"
            >
              Collect Pay
            </Button>
            {customer.balance > 0 && (
              <Button
                size="sm"
                variant="whatsapp"
                icon={Send}
                onClick={handleSendReminder}
                className="text-xs"
                title="Send WhatsApp Reminder"
              >
                Reminder
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Chronological Ledger Timeline */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Khata Transaction Ledger</h3>
            <p className="text-xs text-slate-500">Complete chronological timeline of grocery purchases and payments</p>
          </div>
        </CardHeader>

        <div className="p-5">
          {timeline.length > 0 ? (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
              {timeline.map((entry) => {
                const isBill = entry.type === 'bill';
                return (
                  <div key={entry._id} className="relative group">
                    {/* Timeline icon node */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                        isBill ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {isBill ? <ShoppingBag className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>

                    <div className="bg-slate-50/80 group-hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {entry.reference}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs font-semibold text-slate-700">{entry.description}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                            {entry.paymentMethod}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.date).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isBill ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600 font-medium">
                            {entry.itemsSummary}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                            <div className="flex gap-4">
                              <span>Bill Total: <strong className="text-slate-900">₹{entry.billTotal?.toFixed(2)}</strong></span>
                              <span>Paid: <strong className="text-emerald-700">₹{entry.paid?.toFixed(2)}</strong></span>
                              {entry.balanceAdded > 0 && (
                                <span className="text-rose-600 font-bold">
                                  +₹{entry.balanceAdded?.toFixed(2)} to Khata
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(entry._id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                            >
                              <Printer className="w-3.5 h-3.5" /> View Receipt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-700 text-sm">
                              Paid Amount: ₹{entry.amount?.toFixed(2)}
                            </span>
                            <span className="text-slate-400">
                              (Old Due: ₹{entry.previousBalance} → New Due: ₹{entry.newBalance})
                            </span>
                          </div>
                          {entry.notes && <span className="text-[11px] text-slate-500 font-sans italic">{entry.notes}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions recorded for this customer yet.
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      {isPaymentModalOpen && (
        <CreditPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          customer={customer}
          onSuccess={fetchLedger}
        />
      )}

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
    </div>
  );
};
