import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSpinner';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Printer,
  Ban,
  Calendar,
  Filter,
  PlusCircle,
  Eye,
  Send,
} from 'lucide-react';
import api from '../services/api';

export const Bills = () => {
  const { addToast } = useShop();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [cancellingBill, setCancellingBill] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/bills?limit=100&search=${search}`;
      if (paymentStatus !== 'all') url += `&paymentStatus=${paymentStatus}`;
      if (paymentMethod !== 'all') url += `&paymentMethod=${paymentMethod}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setBills(res.data.bills || []);
      }
    } catch {
      addToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, paymentMethod, addToast]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleOpenReceipt = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      if (res.data?.success) {
        setSelectedReceipt(res.data);
      }
    } catch {
      addToast('Failed to load bill receipt', 'error');
    }
  };

  const handleCancelBill = async () => {
    if (!cancellingBill) return;
    setCancelLoading(true);
    try {
      const res = await api.post(`/bills/${cancellingBill._id}/cancel`);
      if (res.data?.success) {
        addToast(`Bill #${cancellingBill.invoiceNumber} cancelled and stock returned`, 'success');
        setCancellingBill(null);
        fetchBills();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel bill', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Bills & Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            History of POS sales invoices, payment statuses, and thermal print records
          </p>
        </div>

        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => navigate('/billing')}
          className="font-bold shadow-sm"
        >
          New Bill (POS)
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid Full</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="credit">Credit (Unpaid)</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI / QR</option>
            <option value="card">Card</option>
            <option value="credit">Khata Credit</option>
          </select>
        </div>
      </Card>

      {/* Bills Table */}
      <Card>
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items Count</th>
                  <th className="px-4 py-3 text-right">Bill Total</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(b._id)}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {b.invoiceNumber}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(b.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold block text-slate-800">
                        {b.customerSnapshot?.name || 'Walk-in'}
                      </span>
                      {b.customerSnapshot?.phone && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.customerSnapshot.phone}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {b.items?.length || 0} item{b.items?.length > 1 ? 's' : ''}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                      ₹{b.total?.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-700">
                      ₹{b.amountPaid?.toFixed(2)}
                      {b.balance > 0 && (
                        <span className="text-[10px] text-rose-600 block">
                          Due: ₹{b.balance.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {b.paymentStatus === 'paid' ? (
                        <Badge variant="success" size="sm">Paid</Badge>
                      ) : b.paymentStatus === 'partially_paid' ? (
                        <Badge variant="warning" size="sm">Partial</Badge>
                      ) : b.paymentStatus === 'credit' ? (
                        <Badge variant="danger" size="sm">Credit</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Cancelled</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(b._id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View & Print Thermal Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {isAdmin && b.paymentStatus !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setCancellingBill(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel Bill & Return Stock"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold">No invoices found</p>
          </div>
        )}
      </Card>

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceipt
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          bill={selectedReceipt.bill}
          shopSetting={selectedReceipt.shopSetting}
          whatsAppMessage={selectedReceipt.whatsAppMessage}
          whatsAppLink={selectedReceipt.whatsAppLink}
        />
      )}

      {/* Cancel Bill Confirmation */}
      {cancellingBill && (
        <ConfirmDialog
          isOpen={!!cancellingBill}
          onClose={() => setCancellingBill(null)}
          onConfirm={handleCancelBill}
          title={`Cancel Invoice #${cancellingBill.invoiceNumber}?`}
          message="Cancelling this bill will automatically restore all item quantities back into inventory stock and reverse any Khata credit given."
          loading={cancelLoading}
          confirmText="Yes, Cancel Bill"
        />
      )}
    </div>
  );
};
