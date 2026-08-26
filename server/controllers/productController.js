import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      stockStatus, // 'in_stock', 'low_stock', 'out_of_stock'
      sortBy = 'name',
      order = 'asc',
      limit = 100,
      page = 1,
    } = req.query;

    const query = { active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (stockStatus === 'out_of_stock') {
      query.stock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      query.$expr = {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$minimumStock'] },
        ],
      };
    } else if (stockStatus === 'in_stock') {
      query.$expr = { $gt: ['$stock', '$minimumStock'] };
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('supplier', 'name phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    // Get unique categories for fast filter tabs
    const categories = await Product.distinct('category', { active: true });

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      categories,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode: barcode.trim(), active: true }).populate('supplier', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found with this barcode' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name phone');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      brand,
      purchasePrice,
      sellingPrice,
      stock = 0,
      minimumStock = 5,
      unit = 'piece',
      supplier,
      expiryDate,
      image,
    } = req.body;

    if (!name || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name, purchase price, and selling price are required' });
    }

    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'Another product already has this barcode' });
      }
    }

    const initialStock = Number(stock || 0);

    const product = await Product.create({
      name: name.trim(),
      sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode ? barcode.trim() : '',
      category: category || 'General',
      brand: brand || '',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      stock: initialStock,
      minimumStock: Number(minimumStock || 5),
      unit: unit || 'piece',
      supplier: supplier || null,
      expiryDate: expiryDate || null,
      image: image || '',
    });

    if (initialStock > 0) {
      await StockMovement.create({
        product: product._id,
        type: 'initial',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        purchasePrice: Number(purchasePrice),
        reference: 'Initial Stock',
        notes: 'Product creation',
        createdBy: req.user?._id || null,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      sku,
      barcode,
      category,
      brand,
      purchasePrice,
      sellingPrice,
      minimumStock,
      unit,
      supplier,
      expiryDate,
      image,
      active,
    } = req.body;

    if (barcode && barcode.trim() !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
      if (existingBarcode && existingBarcode._id.toString() !== product._id.toString()) {
        return res.status(400).json({ success: false, message: 'Barcode is already in use by another product' });
      }
      product.barcode = barcode.trim();
    }

    if (name) product.name = name.trim();
    if (sku) product.sku = sku.trim();
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
    if (unit) product.unit = unit;
    if (supplier !== undefined) product.supplier = supplier || null;
    if (expiryDate !== undefined) product.expiryDate = expiryDate;
    if (image !== undefined) product.image = image;
    if (active !== undefined) product.active = active;

    await product.save();

    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete product by setting active: false
    product.active = false;
    await product.save();

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
