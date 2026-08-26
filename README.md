# My Maligai — Grocery Shop Management System

**My Maligai** is a practical, reliable **Grocery Shop Management System** built with the **MERN Stack** (MongoDB, Express.js, React + Vite, Node.js, and Tailwind CSS).

Designed specifically for local grocery shop owners, **My Maligai** simplifies daily counter billing, customer ledger ("Khata") credit tracking, WhatsApp bill sharing, stock replenishment, and business reporting.

---

## 🌟 Key Features

### 1. High-Speed POS Billing
- **Fast Product Search**: Search instantly by product name, brand, SKU, or live barcode scanner.
- **Category Filter Chips**: Quick taps for Atta & Flours, Rice & Grains, Dals & Pulses, Cooking Oils, Dairy, Spices, Snacks, Cleaning, and Personal Care.
- **Multiple Payment Modes**: Full Cash, UPI (GPay / PhonePe / Paytm), Card, Split Payment, and **Khata Credit / Pay Later**.
- **Change & Credit Auto-Calculator**: Automatically calculates change to return to the customer or unpaid balance to add to customer Khata.
- **Thermal Printable Invoices**: Native high-contrast thermal receipt format (58mm & 80mm standard POS) with printable `@media print` layout.
- **1-Click WhatsApp Bills**: Generates formatted, ready-to-share WhatsApp bills with emoji line items, breakdown, and store helpline.

### 2. Customer Khata & Credit Ledger
- **Instant Phone Lookup**: Type 10-digit mobile number to view customer outstanding balance, last purchase date, and lifetime total.
- **Complete Transaction Ledger**: Chronological timeline combining all purchases, bill balances, and repayment records.
- **Fast Credit Settlement**: Collect old credit payments via Cash or UPI and issue automated WhatsApp payment receipts.
- **Payment Reminders**: Manual 1-click WhatsApp reminders and automated daily background scans (`node-cron`).

### 3. Real-Time Inventory & Stock Audit
- **Automatic Stock Decrement**: Server-side stock deduction on every bill generation with protection against selling beyond stock.
- **Stock Status Badges**: 🟢 In Stock, 🟠 Low Stock (< minimum threshold), and 🔴 Out of Stock.
- **Restock Engine**: Batch restocking with supplier attribution and purchase cost tracking.
- **Stock Movement Audit Trail**: Immutable ledger tracking sales deductions, restocks, returns, and manual adjustments.

### 4. Supplier Management
- Manage wholesale distributors (Metro Cash & Carry, ITC Wholesale, Amul Dairy Hub, Tata Consumer).
- Track company contact numbers, supplied products, and outstanding supplier balances.

### 5. Sales & Profit Analytics (Recharts)
- **Sales vs Estimated Gross Profit** (`Selling Price - Purchase Cost`).
- **Payment Mode Distribution**: Cash vs UPI vs Card vs Credit.
- **Top Revenue Generating Products** & Best-Selling Kirana Items.
- Filter by Today, Last 7 Days, Last 30 Days, or custom date ranges.

### 6. Role-Based Access Control (RBAC)
- **Admin (Owner)**: Full store control, sales reports, profit metrics, product pricing, staff creation, store settings, bill cancellation.
- **Cashier**: High-speed billing, customer lookup, receiving payments, viewing customer balances.

---

## 🏗️ Architecture & Project Structure

```
Shop_Management/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── billing/         # POS Cart, Thermal Receipt, Payment Modal
│   │   │   ├── common/          # Button, Modal, Card, Badge, Toast, Spinner
│   │   │   ├── customer/        # CustomerModal, CreditPaymentModal
│   │   │   ├── inventory/       # RestockModal
│   │   │   ├── layout/          # Header, Sidebar, MobileNavbar, QuickSearch
│   │   │   └── product/         # ProductModal
│   │   ├── context/             # AuthContext, ShopContext
│   │   ├── pages/               # Dashboard, Billing, Customers, Products, Inventory, Reports, etc.
│   │   ├── services/            # Axios API Client with JWT interceptor
│   │   ├── routes/              # ProtectedRoute wrapper
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind CSS & Print Layout Styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node.js + Express + MongoDB Backend
│   ├── config/                  # MongoDB Mongoose Connection
│   ├── controllers/             # Auth, Billing, Customer, Product, Inventory, Reports, Settings
│   ├── middleware/              # JWT protect, Role authorize, Central error handler
│   ├── models/                  # User, Customer, Product, Bill, Payment, Supplier, StockMovement, Setting
│   ├── routes/                  # REST API Endpoints
│   ├── scripts/                 # seed.js (Indian Kirana realistic dataset)
│   ├── services/                # Billing engine, WhatsApp dispatch, Cron Reminders, Reports
│   ├── app.js                   # Express App Configuration
│   ├── server.js                # Server entry & Cron scheduler initialization
│   └── package.json
│
├── .env.example
├── README.md
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/kadaimate`) or MongoDB Atlas URI.

---

### Step 1: Clone and Install Dependencies

In the root project directory:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### Step 2: Configure Environment Variables

Create `.env` in the `server/` directory (or use default development values):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/kadaimate
JWT_SECRET=kadaimate_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d

# Optional: Meta WhatsApp Cloud API (If left empty, direct WhatsApp web/app link fallback is used automatically)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_VERSION=v19.0

DEFAULT_SHOP_NAME=KadaiMate Smart Kirana Store
DEFAULT_SHOP_PHONE=+919876543210
DEFAULT_REMINDER_DAYS=2
```

---

### Step 3: Seed Database with Indian Kirana Dataset

Populate the database with realistic Indian grocery items (Aashirvaad Atta, Tata Salt, Basmati Rice, Amul Butter, Dals, Soaps, etc.), test customers with Khata credit, suppliers, and role accounts:

```bash
cd server
npm run seed
```

---

### Step 4: Run the Application

Start the backend API server:
```bash
cd server
npm run dev
# Server runs on: http://localhost:5000
```

In a separate terminal, start the React Vite frontend:
```bash
cd client
npm run dev
# Frontend runs on: http://localhost:5173
```

---

## 🔑 Demo Login Credentials

KadaiMate includes convenient 1-click demo login buttons on the sign-in screen:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin (Owner)** | `admin` | `admin123` | Full access: POS, Customers, Products, Restock, Khata, Analytics Reports, Store Settings |
| **Cashier Staff** | `cashier` | `cashier123` | Counter access: POS Billing, Customer search, Payment collection, Receipts |

---

## 📱 WhatsApp Integration

KadaiMate features a dual-mode WhatsApp engine:
1. **Zero-Setup Web/App Fallback (Default)**: Automatically creates structured `https://wa.me/{phone}?text=...` links containing invoice numbers, product tables, totals, and Khata balances for instant 1-click sharing from browser or phone.
2. **Meta WhatsApp Cloud API**: Add your `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `server/.env` or inside the in-app **Settings** page for automated server-to-server messaging.

---

## 🧾 Thermal Printer Support

KadaiMate provides native thermal receipt formatting:
- Supports **80mm** (standard retail receipt) and **58mm** (compact mobile printer) thermal paper rolls.
- Press **"Print Receipt"** or `Ctrl+P` on any invoice to generate a clean, thermal-ready ticket without page headers/footers.

---

## 🛡️ License

MIT License. Designed & Developed for Smart Retail Grocery Stores.
