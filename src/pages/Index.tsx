import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const Index: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/dashboard");
      } else if (user.role === "cashier") {
        navigate("/pos");
      }
    }
  }, [isAuthenticated, user, navigate, isLoading]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50/30 p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        <div className="bg-orange-500 w-28 h-28 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative">
          <span className="text-white text-6xl font-black italic">O</span>
          <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-full border-4 border-white">
            <ShieldCheck size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900">
            Orange POS <span className="text-orange-500">Pro</span>
          </h1>
          <p className="text-slate-600 font-medium">
            المنصة الذكية لإدارة المبيعات والمخزون
          </p>
        </div>

        {!isAuthenticated ? (
          <Button
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-8 text-xl rounded-2xl shadow-xl transition-all"
            onClick={() => navigate("/login")}
          >
            <ShoppingCart className="ml-2" size={24} />
            تسجيل الدخول للنظام
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-5 py-8">
            <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
            <p className="text-slate-900 font-bold text-xl">
              جاري تحضير واجهة العمل...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Index;
