import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner, TableSkeleton } from '../components/common/LoadingSpinner';
import { RestockModal } from '../components/inventory/RestockModal';
import { useShop } from '../context/ShopContext';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  PlusCircle,
  TrendingUp,
  History,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  IndianRupee,
} from 'lucide-react';
import api from '../services/api';

export const Inventory = () => {
  const { addToast } = useShop();

  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'movements'
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [restockingProduct, setRestockingProduct] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, movRes, supRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/movements?limit=50'),
        api.get('/suppliers'),
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data);
      if (movRes.data?.success) setMovements(movRes.data.movements || []);
      if (supRes.data?.success) setSuppliers(supRes.data.suppliers || []);
    } catch {
      addToast('Failed to load inventory details', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSpinner text="Loading inventory metrics..." size="lg" className="min-h-[50vh]" />;
  }

  const lowStockList = summary?.lowStockProducts || [];
  const outOfStockList = summary?.outOfStockProducts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory & Stock Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time inventory valuations, stock movement ledger, and low-stock alerts
          </p>
        </div>

        <Button
          variant="secondary"
          icon={RefreshCw}
          size="sm"
          onClick={fetchData}
        >
          Refresh Stock
        </Button>
      </div>

      {/* Inventory Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Inventory Cost Value (Purchase)
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{summary?.totalInventoryValuePurchase?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Total investment in stock
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Inventory Retail Value (Selling)
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{summary?.totalInventoryValueSelling?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            Expected revenue at current stock
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-teal-50/40 border-teal-200">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
            Potential Unrealized Profit
          </span>
          <p className="text-2xl font-black text-teal-700 mt-1 font-mono">
            ₹{summary?.potentialProfit?.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-teal-600 mt-0.5 block">
            Estimated profit upon full stock sale
          </span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low & Out of Stock Alerts ({lowStockList.length + outOfStockList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movements Ledger</span>
        </button>
      </div>

      {/* Alerts View */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Out of stock list */}
          <Card>
            <CardHeader className="bg-rose-50/50 py-3">
              <div className="flex items-center gap-2">
                <PackageX className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-rose-900 uppercase">
                  Out of Stock ({outOfStockList.length})
                </h3>
              </div>
            </CardHeader>

            {outOfStockList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {outOfStockList.map((p) => (
                  <div key={p._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {p.category} • Cost: ₹{p.purchasePrice} • Selling: ₹{p.sellingPrice}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="danger" dot>0 {p.unit}</Badge>
                      <Button
                        size="xs"
                        variant="primary"
                        icon={PlusCircle}
                        onClick={() => setRestockingProduct(p)}
                      >
                        Restock Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                🎉 No products currently out of stock!
              </div>
            )}
          </Card>

          {/* Low stock list */}
          <Card>
            <CardHeader className="bg-amber-50/50 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase">
                  Low Stock Below Minimum Threshold ({lowStockList.length})
                </h3>
              </div>
            </CardHeader>

            {lowStockList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {lowStockList.map((p) => (
                  <div key={p._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {p.category} • Min Level: {p.minimumStock} {p.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="warning" dot>{p.stock} {p.unit} left</Badge>
                      <Button
                        size="xs"
                        variant="primary"
                        icon={PlusCircle}
                        onClick={() => setRestockingProduct(p)}
                      >
                        Add Stock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ✅ All products maintain adequate stock levels.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Movements Ledger View */}
      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Stock Movement Audit Trail</h3>
              <p className="text-xs text-slate-500">Every sale decrement, restock addition, and adjustment</p>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">Stock (Before → After)</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900">
                        {m.product?.name || 'Deleted Product'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                            m.type === 'sale'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : m.type === 'restock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>

                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity} {m.product?.unit || ''}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {m.previousStock} → <strong className="text-slate-900">{m.newStock}</strong>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {m.reference || m.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Restock Modal */}
      {restockingProduct && (
        <RestockModal
          isOpen={!!restockingProduct}
          onClose={() => setRestockingProduct(null)}
          product={restockingProduct}
          suppliers={suppliers}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
