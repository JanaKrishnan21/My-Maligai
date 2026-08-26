import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Banknote, QrCode, CreditCard as CardIcon, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const CreditPaymentModal = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { addToast } = useShop();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      setAmount(String(customer.balance || ''));
      setPaymentMethod('cash');
      setNotes('');
      setReceiptData(null);
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  const currentBalance = customer.balance || 0;
  const payNum = Number(amount) || 0;
  const remaining = Math.max(0, Number((currentBalance - payNum).toFixed(2)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payNum <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/customers/${customer._id}/pay`, {
        amount: payNum,
        paymentMethod,
        notes,
      });

      if (res.data?.success) {
        addToast(`Payment of ₹${payNum} recorded for ${customer.name}`, 'success');
        setReceiptData(res.data);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Payment recording failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (receiptData?.whatsAppLink) {
      window.open(receiptData.whatsAppLink, '_blank');
      addToast('Opening WhatsApp receipt link...', 'success');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receiptData ? 'Payment Receipt' : 'Collect Khata Payment'}
      subtitle={`Customer: ${customer.name} (${customer.phone})`}
      maxWidth="max-w-md"
    >
      {!receiptData ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Outstanding Summary */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-800 uppercase block">
                Total Outstanding Khata
              </span>
              <span className="text-2xl font-black text-rose-700 font-mono">
                ₹{currentBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmount(String(currentBalance))}
              className="px-2.5 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
            >
              Pay Full Due
            </button>
          </div>

          {/* Amount Paid Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / GPay', icon: QrCode },
                { id: 'card', label: 'Card', icon: CardIcon },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={clsx(
                      'flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all',
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remaining Balance Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-500">Remaining Balance after payment:</span>
            <span
              className={`font-bold font-mono text-sm ${
                remaining > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{remaining.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={CheckCircle2}
              className="flex-1 sm:flex-none font-bold"
            >
              Confirm Collection (₹{payNum.toFixed(2)})
            </Button>
          </div>
        </form>
      ) : (
        /* Payment Done Confirmation with WhatsApp Link */
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Payment Recorded!</h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Collected ₹{payNum} via {paymentMethod.toUpperCase()} from {customer.name}.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-left font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Previous Due:</span>
              <span>₹{currentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Paid Today:</span>
              <span>-₹{payNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
              <span>Remaining Due:</span>
              <span className="text-rose-600">₹{remaining.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {receiptData.whatsAppLink && (
              <Button
                variant="whatsapp"
                icon={Send}
                onClick={handleOpenWhatsApp}
                className="w-full"
              >
                Send WhatsApp Receipt
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
