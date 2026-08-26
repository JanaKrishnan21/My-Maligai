import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  CreditCard,
  BookOpen,
  Truck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useShop();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Bill', path: '/billing', icon: ShoppingCart, highlight: true },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Credit', path: '/credit', icon: BookOpen },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Bills', path: '/bills', icon: FileText },
    ...(isAdmin
      ? [
          { name: 'Reports', path: '/reports', icon: BarChart3 },
          { name: 'Settings', path: '/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Logo & Name */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-slate-900 truncate tracking-tight">
              My Maligai
            </h1>
            <p className="text-xs text-slate-500 truncate -mt-0.5">
              {settings?.shopName || 'Grocery Shop'}
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-emerald-50 text-emerald-800 font-semibold'
                      : item.highlight
                      ? 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={clsx(
                        'w-5 h-5 flex-shrink-0 transition-colors',
                        isActive
                          ? item.highlight
                            ? 'text-white'
                            : 'text-emerald-600'
                          : item.highlight
                          ? 'text-emerald-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && !item.highlight && (
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Staff'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  {isAdmin ? (
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <UserCheck className="w-3 h-3 text-sky-600" />
                  )}
                  <span className="capitalize">{user?.role || 'cashier'}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};
