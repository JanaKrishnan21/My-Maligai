import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Send, Copy, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export const ThermalReceipt = ({
  isOpen,
  onClose,
  bill,
  shopSetting,
  whatsAppLink,
  whatsAppMessage,
}) => {
  const { settings, addToast } = useShop();
  const shop = shopSetting || settings;

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (whatsAppLink) {
      window.open(whatsAppLink, '_blank');
      addToast('Opening WhatsApp with bill details...', 'success');
    } else {
      addToast('Customer mobile number is missing for WhatsApp sharing', 'warning');
    }
  };

  const handleCopyBill = () => {
    if (whatsAppMessage) {
      navigator.clipboard.writeText(whatsAppMessage);
      addToast('Bill text copied to clipboard!', 'success');
    }
  };

  const customerName = bill.customerSnapshot?.name || bill.customer?.name || 'Customer';
  const customerPhone = bill.customerSnapshot?.phone || bill.customer?.phone || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Preview"
      subtitle={`Invoice #${bill.invoiceNumber}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center">
        {/* Success Alert Banner (Hidden when printing) */}
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold">Bill Generated Successfully!</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 font-mono">
            ₹{bill.total?.toFixed(2)}
          </span>
        </div>

        {/* Printable Receipt Card */}
        <div
          id="printable-receipt"
          className="w-full max-w-[340px] bg-white border border-slate-300 rounded-lg p-4 font-mono text-[11px] leading-snug text-slate-900 shadow-sm mx-auto select-none"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h3 className="text-sm font-black uppercase tracking-wider">
              {shop?.shopName || 'MY MALIGAI'}
            </h3>
            <p className="text-[10px] text-slate-600 font-medium">
              {shop?.shopTagline || 'Grocery Shop Management'}
            </p>
            {shop?.address && <p className="text-[9px] text-slate-500 mt-0.5">{shop.address}</p>}
            {shop?.phone && <p className="text-[10px] font-semibold mt-0.5">Ph: {shop.phone}</p>}
          </div>

          {/* Invoice Info & Customer */}
          <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold">{bill.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>
                {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-slate-200">
              <span className="text-slate-500 block">Customer:</span>
              <span className="font-bold block">{customerName}</span>
              {customerPhone && <span className="font-mono text-slate-600 block">{customerPhone}</span>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-200 uppercase">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="py-1 space-y-1">
              {bill.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[10px] items-baseline">
                  <span className="col-span-6 truncate pr-1 font-medium">{item.name}</span>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-2 text-right font-mono">₹{item.sellingPrice}</span>
                  <span className="col-span-2 text-right font-bold font-mono">₹{item.total?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, Discount & Total */}
          <div className="py-2 space-y-1 border-b border-dashed border-slate-400 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-mono">₹{bill.subtotal?.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-₹{bill.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
              <span>TOTAL:</span>
              <span className="font-mono">₹{bill.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-0.5">
              <span>Paid ({bill.paymentMethod?.toUpperCase() || 'CASH'}):</span>
              <span className="font-mono">₹{bill.amountPaid?.toFixed(2)}</span>
            </div>
            {bill.balance > 0 && (
              <div className="flex justify-between font-bold text-rose-600">
                <span>Balance:</span>
                <span className="font-mono">₹{bill.balance?.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Running Khata Balance if customer has pending total */}
          {bill.newCustomerBalance > 0 && (
            <div className="py-1.5 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between text-slate-500">
                <span>Previous Balance:</span>
                <span className="font-mono">₹{(bill.previousCustomerBalance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600">
                <span>Total Outstanding:</span>
                <span className="font-mono">₹{(bill.newCustomerBalance || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 text-center text-[10px] text-slate-600 space-y-0.5">
            <p className="font-semibold">{shop?.footerMessage || 'Thank you for shopping!'}</p>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 no-print">
          <Button
            variant="primary"
            icon={Printer}
            onClick={handlePrint}
            className="w-full text-xs font-bold"
          >
            Print Bill
          </Button>
          <Button
            variant="whatsapp"
            icon={Send}
            onClick={handleWhatsApp}
            className="w-full text-xs font-bold"
          >
            Send via WhatsApp
          </Button>
          <Button
            variant="secondary"
            icon={Copy}
            onClick={handleCopyBill}
            className="w-full text-xs col-span-2 sm:col-span-1"
          >
            Copy Text
          </Button>
        </div>

        <div className="w-full mt-3 flex justify-end no-print">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
