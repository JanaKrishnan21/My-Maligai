import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import StockMovement from '../models/StockMovement.js';
import Setting from '../models/Setting.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🧹 Clearing existing database collections...');

    await User.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await Bill.deleteMany({});
    await Payment.deleteMany({});
    await StockMovement.deleteMany({});
    await Setting.deleteMany({});

    console.log('👤 Creating default user accounts...');
    const adminUser = await User.create({
      name: 'Ramesh Kumar (Owner)',
      username: 'admin',
      email: 'owner@mymaligai.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
    });

    const cashierUser = await User.create({
      name: 'Suresh Raina (Cashier)',
      username: 'cashier',
      email: 'cashier@mymaligai.com',
      phone: '9876543211',
      password: 'cashier123',
      role: 'cashier',
    });

    console.log('🏪 Creating Shop Settings...');
    await Setting.create({
      shopName: 'My Maligai',
      shopTagline: 'Grocery Shop Management',
      ownerName: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      email: 'store@mymaligai.com',
      address: '14/2 Bazaar Main Street, Opp. Gandhi Park, Chennai - 600028',
      gstNumber: '33AAAAA0000A1Z5',
      currencySymbol: '₹',
      invoicePrefix: 'INV',
      reminderIntervalDays: 2,
      lowStockThresholdDefault: 5,
      enableAutoReminders: true,
      thermalPaperWidth: '80mm',
      footerMessage: 'Thank you for shopping with us! Visit again.',
    });

    console.log('🚚 Creating Suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'Metro Wholesale Distributors',
        phone: '9840112233',
        email: 'sales@metrowholesale.in',
        address: 'Plot 42, Industrial Estate, Ambattur',
        company: 'Metro Cash & Carry',
        balance: 15400,
        notes: 'Bulk grains, pulses, and cooking oils',
      },
      {
        name: 'ITC & FMCG Hub',
        phone: '9840223344',
        email: 'itc_distributor@gmail.com',
        address: '108 Trunk Road, Poonamallee',
        company: 'ITC Limited Distributor',
        balance: 4200,
        notes: 'Atta, biscuits, soaps, noodles',
      },
      {
        name: 'Amul & Dairy Logistics',
        phone: '9840334455',
        email: 'amul_supply@dairyhub.com',
        address: '56 Milk Colony Road, Madhavaram',
        company: 'Gujarat Co-operative Milk Marketing',
        balance: 0,
        notes: 'Milk, butter, cheese, ghee, paneer',
      },
      {
        name: 'Tata Consumer Products Agency',
        phone: '9840445566',
        email: 'tata_agency@retail.com',
        address: '77 Anna Salai, Guindy',
        company: 'Tata Global Beverages',
        balance: 3100,
        notes: 'Tata Salt, Tata Tea, Sampann Dals',
      },
    ]);

    const sMetro = suppliers[0]._id;
    const sITC = suppliers[1]._id;
    const sAmul = suppliers[2]._id;
    const sTata = suppliers[3]._id;

    console.log('📦 Creating Realistic Kirana Products...');
    const rawProducts = [
      // Grains & Flours
      {
        name: 'Aashirvaad Shudh Chakki Atta 5kg',
        sku: 'ATT-AASH-5K',
        barcode: '8901030383724',
        category: 'Atta & Flours',
        brand: 'Aashirvaad',
        purchasePrice: 215,
        sellingPrice: 245,
        stock: 24,
        minimumStock: 6,
        unit: 'packet',
        supplier: sITC,
      },
      {
        name: 'India Gate Basmati Rice Feast Rozzana 1kg',
        sku: 'RICE-IG-1K',
        barcode: '8901234500012',
        category: 'Rice & Grains',
        brand: 'India Gate',
        purchasePrice: 82,
        sellingPrice: 98,
        stock: 35,
        minimumStock: 10,
        unit: 'packet',
        supplier: sMetro,
      },
      {
        name: 'Ponni Boiled Rice (Loose)',
        sku: 'RICE-PONNI-L',
        barcode: '8901234500029',
        category: 'Rice & Grains',
        brand: 'Local Premium',
        purchasePrice: 52,
        sellingPrice: 62,
        stock: 120,
        minimumStock: 25,
        unit: 'kg',
        supplier: sMetro,
      },
      {
        name: 'Fortune Sona Masoori Raw Rice 5kg',
        sku: 'RICE-FORT-5K',
        barcode: '8901234500036',
        category: 'Rice & Grains',
        brand: 'Fortune',
        purchasePrice: 290,
        sellingPrice: 330,
        stock: 15,
        minimumStock: 5,
        unit: 'packet',
        supplier: sMetro,
      },
      {
        name: 'Maida Refined Wheat Flour 1kg',
        sku: 'FLOUR-MAID-1K',
        barcode: '8901234500043',
        category: 'Atta & Flours',
        brand: 'Pillsbury',
        purchasePrice: 42,
        sellingPrice: 50,
        stock: 18,
        minimumStock: 5,
        unit: 'packet',
        supplier: sMetro,
      },

      // Dals & Pulses
      {
        name: 'Tata Sampann Toor Dal 1kg',
        sku: 'DAL-TOOR-1K',
        barcode: '8904043901117',
        category: 'Dals & Pulses',
        brand: 'Tata Sampann',
        purchasePrice: 155,
        sellingPrice: 178,
        stock: 22,
        minimumStock: 6,
        unit: 'packet',
        supplier: sTata,
      },
      {
        name: 'Urad Dal Gota (Loose)',
        sku: 'DAL-URAD-L',
        barcode: '8901234500050',
        category: 'Dals & Pulses',
        brand: 'Premium Gold',
        purchasePrice: 128,
        sellingPrice: 145,
        stock: 45,
        minimumStock: 10,
        unit: 'kg',
        supplier: sMetro,
      },
      {
        name: 'Moong Dal Yellow Split 1kg',
        sku: 'DAL-MOONG-1K',
        barcode: '8901234500067',
        category: 'Dals & Pulses',
        brand: 'Tata Sampann',
        purchasePrice: 120,
        sellingPrice: 140,
        stock: 14,
        minimumStock: 5,
        unit: 'packet',
        supplier: sTata,
      },
      {
        name: 'Chana Dal (Bengal Gram) 1kg',
        sku: 'DAL-CHANA-1K',
        barcode: '8901234500074',
        category: 'Dals & Pulses',
        brand: 'Local Cleaned',
        purchasePrice: 85,
        sellingPrice: 98,
        stock: 3, // Low stock demo!
        minimumStock: 8,
        unit: 'packet',
        supplier: sMetro,
      },

      // Cooking Oils & Ghee
      {
        name: 'Fortune Sunlite Refined Sunflower Oil 1L',
        sku: 'OIL-FORT-SUN-1L',
        barcode: '8906007280014',
        category: 'Edible Oils & Ghee',
        brand: 'Fortune',
        purchasePrice: 118,
        sellingPrice: 135,
        stock: 28,
        minimumStock: 8,
        unit: 'packet',
        supplier: sMetro,
      },
      {
        name: 'Idhayam Sesame Gingelly Oil 1L',
        sku: 'OIL-IDH-SES-1L',
        barcode: '8901234500081',
        category: 'Edible Oils & Ghee',
        brand: 'Idhayam',
        purchasePrice: 340,
        sellingPrice: 380,
        stock: 8,
        minimumStock: 4,
        unit: 'bottle',
        supplier: sMetro,
      },
      {
        name: 'Amul Pure Ghee Pouch 500ml',
        sku: 'GHEE-AMUL-500M',
        barcode: '8901262010057',
        category: 'Edible Oils & Ghee',
        brand: 'Amul',
        purchasePrice: 285,
        sellingPrice: 320,
        stock: 12,
        minimumStock: 4,
        unit: 'packet',
        supplier: sAmul,
      },

      // Dairy & Bread
      {
        name: 'Amul Taaza Homogenised Toned Milk 1L',
        sku: 'MILK-AMUL-TZ-1L',
        barcode: '8901262010019',
        category: 'Dairy & Breakfast',
        brand: 'Amul',
        purchasePrice: 66,
        sellingPrice: 74,
        stock: 20,
        minimumStock: 5,
        unit: 'packet',
        supplier: sAmul,
      },
      {
        name: 'Amul Pasteurised Butter 100g',
        sku: 'BUTT-AMUL-100G',
        barcode: '8901262010026',
        category: 'Dairy & Breakfast',
        brand: 'Amul',
        purchasePrice: 50,
        sellingPrice: 56,
        stock: 18,
        minimumStock: 5,
        unit: 'packet',
        supplier: sAmul,
      },
      {
        name: 'Modern Classic White Bread 400g',
        sku: 'BREAD-MOD-400G',
        barcode: '8901234500098',
        category: 'Dairy & Breakfast',
        brand: 'Modern',
        purchasePrice: 38,
        sellingPrice: 45,
        stock: 0, // Out of stock demo!
        minimumStock: 6,
        unit: 'packet',
        supplier: sMetro,
      },

      // Spices, Masalas & Sugar
      {
        name: 'Tata Salt Vacuum Evaporated Iodized 1kg',
        sku: 'SALT-TATA-1K',
        barcode: '8901030101113',
        category: 'Spices & Salt',
        brand: 'Tata',
        purchasePrice: 23,
        sellingPrice: 28,
        stock: 50,
        minimumStock: 12,
        unit: 'packet',
        supplier: sTata,
      },
      {
        name: 'Pure White Sugar (Loose)',
        sku: 'SUG-WHITE-L',
        barcode: '8901234500104',
        category: 'Spices & Salt',
        brand: 'Supreme',
        purchasePrice: 38,
        sellingPrice: 44,
        stock: 80,
        minimumStock: 20,
        unit: 'kg',
        supplier: sMetro,
      },
      {
        name: 'Achi Sambar Powder 100g',
        sku: 'MAS-ACHI-SAM-100G',
        barcode: '8901234500111',
        category: 'Spices & Salt',
        brand: 'Aachi',
        purchasePrice: 32,
        sellingPrice: 38,
        stock: 25,
        minimumStock: 6,
        unit: 'packet',
        supplier: sMetro,
      },
      {
        name: 'Everest Turmeric Powder Haldi 100g',
        sku: 'SPICE-EVE-HAL-100G',
        barcode: '8901234500128',
        category: 'Spices & Salt',
        brand: 'Everest',
        purchasePrice: 31,
        sellingPrice: 37,
        stock: 2, // Low stock demo!
        minimumStock: 5,
        unit: 'packet',
        supplier: sMetro,
      },

      // Tea, Coffee & Beverages
      {
        name: 'Taj Mahal Tea 250g',
        sku: 'TEA-TAJ-250G',
        barcode: '8901030012345',
        category: 'Beverages',
        brand: 'Brooke Bond',
        purchasePrice: 155,
        sellingPrice: 175,
        stock: 16,
        minimumStock: 4,
        unit: 'box',
        supplier: sTata,
      },
      {
        name: 'Bru Instant Coffee Powder 100g Pouch',
        sku: 'COFF-BRU-100G',
        barcode: '8901030056789',
        category: 'Beverages',
        brand: 'BRU',
        purchasePrice: 172,
        sellingPrice: 195,
        stock: 12,
        minimumStock: 4,
        unit: 'packet',
        supplier: sMetro,
      },

      // Snacks & Biscuits
      {
        name: 'Parle-G Gold Biscuits 250g',
        sku: 'BISC-PARLE-250G',
        barcode: '8901719102030',
        category: 'Snacks & Biscuits',
        brand: 'Parle',
        purchasePrice: 24,
        sellingPrice: 30,
        stock: 40,
        minimumStock: 10,
        unit: 'packet',
        supplier: sITC,
      },
      {
        name: 'Britannia Good Day Cashew 200g',
        sku: 'BISC-GOOD-200G',
        barcode: '8901063012340',
        category: 'Snacks & Biscuits',
        brand: 'Britannia',
        purchasePrice: 42,
        sellingPrice: 50,
        stock: 30,
        minimumStock: 8,
        unit: 'packet',
        supplier: sITC,
      },
      {
        name: 'Maggi 2-Minute Masala Noodles 280g (Pack of 4)',
        sku: 'NOOD-MAGGI-4P',
        barcode: '8901058852345',
        category: 'Snacks & Biscuits',
        brand: 'Nestle',
        purchasePrice: 52,
        sellingPrice: 60,
        stock: 36,
        minimumStock: 8,
        unit: 'packet',
        supplier: sMetro,
      },

      // Cleaning & Personal Care
      {
        name: 'Surf Excel Quick Wash Detergent Powder 1kg',
        sku: 'DET-SURF-1K',
        barcode: '8901030612345',
        category: 'Cleaning & Home Care',
        brand: 'Surf Excel',
        purchasePrice: 145,
        sellingPrice: 165,
        stock: 18,
        minimumStock: 5,
        unit: 'packet',
        supplier: sITC,
      },
      {
        name: 'Dettol Original Soap 125g (Buy 3 Get 1 Free)',
        sku: 'SOAP-DETT-4P',
        barcode: '8901396123456',
        category: 'Personal Care',
        brand: 'Dettol',
        purchasePrice: 160,
        sellingPrice: 185,
        stock: 14,
        minimumStock: 4,
        unit: 'bundle',
        supplier: sMetro,
      },
      {
        name: 'Vim Dishwash Bar 300g (Pack of 3)',
        sku: 'DISH-VIM-3P',
        barcode: '8901030712345',
        category: 'Cleaning & Home Care',
        brand: 'Vim',
        purchasePrice: 48,
        sellingPrice: 58,
        stock: 0, // Out of stock demo!
        minimumStock: 6,
        unit: 'bundle',
        supplier: sITC,
      },
      {
        name: 'Head & Shoulders Anti-Dandruff Shampoo 180ml',
        sku: 'SHAMP-HS-180M',
        barcode: '8901234500135',
        category: 'Personal Care',
        brand: 'Procter & Gamble',
        purchasePrice: 165,
        sellingPrice: 190,
        stock: 9,
        minimumStock: 4,
        unit: 'bottle',
        supplier: sMetro,
      },
    ];

    const products = await Product.create(rawProducts);

    // Create Initial stock movement logs
    for (const p of products) {
      if (p.stock > 0) {
        await StockMovement.create({
          product: p._id,
          type: 'initial',
          quantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          purchasePrice: p.purchasePrice,
          reference: 'Initial Stock',
          notes: 'Shop opening inventory count',
          createdBy: adminUser._id,
        });
      }
    }

    console.log('👥 Creating Realistic Kirana Customers with Khata balances...');
    const rawCustomers = [
      {
        name: 'Ravi Kumar',
        phone: '9876543210',
        email: 'ravi.kumar@gmail.com',
        address: 'Plot 12, 3rd Cross Street, Gandhi Nagar',
        balance: 850,
        totalPurchases: 4250,
        totalPaid: 3400,
        lastPurchaseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastReminderAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Regular customer, pays on 1st of every month',
      },
      {
        name: 'Suresh Krishnan',
        phone: '9840198401',
        email: 'suresh.k@outlook.com',
        address: 'No 4B, Balaji Apartments, Station Road',
        balance: 1250,
        totalPurchases: 6800,
        totalPaid: 5550,
        lastPurchaseAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastReminderAt: null,
        notes: 'Neighbouring house, pays via GPay',
      },
      {
        name: 'Mani Varma',
        phone: '9790887766',
        email: 'mani.varma@yahoo.com',
        address: '55 Nehru Street, Market Area',
        balance: 450,
        totalPurchases: 3200,
        totalPaid: 2750,
        lastPurchaseAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastReminderAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        notes: 'Prompt payer',
      },
      {
        name: 'Priya Sundaram',
        phone: '9444112233',
        email: 'priya.sundar@gmail.com',
        address: '18/2 Anna Nagar West',
        balance: 0,
        totalPurchases: 8900,
        totalPaid: 8900,
        lastPurchaseAt: new Date(),
        lastReminderAt: null,
        notes: 'VIP customer, always pays full via UPI',
      },
      {
        name: 'Anand Balaji',
        phone: '9884556677',
        email: 'anand.b@techcorp.in',
        address: '77 Lake View Avenue',
        balance: 2150,
        totalPurchases: 5400,
        totalPaid: 3250,
        lastPurchaseAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastReminderAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Pending balance overdue > 7 days',
      },
      {
        name: 'Kavitha Murugan',
        phone: '9841234567',
        email: 'kavitha.m@gmail.com',
        address: '9 Temple Car Street',
        balance: 0,
        totalPurchases: 2100,
        totalPaid: 2100,
        lastPurchaseAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastReminderAt: null,
        notes: 'Cash shopper',
      },
    ];

    const customers = await Customer.create(rawCustomers);

    console.log('🧾 Creating Sample Realistic Bills and Transactions...');
    // Create Sample Bill 1: Full Cash Payment
    const b1 = await Bill.create({
      invoiceNumber: 'INV-20260825-0001',
      customer: customers[3]._id, // Priya
      customerSnapshot: { name: customers[3].name, phone: customers[3].phone },
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          sku: products[0].sku,
          unit: products[0].unit,
          quantity: 2,
          purchasePrice: products[0].purchasePrice,
          sellingPrice: products[0].sellingPrice,
          total: 490,
        },
        {
          product: products[9]._id, // Fortune Oil
          name: products[9].name,
          sku: products[9].sku,
          unit: products[9].unit,
          quantity: 1,
          purchasePrice: products[9].purchasePrice,
          sellingPrice: products[9].sellingPrice,
          total: 135,
        },
        {
          product: products[15]._id, // Tata Salt
          name: products[15].name,
          sku: products[15].sku,
          unit: products[15].unit,
          quantity: 2,
          purchasePrice: products[15].purchasePrice,
          sellingPrice: products[15].sellingPrice,
          total: 56,
        },
      ],
      subtotal: 681,
      discount: 11,
      total: 670,
      amountPaid: 670,
      balance: 0,
      previousCustomerBalance: 0,
      newCustomerBalance: 0,
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      createdBy: adminUser._id,
    });

    await Payment.create({
      customer: customers[3]._id,
      bill: b1._id,
      amount: 670,
      paymentMethod: 'upi',
      type: 'bill_payment',
      previousBalance: 0,
      newBalance: 0,
      receivedBy: adminUser._id,
      notes: 'Full payment via UPI for INV-20260825-0001',
    });

    // Create Sample Bill 2: Partial Payment with Credit
    const b2 = await Bill.create({
      invoiceNumber: 'INV-20260825-0002',
      customer: customers[0]._id, // Ravi Kumar
      customerSnapshot: { name: customers[0].name, phone: customers[0].phone },
      items: [
        {
          product: products[1]._id, // Basmati Rice
          name: products[1].name,
          sku: products[1].sku,
          unit: products[1].unit,
          quantity: 2,
          purchasePrice: products[1].purchasePrice,
          sellingPrice: products[1].sellingPrice,
          total: 196,
        },
        {
          product: products[5]._id, // Tata Toor Dal
          name: products[5].name,
          sku: products[5].sku,
          unit: products[5].unit,
          quantity: 2,
          purchasePrice: products[5].purchasePrice,
          sellingPrice: products[5].sellingPrice,
          total: 356,
        },
        {
          product: products[12]._id, // Amul Milk
          name: products[12].name,
          sku: products[12].sku,
          unit: products[12].unit,
          quantity: 2,
          purchasePrice: products[12].purchasePrice,
          sellingPrice: products[12].sellingPrice,
          total: 148,
        },
      ],
      subtotal: 700,
      discount: 20,
      total: 680,
      amountPaid: 300,
      balance: 380,
      previousCustomerBalance: 470,
      newCustomerBalance: 850,
      paymentStatus: 'partially_paid',
      paymentMethod: 'cash',
      createdBy: cashierUser._id,
    });

    await Payment.create({
      customer: customers[0]._id,
      bill: b2._id,
      amount: 300,
      paymentMethod: 'cash',
      type: 'bill_payment',
      previousBalance: 470,
      newBalance: 850,
      receivedBy: cashierUser._id,
      notes: 'Partial payment of ₹300 for Bill #INV-20260825-0002. Remaining ₹380 added to Khata balance.',
    });

    console.log('✅ Database seeded successfully with My Maligai grocery test records!');
    console.log('--------------------------------------------------');
    console.log('🔑 DEMO LOGIN CREDENTIALS:');
    console.log('   👤 Admin (Owner)  : username: "admin"   | password: "admin123"');
    console.log('   👤 Cashier Staff  : username: "cashier" | password: "cashier123"');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
