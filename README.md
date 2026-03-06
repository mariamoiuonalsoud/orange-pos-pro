# 🍊 Orange POS Pro
**Enterprise-Grade Point of Sale & Inventory Management System**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Orange POS Pro is a modern, high-performance Point of Sale (POS) solution tailored for retail businesses. Developed using **React 18** and **TypeScript**, it provides a robust architecture for handling high-frequency transactions, inventory precision, and hardware integration.

---

## ✨ Core Features

### 🛒 High-Speed Checkout (POS)
- **Barcode Scanner Integration**: Plug-and-play support for hardware scanners with intelligent auto-focus and instant cart addition.
- **Smart Cart Management**: Real-time 15% VAT calculation, stock validation, and interactive item adjustments.
- **Advanced Payment Logic**: Supports Multi-method payments (Cash, Card, Wallet) with automated "Change Due" calculation to eliminate cashier errors.

### 📦 Intelligent Inventory Control
- **Live Stock Sync**: Every sale automatically deducts from the inventory in real-time.
- **Automated Barcode Generation**: System-generated barcodes for all products with professional label printing support.
- **Low-Stock Detection**: Visual dashboard alerts and "Pie Chart" distribution for products nearing depletion.

### 📊 Professional Analytics & Reporting
- **Business Dashboard**: Real-time visual monitoring of stock value, inventory health, and item distribution.
- **Sales Intelligence**: Detailed transaction logs, tracking revenue, customer data, and payment trends.
- **Financial Accounting**: Clear separation between Total Sales (Revenue) and Net Income for better profit tracking.

### 🖨️ Industry-Standard Hardware Support
- **Receipt Printing**: Optimized for **80mm Thermal Printers** with custom CSS to ensure perfect scaling without white-space issues.
- **Branded Output**: Professional receipt templates including store branding, cashier name, and transaction barcodes.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (Vite) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS & Shadcn UI |
| **State Management** | React Context API |
| **Visualizations** | Recharts (Charts/Graphs) |
| **Animations** | Framer Motion |
| **Notifications** | Sonner (High-visibility Toast alerts) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- Hardware: (Optional) 80mm Thermal Receipt Printer & USB Barcode Scanner.



## 📂 Architecture
src/
├── components/      # Reusable UI Modules (Receipts, Charts, Cart)
├── contexts/        # Core Engine (Auth Logic & Global POS State)
├── data/            # Business Models & Product Definitions
├── pages/           # Application Views (POS, Dashboard, Reports, Users)
└── lib/             # Utility Functions & Configuration


## 👤 Author
**Mariam** Full-Stack Developer specializing in Retail Architecture and Financial Solutions.
