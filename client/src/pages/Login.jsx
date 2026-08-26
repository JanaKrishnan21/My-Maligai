import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/common/Button';
import { Store, Lock, User, ShieldCheck, UserCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { settings } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier');
      setPassword('cashier123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Treatment */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Maligai
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Grocery Shop Management System
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-sm rounded-xl border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-1">Owner & Staff Login</h3>
          <p className="text-xs text-slate-500 mb-5">
            Sign in to manage bills, customers, stock, and payments.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Username / Mobile Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or mobile number"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full font-bold justify-center"
            >
              Sign In to My Maligai
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex items-center justify-center gap-1.5 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin (Owner)</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('cashier')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all"
              >
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span>Cashier Staff</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          My Maligai • Grocery Shop Management
        </p>
      </div>
    </div>
  );
};
