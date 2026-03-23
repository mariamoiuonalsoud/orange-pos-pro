import React, { useState, useRef } from "react";
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
  X,
  Printer,
  FileText,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "./Receipt";

const CartPanel = () => {
  const {
    cart,
    updateQuantity,
    clearCart,
    cartTotal,
    completeSale,
    saveQuotation,
    findCustomerByPhone,
  } = usePOS();
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentSale, setCurrentSale] = useState<SaleWithCustomer | null>(null);
  const [isQuotationType, setIsQuotationType] = useState(false);

  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState<string>("0");
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const amountAfterDiscount = Math.max(0, cartTotal - discountVal);
  const tax = amountAfterDiscount * 0.15;
  const grandTotal = amountAfterDiscount + tax;

  const changeDue = (parseFloat(cashReceived) || 0) - grandTotal;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: currentSale?.receiptNumber || "receipt",
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length === 11) {
      const c = findCustomerByPhone(val);
      if (c) setCustomerName(c.name);
    }
  };

  const processSale = async (method: "cash" | "card" | "mobile") => {
    if (!phone || !customerName || isProcessing) return;
    if (
      method === "cash" &&
      (!showCashInput || parseFloat(cashReceived) < grandTotal)
    ) {
      setShowCashInput(true);
      return;
    }

    setIsProcessing(true);
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
      setIsQuotationType(false);
      setShowSuccess(true);
      resetForm();
    }
    setIsProcessing(false);
  };

  const resetForm = () => {
    setShowCheckout(false);
    setShowCashInput(false);
    setPhone("");
    setCustomerName("");
    setCashReceived("");
    setDiscount("0");
  };

  return (
    <div className="w-full lg:w-96 bg-card border-r border-border flex flex-col h-full shadow-2xl relative">
      <div className="p-4 border-b flex justify-between items-center bg-muted/20">
        <h2 className="font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" /> السلة
        </h2>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-destructive hover:underline"
          >
            مسح الكل
          </button>
        )}
      </div>

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
                {item.price.toFixed(2)} ج.م
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded-md bg-background"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-md bg-primary text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="p-4 bg-muted/10 border-t space-y-3">
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Percent className="w-4 h-4" /> الخصم (ج.م):
            </div>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 h-8 text-center font-bold bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-1 text-sm font-bold">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span>{cartTotal.toFixed(2)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-red-600">
                <span>الخصم</span>
                <span>-{discountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>الضريبة (15%)</span>
              <span>{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black border-t pt-2 text-primary">
              <span>الإجمالي النهائي</span>
              <span>{grandTotal.toFixed(2)} ج.م</span>
            </div>
          </div>

          {!showCheckout ? (
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg"
            >
              إتمام العملية
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-background rounded-2xl border-2 border-primary/20 shadow-xl">
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
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => processSale("cash")}
                      className="bg-green-600 h-16 flex-col gap-1"
                    >
                      <Banknote className="w-5 h-5" />
                      نقداً
                    </Button>
                    <Button
                      onClick={() => processSale("card")}
                      className="bg-blue-600 h-16 flex-col gap-1"
                    >
                      <CreditCard className="w-5 h-5" />
                      بطاقة
                    </Button>
                    <Button
                      onClick={() => processSale("mobile")}
                      className="bg-slate-800 h-16 flex-col gap-1"
                    >
                      <Smartphone className="w-5 h-5" />
                      محفظة
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
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-14 text-center text-2xl font-bold border-2 border-green-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  {changeDue >= 0 && (
                    <div className="p-3 bg-green-600 text-white text-center rounded-xl font-black">
                      الباقي: {changeDue.toFixed(2)} ج.م
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCashInput(false)}
                    >
                      رجوع
                    </Button>
                    <Button
                      disabled={isProcessing}
                      className="flex-[2] bg-green-600 font-bold"
                      onClick={() => processSale("cash")}
                    >
                      تأكيد العملية
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showSuccess && currentSale && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-card p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl"
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-1">تمت العملية!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {currentSale.receiptNumber}
              </p>
              <Button
                onClick={handlePrint}
                className="w-full h-14 bg-primary text-white font-black text-xl gap-3 shadow-xl"
              >
                <Printer className="w-6 h-6" /> طباعة
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

      <div style={{ display: "none" }}>
        <Receipt ref={receiptRef} sale={currentSale} />
      </div>
    </div>
  );
};

export default CartPanel;
