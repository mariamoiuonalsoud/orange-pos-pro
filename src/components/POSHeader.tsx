import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/orange-group-logo.png";
import {
  LogOut,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  UserCog,
  TrendingUp,
  FileText, // أيقونة عروض الأسعار
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  {
    path: "/pos",
    label: "نقطة البيع",
    icon: ShoppingCart,
    roles: ["admin", "cashier"],
  },
  {
    path: "/quotations", // المسار الجديد
    label: "عروض الأسعار",
    icon: FileText,
    roles: ["admin", "cashier"], // الكاشير يحتاج الوصول إليها لتحويلها لمبيعات
  },
  {
    path: "/inventory",
    label: "المخزون",
    icon: Package,
    roles: ["admin"],
  },
  {
    path: "/customers",
    label: "العملاء",
    icon: Users,
    roles: ["admin", "cashier"],
  },
  {
    path: "/dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    path: "/reports",
    label: "التقارير",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    path: "/analytics",
    label: "التحليلات",
    icon: TrendingUp,
    roles: ["admin"],
  },
  {
    path: "/users",
    label: "الموظفين",
    icon: UserCog,
    roles: ["admin"],
  },
];

const POSHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/pos")}
        >
          <img
            src={logo}
            alt="Orange Group"
            className="w-10 h-10 object-contain"
          />
          <span className="font-bold text-foreground text-lg hidden sm:block">
            أورانج جروب
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[60%]">
          {navItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center whitespace-nowrap gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </motion.button>
              );
            })}
        </nav>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {user?.role === "admin" ? "مدير النظام" : "كاشير"}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default POSHeader;
