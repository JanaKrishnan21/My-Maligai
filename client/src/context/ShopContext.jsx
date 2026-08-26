import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shopName: 'My Maligai',
    shopTagline: 'Grocery Shop Management',
    phone: '+91 98765 43210',
    currencySymbol: '₹',
    thermalPaperWidth: '80mm',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.success && res.data.setting) {
        setSettings(res.data.setting);
      }
    } catch {
      // Use defaults if not authenticated yet
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Toast helper
  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ShopContext.Provider
      value={{
        settings,
        setSettings,
        fetchSettings,
        loadingSettings,
        isQuickSearchOpen,
        setIsQuickSearchOpen,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
