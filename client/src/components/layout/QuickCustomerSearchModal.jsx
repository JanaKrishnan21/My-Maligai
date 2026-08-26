import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Search, Phone, User, Calendar, CreditCard, ShoppingBag, Send, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const QuickCustomerSearchModal = () => {
  const { isQuickSearchOpen, setIsQuickSearchOpen, addToast } = useShop();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isQuickSearchOpen) {
      setQuery('');
      setResult(null);
      setNotFound(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isQuickSearchOpen]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      // First try phone lookup
      const res = await api.get(`/customers/phone/${clean}`);
      if (res.data?.success && res.data.customer) {
        setResult(res.data);
      }
    } catch {
      // Fallback: search by name/phone query in customers list
      try {
        const searchRes = await api.get(`/customers?search=${clean}&limit=1`);
        if (searchRes.data?.customers && searchRes.data.customers.length > 0) {
          const cust = searchRes.data.customers[0];
          const fullRes = await api.get(`/customers/phone/${cust.phone}`);
          setResult(fullRes.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsQuickSearchOpen(false);
  };

  const handleStartBill = (customer) => {
    handleClose();
    navigate('/billing', { state: { selectedCustomer: customer } });
  };

  const handleViewLedger = (customerId) => {
    handleClose();
    navigate(`/customers/${customerId}`);
  };

  const handleSendReminder = (link) => {
    if (link) {
      window.open(link, '_blank');
      addToast('WhatsApp reminder link opened', 'success');
    }
  };

  return (
    <Modal
      isOpen={isQuickSearchOpen}
      onClose={handleClose}
      title="Quick Customer Search"
      subtitle="Instantly look up customer khata balance and purchase history by phone"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter customer mobile number (e.g. 9876543210)..."
            className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 transition-all font-mono"
          />
          <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <div className="absolute right-2 top-2">
            <Button type="submit" size="sm" loading={loading} variant="primary">
              Search
            </Button>
          </div>
        </div>
      </form>

      {notFound && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <p className="text-sm font-medium text-amber-800">
            No customer found matching "{query}".
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                handleClose();
                navigate('/customers', { state: { openCreateModal: true, initialPhone: query } });
              }}
            >
              + Create Customer with this Phone
            </Button>
          </div>
        </div>
      )}

      {result && result.customer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-900">{result.customer.name}</h4>
                {result.customer.balance > 0 ? (
                  <Badge variant="danger" dot>
                    Khata Due
                  </Badge>
                ) : (
                  <Badge variant="success" dot>
                    No Due
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                <Phone className="w-3.5 h-3.5" /> {result.customer.phone}
              </p>
              {result.customer.address && (
                <p className="text-xs text-slate-500 mt-1">{result.customer.address}</p>
              )}
            </div>

            <div className="text-right bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-400 block uppercase">Outstanding Balance</span>
              <span
                className={`text-xl font-extrabold ${
                  result.customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                ₹{result.customer.balance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">Total Purchases</span>
              <span className="font-semibold text-slate-800 text-sm">
                ₹{(result.customer.totalPurchases || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">Total Paid</span>
              <span className="font-semibold text-emerald-700 text-sm">
                ₹{(result.customer.totalPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block">Last Purchase</span>
              <span className="font-semibold text-slate-800 text-sm">
                {result.customer.lastPurchaseAt
                  ? new Date(result.customer.lastPurchaseAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'None'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <Button
              size="sm"
              variant="primary"
              icon={ShoppingBag}
              onClick={() => handleStartBill(result.customer)}
            >
              New Bill
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={CreditCard}
              onClick={() => {
                handleClose();
                navigate('/payments', { state: { openPaymentModal: true, customer: result.customer } });
              }}
            >
              Collect Pay
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={ArrowRight}
              onClick={() => handleViewLedger(result.customer._id)}
            >
              Ledger
            </Button>
            {result.customer.balance > 0 && result.reminderLink ? (
              <Button
                size="sm"
                variant="whatsapp"
                icon={Send}
                onClick={() => handleSendReminder(result.reminderLink)}
              >
                Reminder
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
