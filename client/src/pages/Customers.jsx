import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, TableSkeleton } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/EmptyState';
import { CustomerModal } from '../components/customer/CustomerModal';
import { CreditPaymentModal } from '../components/customer/CreditPaymentModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  CreditCard,
  Send,
  ArrowRight,
  Edit2,
  Trash2,
  ShoppingBag,
  Clock,
  Filter,
} from 'lucide-react';
import api from '../services/api';

export const Customers = () => {
  const { addToast } = useShop();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterHasBalance, setFilterHasBalance] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [initialPhone, setInitialPhone] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let url = `/customers?search=${search}&limit=100`;
      if (filterHasBalance) url += '&hasBalance=true';
      const res = await api.get(url);
      if (res.data?.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load customers from the database.');
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterHasBalance, addToast]);

  useEffect(() => {
    fetchCustomers();

    if (location.state?.openCreateModal) {
      setInitialPhone(location.state.initialPhone || '');
      setIsCreateModalOpen(true);
    }
  }, [fetchCustomers, location.state]);

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/customers/${deletingCustomer._id}`);
      if (res.data?.success) {
        addToast('Customer deleted successfully', 'success');
        setDeletingCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete customer', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendReminder = async (customer) => {
    try {
      const res = await api.post('/reminders/send', { customerId: customer._id });
      if (res.data?.whatsAppLink) {
        window.open(res.data.whatsAppLink, '_blank');
        addToast(`Opening WhatsApp reminder for ${customer.name}...`, 'success');
        fetchCustomers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send reminder', 'error');
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header & Khata Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Customer Directory & Khata</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Customers: {customers.length} • Outstanding Credit: <strong className="text-rose-600 font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setInitialPhone('');
            setIsCreateModalOpen(true);
          }}
          className="font-bold shadow-sm"
        >
          Add New Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterHasBalance(!filterHasBalance)}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                filterHasBalance
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Only Pending Khata (Due)</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Customers Table / Cards */}
      <Card>
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone & Address</th>
                  <th className="px-4 py-3 text-right">Total Purchases</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Khata Balance</th>
                  <th className="px-4 py-3">Last Visit</th>
                  <th className="px-4 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${c._id}`)}
                        className="text-left font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        {c.name}
                      </button>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.address && <p className="text-[10px] text-slate-400 font-sans truncate max-w-[150px]">{c.address}</p>}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-medium">
                      ₹{(c.totalPurchases || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-medium">
                      ₹{(c.totalPaid || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹{c.balance?.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {c.lastPurchaseAt
                        ? new Date(c.lastPurchaseAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Never'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate('/billing', { state: { selectedCustomer: c } })}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Start New Bill"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayingCustomer(c)}
                          className="p-1.5 text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Collect Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {c.balance > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(c)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/customers/${c._id}`)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Ledger Timeline"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingCustomer(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Unable to load customer list"
              description={fetchError}
              onRetry={fetchCustomers}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new customer.</p>
          </div>
        )}
      </Card>

      {/* Modals */}
      {isCreateModalOpen && (
        <CustomerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialPhone={initialPhone}
          onSuccess={fetchCustomers}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          customer={editingCustomer}
          onSuccess={fetchCustomers}
        />
      )}

      {payingCustomer && (
        <CreditPaymentModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          customer={payingCustomer}
          onSuccess={fetchCustomers}
        />
      )}

      {deletingCustomer && (
        <ConfirmDialog
          isOpen={!!deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={handleDelete}
          title={`Delete ${deletingCustomer.name}?`}
          message="Are you sure you want to remove this customer? Customers with active balances cannot be deleted."
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
