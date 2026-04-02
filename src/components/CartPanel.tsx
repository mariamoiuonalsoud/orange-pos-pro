import React, { useState, useRef, useEffect } from "react";
import { usePOS, SaleWithCustomer } from "@/contexts/POSContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Printer,
  FileText,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "./Receipt";

const CartPanel: React.FC = () => {
  const {
    cart,
    updateQuantity,
    clearCart,
    cartTotal,
    completeSale,
    saveQuotation,
    findCustomerByPhone,
    tempCustomer,
    cartDiscount,
    setTempCustomer,
    setCartDiscount,
  } = usePOS();

  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [currentSale, setCurrentSale] = useState<SaleWithCustomer | null>(null);

  const [phone, setPhone] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [showCashInput, setShowCashInput] = useState<boolean>(false);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // --- التأثير التلقائي: ملء بيانات العميل والخصم عند التحويل من عرض سعر ---
  useEffect(() => {
    if (tempCustomer.phone || tempCustomer.name) {
      setPhone(tempCustomer.phone);
      setCustomerName(tempCustomer.name);
      setDiscount(cartDiscount.toString());
      setShowCheckout(true);
      toast.info("تم استيراد بيانات العميل والخصم من عرض السعر");
    }
  }, [tempCustomer, cartDiscount]);

  // الحسابات المالية (تم حذف القيمة المضافة نهائياً)
  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const grandTotal = Math.max(0, cartTotal - discountVal); // الإجمالي هو الصافي بعد الخصم فقط
  const changeDue = (parseFloat(cashReceived) || 0) - grandTotal;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: currentSale?.receiptNumber || "receipt",
  });

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (parseFloat(val) < 0) {
      setDiscount("0");
    } else {
      setDiscount(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length === 11) {
      const c = findCustomerByPhone(val);
      if (c) setCustomerName(c.name);
    }
  };

  const processSale = async (method: "cash" | "card" | "mobile") => {
    if (!phone || !customerName || isProcessing) {
      toast.error("برجاء إدخال بيانات العميل أولاً");
      return;
    }

    if (
      method === "cash" &&
      (!showCashInput || (parseFloat(cashReceived) || 0) < grandTotal)
    ) {
      setShowCashInput(true);
      return;
    }

    setIsProcessing(true);
    try {
      const sale = await completeSale(
        method,
        user?.id || "admin",
        phone,
        customerName,
        parseFloat(cashReceived) || grandTotal,
        changeDue > 0 ? changeDue : 0,
        discountVal,
      );

      if (sale) {
        setCurrentSale(sale);
        setShowSuccess(true);
        resetForm();
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إتمام العملية");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!phone || !customerName) {
      toast.error("بيانات العميل مطلوبة لحفظ عرض السعر");
      return;
    }
    setIsProcessing(true);
    const success = await saveQuotation(
      user?.id || "admin",
      phone,
      customerName,
      discountVal,
    );
    if (success) resetForm();
    setIsProcessing(false);
  };

  const resetForm = () => {
    setShowCheckout(false);
    setShowCashInput(false);
    setPhone("");
    setCustomerName("");
    setCashReceived("");
    setDiscount("0");
    setTempCustomer({ name: "", phone: "" });
    setCartDiscount(0);
    clearCart(); // تنظيف السلة بعد النجاح
  };

  return (
    <div
      className="w-full lg:w-96 bg-card border-r border-border flex flex-col h-full shadow-2xl relative text-right"
      dir="rtl"
    >
      {/* الهيدر */}
      <div className="p-4 border-b flex justify-between items-center bg-muted/20">
        <h2 className="font-bold flex items-center gap-2 text-foreground">
          <ShoppingBag className="w-5 h-5 text-primary" /> السلة
        </h2>
        {cart.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              resetForm();
            }}
            className="text-xs text-destructive hover:underline"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* قائمة المنتجات */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border"
          >
            <span className="text-2xl">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{item.name}</p>
              <p className="text-primary font-bold text-xs">
                {(item.price * item.quantity).toFixed(2)} ج.م
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded-md bg-background hover:bg-muted transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-sm w-6 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-md bg-primary text-white hover:bg-orange-600 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* قسم الحسابات والإتمام */}
      {cart.length > 0 && (
        <div className="p-4 bg-muted/10 border-t space-y-3">
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Percent size={16} /> الخصم (ج.م):
            </div>
            <Input
              type="number"
              min="0"
              value={discount}
              onChange={handleDiscountChange}
              className="w-24 h-8 text-center font-bold bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2 text-sm font-bold">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>المجموع</span>
              <span>{cartTotal.toFixed(2)} ج.م</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-destructive">
                <span>خصم إضافي</span>
                <span>-{discountVal.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black border-t pt-2 text-primary">
              <span>الإجمالي النهائي</span>
              <span>{grandTotal.toFixed(2)} ج.م</span>
            </div>
          </div>

          {!showCheckout ? (
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-primary hover:bg-orange-600 transition-all"
            >
              إتمام العملية
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-background rounded-2xl border-2 border-primary/20 shadow-xl">
              {!showCashInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="رقم الموبايل"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={11}
                    className="h-11"
                  />
                  <Input
                    placeholder="اسم العميل"
                    value={customerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomerName(e.target.value)
                    }
                    className="h-11"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      onClick={handleSaveQuotation}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-primary text-primary h-11 gap-2 font-bold"
                    >
                      <FileText size={16} /> عرض سعر
                    </Button>
                    <Button
                      onClick={() => setShowCheckout(false)}
                      variant="secondary"
                      className="h-11"
                    >
                      رجوع
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      onClick={() => processSale("cash")}
                      className="bg-green-600 hover:bg-green-700 h-16 flex-col gap-1 text-[10px] font-bold text-white"
                    >
                      <Banknote size={20} /> نقداً
                    </Button>
                    <Button
                      onClick={() => processSale("card")}
                      className="bg-blue-600 hover:bg-blue-700 h-16 flex-col gap-1 text-[10px] font-bold text-white"
                    >
                      <CreditCard size={20} /> بطاقة
                    </Button>
                    <Button
                      onClick={() => processSale("mobile")}
                      className="bg-slate-800 hover:bg-slate-900 h-16 flex-col gap-1 text-[10px] font-bold text-white"
                    >
                      <Smartphone size={20} /> محفظة
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <p className="text-center font-bold text-primary">
                    المطلوب: {grandTotal.toFixed(2)} ج.م
                  </p>
                  <Input
                    type="number"
                    placeholder="المبلغ المستلم..."
                    value={cashReceived}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCashReceived(e.target.value)
                    }
                    className="h-14 text-center text-2xl font-bold border-2 border-green-500"
                    autoFocus
                  />
                  {changeDue >= 0 && (
                    <div className="p-3 bg-green-600 text-white text-center rounded-xl font-black text-lg">
                      الباقي: {changeDue.toFixed(2)} ج.م
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setShowCashInput(false)}
                    >
                      رجوع
                    </Button>
                    <Button
                      disabled={isProcessing}
                      className="flex-[2] bg-green-600 hover:bg-green-700 h-12 font-bold text-white"
                      onClick={() => processSale("cash")}
                    >
                      تأكيد الدفع
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* مودال النجاح والطباعة */}
      <AnimatePresence>
        {showSuccess && currentSale && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-card p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl relative"
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-1 text-foreground">
                تمت العملية بنجاح!
              </h3>
              <p className="text-muted-foreground text-sm mb-6 font-mono">
                {currentSale.receiptNumber}
              </p>
              <Button
                onClick={handlePrint}
                className="w-full h-14 bg-primary text-white font-black text-xl gap-3 shadow-xl hover:bg-orange-600"
              >
                <Printer size={24} /> طباعة الفاتورة
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSuccess(false)}
                className="w-full mt-2"
              >
                إغلاق
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* نسخة مخفية للطباعة */}
      <div style={{ display: "none" }}>
        <Receipt ref={receiptRef} sale={currentSale} />
      </div>
    </div>
  );
};

export default CartPanel;
