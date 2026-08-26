import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { Menu, Search, PlusCircle, Bell, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

export const Header = ({ onMenuClick }) => {
  const { user, isAdmin } = useAuth();
  const { settings, setIsQuickSearchOpen } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/billing') return 'New Bill';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path === '/customers') return 'Customers';
    if (path === '/products') return 'Products';
    if (path === '/inventory') return 'Stock';
    if (path === '/payments') return 'Payments';
    if (path === '/credit') return 'Pending Payments';
    if (path === '/suppliers') return 'Suppliers';
    if (path.startsWith('/bills/')) return 'Bill Details';
    if (path === '/bills') return 'Bills';
    if (path === '/reports') return 'Sales Report';
    if (path === '/settings') return 'Settings';
    return 'My Maligai';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left section: Hamburger button & page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
            {getPageTitle()}
          </h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {settings?.shopName || 'My Maligai'} • {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Right section: Quick Customer Search trigger, New Bill CTA, and profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Customer Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsQuickSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm text-slate-500 bg-slate-100/90 hover:bg-slate-200/70 rounded-xl border border-slate-200/60 transition-all font-medium"
        >
          <Search className="w-4 h-4 text-emerald-600" />
          <span className="hidden md:inline">Customer Mobile Search</span>
          <span className="inline md:hidden">Search</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick New Bill Button */}
        {location.pathname !== '/billing' && (
          <Button
            size="sm"
            variant="primary"
            icon={ShoppingBag}
            onClick={() => navigate('/billing')}
            className="hidden sm:inline-flex"
          >
            New Bill
          </Button>
        )}

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden xl:block">
            <span className="text-xs font-semibold text-slate-800 block leading-none truncate max-w-[120px]">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
