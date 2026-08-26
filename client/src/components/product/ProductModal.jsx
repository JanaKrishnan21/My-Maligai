import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { Package, Barcode, Tag, IndianRupee, Layers, Truck, Camera } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  suppliers = [],
  onSuccess,
}) => {
  const { addToast } = useShop();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Grains & Flours',
    brand: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    minimumStock: '5',
    unit: 'packet',
    supplier: '',
  });
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const categories = [
    'Atta & Flours',
    'Rice & Grains',
    'Dals & Pulses',
    'Edible Oils & Ghee',
    'Dairy & Breakfast',
    'Spices & Salt',
    'Beverages',
    'Snacks & Biscuits',
    'Cleaning & Home Care',
    'Personal Care',
    'General',
  ];

  const units = ['packet', 'kg', 'g', 'l', 'ml', 'piece', 'box', 'bundle', 'bottle', 'can'];

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          category: product.category || 'General',
          brand: product.brand || '',
          purchasePrice: String(product.purchasePrice || ''),
          sellingPrice: String(product.sellingPrice || ''),
          stock: String(product.stock || '0'),
          minimumStock: String(product.minimumStock || '5'),
          unit: product.unit || 'piece',
          supplier: product.supplier?._id || product.supplier || '',
        });
      } else {
        setFormData({
          name: '',
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          barcode: '',
          category: 'Atta & Flours',
          brand: '',
          purchasePrice: '',
          sellingPrice: '',
          stock: '10',
          minimumStock: '5',
          unit: 'packet',
          supplier: '',
        });
      }
    }
  }, [isOpen, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const purchaseNum = Number(formData.purchasePrice) || 0;
  const sellingNum = Number(formData.sellingPrice) || 0;
  const profitMargin = sellingNum > 0 ? (((sellingNum - purchaseNum) / sellingNum) * 100).toFixed(1) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.purchasePrice === '' || formData.sellingPrice === '') {
      addToast('Name, purchase price, and selling price are required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (product) {
        const res = await api.put(`/products/${product._id}`, formData);
        if (res.data?.success) {
          addToast('Product updated successfully', 'success');
          if (onSuccess) onSuccess(res.data.product);
          onClose();
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.data?.success) {
          addToast('Product created successfully', 'success');
          if (onSuccess) onSuccess(res.data.product);
          onClose();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Grocery Product'}
      subtitle="Configure pricing, stock, unit, and barcode"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Aashirvaad Shudh Chakki Atta 5kg"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            autoFocus
          />
        </div>

        {/* Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Brand / Company</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. ITC, Amul, Tata"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Prices & Profit Margin */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Purchase Cost (₹) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
            <span className="text-xs text-slate-500 block">Gross Profit Margin:</span>
            <span className={`text-base font-extrabold font-mono ${profitMargin >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {profitMargin}% (₹{(sellingNum - purchaseNum).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Stock & Unit */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {product ? 'Stock Count' : 'Initial Stock'}
            </label>
            <input
              type="number"
              step="any"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!!product} // In edit mode, use Restock button to adjust stock with audit trail
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Low Stock Alert</label>
            <input
              type="number"
              min="0"
              name="minimumStock"
              value={formData.minimumStock}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Barcode & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">Barcode (EAN / UPC)</label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
              >
                <Camera className="w-3 h-3" />
                <span>Scan Barcode</span>
              </button>
            </div>
            <div className="relative">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Scan or type barcode..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier</label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- No Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {product ? 'Update Product' : 'Add to Inventory'}
          </Button>
        </div>
      </form>

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            setFormData((prev) => ({ ...prev, barcode: code }));
            addToast(`Barcode scanned: ${code}`, 'success');
          }}
          title="Scan Product Barcode"
          subtitle="Point camera at product packaging barcode"
        />
      )}
    </Modal>
  );
};
