import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Boxes, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

export const MobileNavbar = ({ onOpenDrawer }) => {
  const tabs = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Bill', path: '/billing', icon: ShoppingCart, isPos: true },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Stock', path: '/products', icon: Boxes },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all relative',
                tab.isPos
                  ? isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-emerald-600 font-semibold'
                  : isActive
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.isPos ? (
                  <div className="w-10 h-10 -mt-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white">
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={clsx('w-5 h-5 mb-0.5', isActive ? 'text-emerald-600' : 'text-slate-400')} />
                )}
                <span className={tab.isPos ? 'mt-0.5' : ''}>{tab.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* More / Menu trigger button */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-400" />
        <span>More</span>
      </button>
    </nav>
  );
};
