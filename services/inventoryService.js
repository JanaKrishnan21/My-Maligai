import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Supplier from '../models/Supplier.js';

export const restockProduct = async ({
  productId,
  quantity,
  purchasePrice,
  sellingPrice,
  supplierId,
  notes = '',
  userId,
}) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const addQty = Number(quantity);
  if (addQty <= 0) throw new Error('Restock quantity must be greater than zero');

  const previousStock = product.stock;
  const newStock = Number((previousStock + addQty).toFixed(2));

  product.stock = newStock;
  if (purchasePrice !== undefined && purchasePrice > 0) {
    product.purchasePrice = Number(purchasePrice);
  }
  if (sellingPrice !== undefined && sellingPrice > 0) {
    product.sellingPrice = Number(sellingPrice);
  }
  if (supplierId) {
    product.supplier = supplierId;
  }
  await product.save();

  // If supplier is linked, update supplier's purchase balance/record
  let supplierName = '';
  if (supplierId) {
    const supplier = await Supplier.findById(supplierId);
    if (supplier) {
      supplierName = supplier.name;
    }
  }

  const movement = await StockMovement.create({
    product: product._id,
    type: 'restock',
    quantity: addQty,
    previousStock,
    newStock,
    purchasePrice: purchasePrice || product.purchasePrice,
    supplier: supplierId || null,
    reference: supplierName ? `Supplier: ${supplierName}` : 'Manual Restock',
    notes: notes || `Restocked +${addQty} ${product.unit}`,
    createdBy: userId,
  });

  return { product, movement };
};

export const adjustStock = async ({
  productId,
  adjustmentQuantity, // positive or negative
  reason = 'Stock Adjustment',
  notes = '',
  userId,
}) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const adjQty = Number(adjustmentQuantity);
  if (adjQty === 0) throw new Error('Adjustment quantity cannot be 0');

  const previousStock = product.stock;
  const newStock = Math.max(0, Number((previousStock + adjQty).toFixed(2)));

  product.stock = newStock;
  await product.save();

  const movement = await StockMovement.create({
    product: product._id,
    type: 'adjustment',
    quantity: adjQty,
    previousStock,
    newStock,
    purchasePrice: product.purchasePrice,
    reference: reason,
    notes,
    createdBy: userId,
  });

  return { product, movement };
};

export const getInventorySummary = async () => {
  const allProducts = await Product.find({ active: true }).populate('supplier', 'name phone');

  const inStock = [];
  const lowStock = [];
  const outOfStock = [];

  let totalInventoryValuePurchase = 0;
  let totalInventoryValueSelling = 0;

  for (const p of allProducts) {
    const purchaseVal = (p.stock || 0) * (p.purchasePrice || 0);
    const sellingVal = (p.stock || 0) * (p.sellingPrice || 0);
    totalInventoryValuePurchase += purchaseVal;
    totalInventoryValueSelling += sellingVal;

    if (p.stock <= 0) {
      outOfStock.push(p);
    } else if (p.stock <= p.minimumStock) {
      lowStock.push(p);
    } else {
      inStock.push(p);
    }
  }

  return {
    totalProducts: allProducts.length,
    inStockCount: inStock.length,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    totalInventoryValuePurchase: Number(totalInventoryValuePurchase.toFixed(2)),
    totalInventoryValueSelling: Number(totalInventoryValueSelling.toFixed(2)),
    potentialProfit: Number((totalInventoryValueSelling - totalInventoryValuePurchase).toFixed(2)),
  };
};
