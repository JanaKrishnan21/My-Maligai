import StockMovement from '../models/StockMovement.js';
import { restockProduct, adjustStock, getInventorySummary } from '../services/inventoryService.js';

export const getInventorySummaryHandler = async (req, res, next) => {
  try {
    const summary = await getInventorySummary();
    res.json({ success: true, ...summary });
  } catch (error) {
    next(error);
  }
};

export const restockHandler = async (req, res, next) => {
  try {
    const { productId, quantity, purchasePrice, sellingPrice, supplierId, notes } = req.body;
    const result = await restockProduct({
      productId,
      quantity,
      purchasePrice,
      sellingPrice,
      supplierId,
      notes,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: `Successfully restocked ${result.product.name} (+${quantity} ${result.product.unit})`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStockHandler = async (req, res, next) => {
  try {
    const { productId, adjustmentQuantity, reason, notes } = req.body;
    const result = await adjustStock({
      productId,
      adjustmentQuantity,
      reason,
      notes,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: `Stock adjusted for ${result.product.name}`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovements = async (req, res, next) => {
  try {
    const { productId, type, limit = 50, page = 1 } = req.query;

    const query = {};
    if (productId) query.product = productId;
    if (type && type !== 'all') query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockMovement.countDocuments(query);

    const movements = await StockMovement.find(query)
      .populate('product', 'name sku unit category')
      .populate('supplier', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: movements.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      movements,
    });
  } catch (error) {
    next(error);
  }
};
