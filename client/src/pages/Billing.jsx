import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PaymentModal } from '../components/billing/PaymentModal';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { CustomerModal } from '../components/customer/CustomerModal';
import { BarcodeScannerModal } from '../components/common/BarcodeScannerModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Tag,
  CreditCard,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
  AlertCircle,
  Camera,
} from 'lucide-react';
import api from '../services/api';

export const Billing = () => {
  const { addToast } = useShop();
  const location = useLocation();

  // Product Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  
  // Customer State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Modals & Final Bill
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isCustomerRequiredModalOpen, setIsCustomerRequiredModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [finalBillData, setFinalBillData] = useState(null);
  const [savingBill, setSavingBill] = useState(false);

  // Mobile View Tab (Catalog vs Cart)
  const [mobileTab, setMobileTab] = useState('catalog');

  const barcodeInputRef = useRef(null);

  // Load products and categories
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=200');
      if (res.data?.success) {
        setProducts(res.data.products || []);
        setCategories(['All', ...(res.data.categories || [])]);
      }
    } catch {
      addToast('Failed to load products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Search customers by phone or name
  const fetchCustomers = async (search = '') => {
    try {
      const res = await api.get(`/customers?search=${search}&limit=10`);
      if (res.data?.success) {
        setCustomers(res.data.customers || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();

    // Check if a customer was pre-selected from quick search or customer details
    if (location.state?.selectedCustomer) {
      setSelectedCustomer(location.state.selectedCustomer);
    }
  }, [location.state]);

  // Barcode / Fast Search Handler
  const handleProductSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // If barcode scanner inputs an exact match barcode (usually > 6 digits followed by Enter or full length)
    if (val && val.length >= 8) {
      const exactMatch = products.find((p) => p.barcode === val.trim() || p.sku === val.trim());
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  };

  const handleBarcodeScanned = useCallback(async (code) => {
    if (!code) return;
    const clean = code.trim();

    // 1. Search locally in loaded products
    let matched = products.find(
      (p) => p.barcode === clean || p.sku === clean || (p.barcode && p.barcode.endsWith(clean))
    );

    // 2. If not found locally, query API
    if (!matched) {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(clean)}&limit=1`);
        if (res.data?.success && res.data.products && res.data.products.length > 0) {
          matched = res.data.products[0];
        }
      } catch {
        // ignore
      }
    }

    if (matched) {
      if (matched.stock <= 0) {
        addToast(`"${matched.name}" is Out of Stock!`, 'warning');
        return;
      }
      addToCart(matched);
      addToast(`Scanned & added: ${matched.name}`, 'success');
    } else {
      addToast(`No product found for barcode: ${clean}`, 'error');
    }
  }, [products]);

  // Global USB / Bluetooth Hardware Barcode Gun listener
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      const target = e.target;
      const isInputActive = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault();
          handleBarcodeScanned(barcodeBuffer.trim());
          barcodeBuffer = '';
        }
        return;
      }

      // Barcode guns send keystrokes very fast (< 60ms)
      if (e.key.length === 1) {
        if (timeDiff > 65 && !isInputActive) {
          barcodeBuffer = e.key;
        } else {
          barcodeBuffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleBarcodeScanned]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      addToast(`${product.name} is Out of Stock!`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addToast(`Maximum available stock reached (${product.stock} ${product.unit})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, total: Number(((item.quantity + 1) * item.sellingPrice).toFixed(2)) }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            unit: product.unit || 'piece',
            sellingPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            quantity: 1,
            maxStock: product.stock,
            total: product.sellingPrice,
          },
        ];
      }
    });

    addToast(`Added ${product.name}`, 'success', 1500);
  };

  const updateQuantity = (productId, newQty) => {
    const qty = Number(newQty);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const finalQty = Math.min(qty, item.maxStock);
          return {
            ...item,
            quantity: finalQty,
            total: Number((finalQty * item.sellingPrice).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear the current bill items?')) {
      setCart([]);
      setDiscount('');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Financial Calculations
  const subtotal = Number(cart.reduce((sum, i) => sum + (i.total || 0), 0).toFixed(2));
  const discountVal = Math.min(Number(discount || 0), subtotal);
  const grandTotal = Number((subtotal - discountVal).toFixed(2));

  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add products to create a bill.', 'warning');
      return;
    }

    // Customer MUST be required before payment
    if (!selectedCustomer || !selectedCustomer.name || !selectedCustomer.phone) {
      setIsCustomerRequiredModalOpen(true);
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (paymentDetails) => {
    if (!selectedCustomer || !selectedCustomer.name || !selectedCustomer.phone) {
      setIsCustomerRequiredModalOpen(true);
      return;
    }

    setSavingBill(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          sellingPrice: i.sellingPrice,
        })),
        discount: discountVal,
        amountPaid: paymentDetails.amountPaid,
        paymentMethod: paymentDetails.paymentMethod,
        notes: paymentDetails.notes,
      };

      const res = await api.post('/bills', payload);
      if (res.data?.success) {
        addToast(`Bill #${res.data.bill.invoiceNumber} created successfully!`, 'success');
        setFinalBillData(res.data);
        setIsPaymentModalOpen(false);
        setIsReceiptOpen(true);

        // Reset cart and customer for next bill
        setCart([]);
        setDiscount('');
        setSelectedCustomer(null);
        setCustomerSearch('');

        // Refresh product stock list in background
        fetchProducts();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Bill creation failed', 'error');
    } finally {
      setSavingBill(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Product Catalog
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
            mobileTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bill Items ({cart.length}) • ₹{grandTotal.toFixed(2)}
          {cart.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-4" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Catalog and Search */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileTab === 'catalog' ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card className="p-4">
            {/* Search Bar & Barcode scanner trigger */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleProductSearch}
                  placeholder="Search by Product Name, SKU, or Barcode..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsBarcodeScannerOpen(true)}
                icon={Camera}
                className="font-bold flex-shrink-0 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <span className="hidden sm:inline">Scan Barcode</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 mt-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minimumStock;

              return (
                <div
                  key={product._id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200/90 shadow-soft hover:shadow-md hover:border-emerald-400 cursor-pointer card-hover'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase truncate">
                        {product.brand || product.category}
                      </span>
                      {isOutOfStock ? (
                        <Badge variant="danger" size="sm">Out</Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning" size="sm">{product.stock} {product.unit}</Badge>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {product.stock} {product.unit}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">
                      ₹{product.sellingPrice}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart & Customer Attachment */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileTab === 'cart' ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card className="flex flex-col shadow-soft-lg border-emerald-200/70">
            {/* Header: Customer Selector */}
            <CardHeader className="bg-slate-50/70 py-3">
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Customer (Khata / Mobile)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + New Customer
                  </button>
                </div>

                {selectedCustomer ? (
                  <div className="p-2.5 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{selectedCustomer.name}</span>
                        {selectedCustomer.balance > 0 ? (
                          <Badge variant="danger" size="sm">Due: ₹{selectedCustomer.balance}</Badge>
                        ) : (
                          <Badge variant="success" size="sm">No Due</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        fetchCustomers(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer by name or 10-digit mobile..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />

                    {/* Customer Autocomplete Dropdown */}
                    {showCustomerDropdown && customers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {customers.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setShowCustomerDropdown(false);
                              setCustomerSearch('');
                            }}
                            className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block">{c.name}</span>
                              <span className="text-slate-400 font-mono">{c.phone}</span>
                            </div>
                            <span className={`font-bold font-mono ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {c.balance > 0 ? `Khata: ₹${c.balance}` : '₹0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Line Items List */}
            <div className="p-3 max-h-[340px] min-h-[180px] overflow-y-auto divide-y divide-slate-100">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ₹{item.sellingPrice} / {item.unit}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded bg-white text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, e.target.value)}
                        className="w-10 text-center text-xs font-bold bg-transparent font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded bg-white text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[60px]">
                      <span className="text-xs font-bold text-slate-900 font-mono block">
                        ₹{item.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 mb-2 opacity-40 text-emerald-600" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-slate-400">Tap items on the left to add to bill</p>
                </div>
              )}
            </div>

            {/* Financial Calculations & Checkout Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-600" /> Discount (₹):
                </span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-rose-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-slate-900 uppercase">Grand Total:</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-xs text-slate-500 hover:text-rose-600"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="col-span-3 font-bold shadow-md shadow-emerald-600/30 text-sm sm:text-base"
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Proceed to Pay
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Strict Customer Required Alert Modal */}
      <Modal
        isOpen={isCustomerRequiredModalOpen}
        onClose={() => setIsCustomerRequiredModalOpen(false)}
        title="Customer Required"
        maxWidth="max-w-sm"
        showClose={true}
      >
        <div className="py-3 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed px-2">
            Please enter or select a customer before proceeding to payment.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsCustomerRequiredModalOpen(false);
                setShowCustomerDropdown(true);
              }}
              className="w-full justify-center font-bold"
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Checkout Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          total={grandTotal}
          subtotal={subtotal}
          discount={discountVal}
          customer={selectedCustomer}
          onConfirm={handleConfirmPayment}
          loading={savingBill}
        />
      )}

      {/* Final Thermal Bill Receipt Modal */}
      {isReceiptOpen && finalBillData && (
        <ThermalReceipt
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          bill={finalBillData.bill}
          whatsAppMessage={finalBillData.whatsAppMessage}
          whatsAppLink={finalBillData.whatsAppLink}
        />
      )}

      {/* Inline Add Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={(newCust) => {
            setSelectedCustomer(newCust);
            fetchCustomers();
          }}
        />
      )}

      {/* Barcode Camera Scanner Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onScan={handleBarcodeScanned}
          title="Scan Product to Bill"
          subtitle="Point camera at product barcode to add directly to cart"
        />
      )}
    </div>
  );
};
