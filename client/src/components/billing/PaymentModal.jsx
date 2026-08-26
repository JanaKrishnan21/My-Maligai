import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Banknote,
  QrCode,
  CreditCard as CardIcon,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

export const PaymentModal = ({
  isOpen,
  onClose,
  total = 0,
  subtotal = 0,
  discount = 0,
  customer = null,
  onConfirm,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  const previousBalance = customer?.balance || 0;
  const currentBill = Number(total.toFixed(2));
  const totalOutstanding = Number((previousBalance + currentBill).toFixed(2));

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setAmountPaid(String(currentBill));
      setNotes('');
    }
  }, [isOpen, currentBill]);

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'credit') {
      setAmountPaid('0');
    } else if (Number(amountPaid) === 0) {
      setAmountPaid(String(currentBill));
    }
  };

  const parsedPaid = Number(amountPaid || 0);
  const remainingBalance = Math.max(0, Number((totalOutstanding - parsedPaid).toFixed(2)));
  const changeDue = Math.max(0, Number((parsedPaid - totalOutstanding).toFixed(2)));

  const handleSetExactBill = () => {
    setAmountPaid(String(currentBill));
  };

  const handleSetFullOutstanding = () => {
    setAmountPaid(String(totalOutstanding));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customer || !customer.name || !customer.phone) {
      alert('Please enter or select a customer before proceeding to payment.');
      return;
    }

    onConfirm({
      paymentMethod,
      amountPaid: parsedPaid,
      notes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment"
      subtitle="Verify customer and confirm payment"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Customer</span>
              <span className="font-bold text-slate-900 text-sm block truncate">
                {customer?.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Mobile</span>
              <span className="font-bold text-slate-900 text-sm font-mono block">
                {customer?.phone || '—'}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
            {previousBalance > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Previous Balance:</span>
                <span className="font-semibold text-rose-600 font-mono">₹{previousBalance.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>Current Bill:</span>
              <span className="font-bold font-mono">₹{currentBill.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Outstanding:</span>
              <span className="font-mono text-emerald-800">₹{totalOutstanding.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'upi', label: 'UPI', icon: QrCode },
              { id: 'card', label: 'Card', icon: CardIcon },
              { id: 'credit', label: 'Credit', icon: BookOpen },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMethodChange(m.id)}
                  className={clsx(
                    'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all select-none',
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Icon className={clsx('w-4 h-4 mb-1', isSelected ? 'text-emerald-600' : 'text-slate-500')} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Paid Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Amount Paid (₹)
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSetExactBill}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
              >
                Bill (₹{currentBill})
              </button>
              {previousBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSetFullOutstanding}
                  className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[11px] font-medium"
                >
                  Full (₹{totalOutstanding})
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
            <input
              type="number"
              step="any"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Remaining Balance or Change Due Display */}
        <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Remaining Balance:</span>
          <span
            className={clsx(
              'text-base font-extrabold font-mono',
              remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
            )}
          >
            ₹{remainingBalance.toFixed(2)}
          </span>
        </div>

        {changeDue > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex justify-between items-center">
            <span>Change to Return:</span>
            <span className="font-bold font-mono">₹{changeDue.toFixed(2)}</span>
          </div>
        )}

        {/* Optional Notes */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Notes / Reference (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. UPI Ref # or promised date"
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="flex-1 font-bold"
          >
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
