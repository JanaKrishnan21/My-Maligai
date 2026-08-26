import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const { search, sortBy = 'name', order = 'asc', limit = 50, page = 1 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Supplier.countDocuments(query);

    const suppliers = await Supplier.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    // Attach product count to each supplier
    const suppliersWithCount = await Promise.all(
      suppliers.map(async (s) => {
        const productCount = await Product.countDocuments({ supplier: s._id, active: true });
        return {
          ...s.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      count: suppliersWithCount.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      suppliers: suppliersWithCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const products = await Product.find({ supplier: supplier._id, active: true });
    const stockPurchases = await StockMovement.find({ supplier: supplier._id })
      .populate('product', 'name unit')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      supplier,
      products,
      stockPurchases,
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, email, address, company, balance = 0, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Supplier name and phone are required' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      company: company ? company.trim() : '',
      balance: Number(balance || 0),
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const { name, phone, email, address, company, balance, notes } = req.body;

    if (name) supplier.name = name.trim();
    if (phone) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (company !== undefined) supplier.company = company.trim();
    if (balance !== undefined) supplier.balance = Number(balance);
    if (notes !== undefined) supplier.notes = notes;

    await supplier.save();

    res.json({ success: true, message: 'Supplier updated successfully', supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.deleteOne();
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};
