import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePOS } from "@/contexts/POSContext";
import { CATEGORIES } from "@/data/pos-data";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Barcode as BarcodeIcon,
  ShoppingCart,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import CartPanel from "@/components/CartPanel";
import POSHeader from "@/components/POSHeader";

const POSPage = () => {
  const { products, addToCart, cartCount, cartTotal } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showMobileCart, setShowMobileCart] = useState(false);

  // --- إعدادات الباركود سكنر ---
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const processBarcode = useCallback(
    (code: string) => {
      const scannedCode = code.trim();
      if (!scannedCode) return;

      const scannedProduct = products.find((p) => {
        if (!p.barcode) return false;
        const dbBarcode = String(p.barcode).trim();
        const inputBarcode = String(scannedCode).trim();
        return (
          dbBarcode === inputBarcode ||
          Number(dbBarcode) === Number(inputBarcode)
        );
      });

      if (scannedProduct) {
        if (scannedProduct.stock > 0) {
          addToCart(scannedProduct);
          toast.success(`تمت إضافة ${scannedProduct.name}`, {
            position: "bottom-right",
            duration: 1500,
          });
        } else {
          toast.error("هذا المنتج نفذ من المخزن!", {
            style: { border: "2px solid #ef4444" },
          });
        }
      } else {
        toast.error("منتج غير معروف", {
          description: `الباركود ${scannedCode} غير مسجل بالنظام`,
          style: { border: "2px solid #ef4444" },
        });
      }

      setBarcodeInput("");
    },
    [products, addToCart],
  );

  useEffect(() => {
    const code = barcodeInput.trim();

    if (code.length < 12) return;

    const timer = setTimeout(() => {
      processBarcode(code);
    }, 150);

    return () => clearTimeout(timer);
  }, [barcodeInput, processBarcode]);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcode(barcodeInput);
    }
  };

  useEffect(() => {
    const keepFocus = () => {
      if (window.innerWidth < 1024) return;
      if (
        document.activeElement?.tagName !== "INPUT" ||
        document.activeElement === barcodeInputRef.current
      ) {
        barcodeInputRef.current?.focus();
      }
    };

    keepFocus();
    const interval = setInterval(keepFocus, 5000);
    return () => clearInterval(interval);
  }, []);

  // التعديل هنا: البحث اليدوي أصبح برقم الباركود بدلاً من الاسم
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "all" || p.category === selectedCategory;

    // تأمين الكود لو المنتج ملوش باركود، ومقارنة الباركود بنص البحث
    const safeBarcode = p.barcode ? String(p.barcode) : "";
    const matchSearch = safeBarcode.includes(searchQuery.trim());

    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <POSHeader />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 overflow-hidden pb-24 lg:pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
              {/* التعديل هنا: تغيير النص الإرشادي ليتناسب مع البحث بالباركود */}
              <Input
                placeholder="ابحث يدوياً برقم الباركود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 text-base rounded-xl border-primary/20 focus:border-primary"
              />
            </div>

            <form onSubmit={handleBarcodeScan} className="relative">
              <BarcodeIcon className="absolute right-3 top-3 h-5 w-5 text-primary animate-pulse" />
              <Input
                ref={barcodeInputRef}
                placeholder="مرر جهاز الباركود الآن..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="pr-10 h-12 text-base rounded-xl border-2 border-primary ring-offset-background focus-visible:ring-2 focus-visible:ring-primary bg-primary/5 font-mono"
              />
              <div className="absolute left-3 top-3.5 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-bold hidden sm:block">
                Scanner Ready
              </div>
            </form>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-foreground border border-border hover:border-primary/50"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(product)}
                    className="bg-card rounded-2xl border border-border p-4 text-center hover:border-primary hover:shadow-xl transition-all group relative overflow-hidden flex flex-col items-center select-none touch-manipulation"
                  >
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                      {product.image}
                    </div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-2 min-h-[40px] flex items-center justify-center">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <p className="text-primary font-black text-xl">
                        {product.price.toFixed(2)}{" "}
                        <span className="text-xs">ج.م</span>
                      </p>
                      <div
                        className={`text-[10px] mt-2 px-2 py-1 rounded-full inline-block font-bold ${
                          product.stock < 10
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        المخزون: {product.stock}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="bg-primary text-white p-2 rounded-full shadow-lg translate-y-4 lg:group-hover:translate-y-0 transition-transform">
                        <Plus className="w-6 h-6" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Search className="w-20 h-20 mb-4" />
                <p className="text-xl font-bold">لا توجد منتجات مطابقة</p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-96 border-r border-border bg-card">
          <CartPanel />
        </div>

        {cartCount > 0 && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
            <button
              onClick={() => setShowMobileCart(true)}
              className="w-full bg-primary text-primary-foreground p-4 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.4)] flex items-center justify-between font-bold text-lg animate-in slide-in-from-bottom-5"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" /> {cartCount}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>عرض السلة</span>
                <span>{cartTotal.toFixed(2)} ج.م</span>
              </div>
            </button>
          </div>
        )}

        <AnimatePresence>
          {showMobileCart && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden"
            >
              <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-6 h-6 text-primary" /> السلة
                </h2>
                <button
                  onClick={() => setShowMobileCart(false)}
                  className="p-2 bg-muted rounded-full hover:bg-destructive hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <CartPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default POSPage;
