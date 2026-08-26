import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const CustomerModal = ({
  isOpen,
  onClose,
  customer = null,
  initialPhone = '',
  onSuccess,
}) => {
  const { addToast } = useShop();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    initialBalance: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || '',
          initialBalance: '',
        });
      } else {
        setFormData({
          name: '',
          phone: initialPhone || '',
          email: '',
          address: '',
          notes: '',
          initialBalance: '',
        });
      }
    }
  }, [isOpen, customer, initialPhone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      addToast('Customer name and phone number are required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (customer) {
        // Edit existing customer
        const res = await api.put(`/customers/${customer._id}`, formData);
        if (res.data?.success) {
          addToast('Customer updated successfully', 'success');
          if (onSuccess) onSuccess(res.data.customer);
          onClose();
        }
      } else {
        // Create new customer
        const res = await api.post('/customers', {
          ...formData,
          initialBalance: Number(formData.initialBalance || 0),
        });
        if (res.data?.success) {
          addToast('Customer created successfully', 'success');
          if (onSuccess) onSuccess(res.data.customer);
          onClose();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      subtitle="Manage customer contact and Khata balance information"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Customer Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ravi Kumar"
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Mobile Number * (Used for WhatsApp Bills & Reminders)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
              required
            />
          </div>
        </div>

        {/* Email & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Address / Street</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Street details"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Initial Balance if creating new customer */}
        {!customer && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Existing / Opening Credit Balance (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="initialBalance"
              value={formData.initialBalance}
              onChange={handleChange}
              placeholder="0.00 (Enter if customer already owes money)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Notes</label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Special preferences, payment habits, etc."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {customer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
