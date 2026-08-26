import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Printer,
  MessageSquare,
  Clock,
  Save,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

export const Settings = () => {
  const { settings, setSettings, addToast } = useShop();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    shopName: '',
    shopTagline: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    currencySymbol: '₹',
    invoicePrefix: 'INV',
    reminderIntervalDays: 2,
    lowStockThresholdDefault: 5,
    thermalPaperWidth: '80mm',
    footerMessage: '',
    whatsappConfig: {
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
    },
  });

  const [loading, setLoading] = useState(false);

  // Staff creation state
  const [staffData, setStaffData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    role: 'cashier',
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (settings) {
      setFormData({
        shopName: settings.shopName || 'KadaiMate Grocery',
        shopTagline: settings.shopTagline || '',
        ownerName: settings.ownerName || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        gstNumber: settings.gstNumber || '',
        currencySymbol: settings.currencySymbol || '₹',
        invoicePrefix: settings.invoicePrefix || 'INV',
        reminderIntervalDays: settings.reminderIntervalDays || 2,
        lowStockThresholdDefault: settings.lowStockThresholdDefault || 5,
        thermalPaperWidth: settings.thermalPaperWidth || '80mm',
        footerMessage: settings.footerMessage || '',
        whatsappConfig: {
          accessToken: settings.whatsappConfig?.accessToken || '',
          phoneNumberId: settings.whatsappConfig?.phoneNumberId || '',
          businessAccountId: settings.whatsappConfig?.businessAccountId || '',
        },
      });
    }

    if (isAdmin) {
      api.get('/auth/users').then((res) => {
        if (res.data?.success) setUsersList(res.data.users || []);
      }).catch(() => {});
    }
  }, [settings, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('wa_')) {
      const field = name.replace('wa_', '');
      setFormData((prev) => ({
        ...prev,
        whatsappConfig: { ...prev.whatsappConfig, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', formData);
      if (res.data?.success) {
        setSettings(res.data.setting);
        addToast('Shop settings updated successfully', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffData.name || !staffData.username || !staffData.password) {
      addToast('Name, username, and password are required', 'error');
      return;
    }

    setStaffLoading(true);
    try {
      const res = await api.post('/auth/users', staffData);
      if (res.data?.success) {
        addToast(`Staff account created for ${staffData.name}`, 'success');
        setStaffData({ name: '', username: '', password: '', phone: '', role: 'cashier' });
        const uRes = await api.get('/auth/users');
        if (uRes.data?.success) setUsersList(uRes.data.users || []);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create staff account', 'error');
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Shop Settings & Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure store identity, receipt layouts, WhatsApp automation, and cashier staff
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Store Profile & Billing Header</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Shop / Store Name *
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tagline</label>
              <input
                type="text"
                name="shopTagline"
                value={formData.shopTagline}
                onChange={handleChange}
                placeholder="Fresh Groceries • Daily Essentials"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Store Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">GST / Tax Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address / Street</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </Card>

        {/* Invoice & Thermal Printer Preferences */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Invoice & Thermal Printer Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Receipt Paper Width</label>
              <select
                name="thermalPaperWidth"
                value={formData.thermalPaperWidth}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="80mm">80mm (Standard POS Thermal)</option>
                <option value="58mm">58mm (Compact Thermal)</option>
                <option value="a4">A4 Full Sheet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Auto Reminder Interval</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  name="reminderIntervalDays"
                  value={formData.reminderIntervalDays}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Days</span>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Receipt Footer Note</label>
              <input
                type="text"
                name="footerMessage"
                value={formData.footerMessage}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </Card>

        {/* WhatsApp Cloud API */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Integration</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Web Link Fallback Always Active
            </span>
          </div>

          <p className="text-xs text-slate-500">
            When WhatsApp Cloud API credentials are left blank, KadaiMate automatically creates direct pre-filled WhatsApp web & mobile chat links for instant 1-click bill and payment reminder dispatch without requiring server API keys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Meta Cloud API Access Token (Optional)</label>
              <input
                type="password"
                name="wa_accessToken"
                value={formData.whatsappConfig.accessToken}
                onChange={handleChange}
                placeholder="EAABw..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number ID</label>
              <input
                type="text"
                name="wa_phoneNumberId"
                value={formData.whatsappConfig.phoneNumberId}
                onChange={handleChange}
                placeholder="10065..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Business Account ID</label>
              <input
                type="text"
                name="wa_businessAccountId"
                value={formData.whatsappConfig.businessAccountId}
                onChange={handleChange}
                placeholder="10293..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </Card>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={Save}
            className="font-bold shadow-md shadow-emerald-600/30"
          >
            Save All Settings
          </Button>
        </div>
      </form>

      {/* Staff Management Section for Admin */}
      {isAdmin && (
        <Card className="p-5 space-y-4 mt-8">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Cashier & Staff Accounts</h3>
          </div>

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={staffData.name}
                onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                placeholder="Staff name"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
              <input
                type="text"
                value={staffData.username}
                onChange={(e) => setStaffData({ ...staffData, username: e.target.value })}
                placeholder="login username"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
              <input
                type="password"
                value={staffData.password}
                onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" variant="primary" size="sm" loading={staffLoading} className="w-full">
                + Create Staff
              </Button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {usersList.map((u) => (
              <div key={u._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{u.name}</span>
                  <span className="text-slate-400 font-mono ml-2">(@{u.username})</span>
                </div>
                <span className="capitalize font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
