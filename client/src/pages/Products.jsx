import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/EmptyState';
import { ProductModal } from '../components/product/ProductModal';
import { RestockModal } from '../components/inventory/RestockModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BarcodeScannerModal } from '../components/common/BarcodeScannerModal';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  Barcode,
  ArrowUpDown,
  Filter,
  PlusCircle,
  Camera,
} from 'lucide-react';
import api from '../services/api';

export const Products = () => {
  const { addToast } = useShop();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let url = `/products?limit=200&search=${search}`;
      if (selectedCategory !== 'All') url += `&category=${selectedCategory}`;
      if (stockStatus !== 'all') url += `&stockStatus=${stockStatus}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setProducts(res.data.products || []);
        if (res.data.categories) {
          setCategories(['All', ...res.data.categories]);
        }
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load products from the database.');
      addToast('Failed to load products catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockStatus, addToast]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      if (res.data?.success) {
        setSuppliers(res.data.suppliers || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts]);

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/products/${deletingProduct._id}`);
      if (res.data?.success) {
        addToast('Product deactivated successfully', 'success');
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to deactivate product', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Products & Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total active grocery items: {products.length}
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="font-bold shadow-sm"
        >
          Add New Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, brand, barcode, SKU..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Camera}
              onClick={() => setIsScannerOpen(true)}
              className="flex-shrink-0 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
            >
              Scan
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Alerts</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* Products Table */}
      <Card>
        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category / Brand</th>
                  <th className="px-4 py-3">Barcode / SKU</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-center">Stock Level</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minimumStock;
                  const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {p.name}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold block text-slate-800">{p.category}</span>
                        {p.brand && <span className="text-[10px] text-slate-400">{p.brand}</span>}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-500">
                        {p.barcode ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            {p.barcode}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{p.sku}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ₹{p.purchasePrice}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        ₹{p.sellingPrice}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {margin}% margin
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isOutOfStock ? (
                          <Badge variant="danger" size="sm" dot>Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" size="sm" dot>{p.stock} {p.unit} (Low)</Badge>
                        ) : (
                          <Badge variant="success" size="sm">{p.stock} {p.unit}</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setRestockingProduct(p)}
                            className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Restock Item"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Restock
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Deactivate Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <ErrorState
              title="Unable to load products"
              description={fetchError}
              onRetry={fetchProducts}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
            <p className="text-sm font-semibold">No products found</p>
          </div>
        )}
      </Card>

      {/* Modals */}
      {(isProductModalOpen || editingProduct) && (
        <ProductModal
          isOpen={isProductModalOpen || !!editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          suppliers={suppliers}
          onSuccess={fetchProducts}
        />
      )}

      {restockingProduct && (
        <RestockModal
          isOpen={!!restockingProduct}
          onClose={() => setRestockingProduct(null)}
          product={restockingProduct}
          suppliers={suppliers}
          onSuccess={fetchProducts}
        />
      )}

      {deletingProduct && (
        <ConfirmDialog
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteProduct}
          title={`Deactivate ${deletingProduct.name}?`}
          message="This product will be archived from the active POS billing catalog."
          loading={deleteLoading}
        />
      )}

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            setSearch(code);
            addToast(`Searching for barcode: ${code}`, 'success');
          }}
          title="Scan to Find Product"
          subtitle="Point camera at product barcode to locate in catalog"
        />
      )}
    </div>
  );
};
