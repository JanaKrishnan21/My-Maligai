import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PlusCircle, Truck, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const RestockModal = ({
  isOpen,
  onClose,
  product = null,
  suppliers = [],
  onSuccess,
}) => {
  const { addToast } = useShop();
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity('10');
      setPurchasePrice(String(product.purchasePrice || ''));
      setSellingPrice(String(product.sellingPrice || ''));
      setSupplierId(product.supplier?._id || product.supplier || '');
      setNotes('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const currentStock = product.stock || 0;
  const addQty = Number(quantity) || 0;
  const newProjectedStock = Number((currentStock + addQty).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addQty <= 0) {
      addToast('Please enter a positive restock quantity', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/inventory/restock', {
        productId: product._id,
        quantity: addQty,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        supplierId: supplierId || null,
        notes,
      });

      if (res.data?.success) {
        addToast(`Restocked +${addQty} ${product.unit} of ${product.name}`, 'success');
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Restock failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restock Product"
      subtitle={`${product.name} (${product.unit})`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Stock Level Preview */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Current Stock:</span>
            <span className="text-base font-bold text-slate-800">
              {currentStock} {product.unit}
            </span>
          </div>
          <div className="text-right">
            <span className="text-emerald-700 block font-sans font-medium">Projected New Stock:</span>
            <span className="text-lg font-black text-emerald-800">
              {newProjectedStock} {product.unit}
            </span>
          </div>
        </div>

        {/* Quantity to Add */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Quantity to Add ({product.unit}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 20"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            autoFocus
          />
        </div>

        {/* Pricing Check */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Purchase Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-emerald-700 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier / Vendor</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- No Specific Supplier --</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.company || s.phone})</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Restock Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Invoice #9983 from Metro"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={PlusCircle}>
            Confirm Restock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
