"use client";

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
  Percent,
  Trash2,
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

  useEffect(() => {
    if (tempCustomer.phone || tempCustomer.name) {
      setPhone(tempCustomer.phone);
      setCustomerName(tempCustomer.name);
      setDiscount(cartDiscount.toString());
      setShowCheckout(true);
    }
  }, [tempCustomer, cartDiscount]);

  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const grandTotal = Math.max(0, cartTotal - discountVal);
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeDue = cashReceivedNum - grandTotal;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: currentSale?.receiptNumber || "receipt",
  });

  const handleDiscountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const val = e.target.value;
    setDiscount(parseFloat(val) < 0 ? "0" : val);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setPhone(val);
    if (val.length === 11) {
      const customer = findCustomerByPhone(val);
      if (customer) setCustomerName(customer.name);
    }
  };

  const resetForm = (): void => {
    setShowCheckout(false);
    setShowCashInput(false);
    setPhone("");
    setCustomerName("");
    setCashReceived("");
    setDiscount("0");
    setTempCustomer({ name: "", phone: "" });
    setCartDiscount(0);
    clearCart();
  };

  const handleSaveQuotation = async (): Promise<void> => {
    if (!phone || !customerName) {
      toast.error("بيانات العميل مطلوبة لحفظ عرض السعر");
      return;
    }
    setIsProcessing(true);
    try {
      const success = await saveQuotation(
        user?.id || "admin",
        phone,
        customerName,
        discountVal,
      );
      if (success) {
        toast.success("تم حفظ عرض السعر بنجاح");
        resetForm();
      }
    } catch (error: unknown) {
      toast.error("حدث خطأ أثناء حفظ عرض السعر");
    } finally {
      setIsProcessing(false);
    }
  };

  const processSale = async (
    method: "cash" | "card" | "mobile",
  ): Promise<void> => {
    if (!phone || !customerName || isProcessing) {
      toast.error("برجاء إدخال بيانات العميل");
      return;
    }
    if (method === "cash" && (!showCashInput || cashReceivedNum < grandTotal)) {
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
        cashReceivedNum || grandTotal,
        changeDue > 0 ? changeDue : 0,
        discountVal,
      );
      if (sale) {
        setCurrentSale(sale);
        setShowSuccess(true);
        resetForm();
      }
    } catch (error: unknown) {
      toast.error("حدث خطأ في العملية");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="w-full lg:w-96 bg-card border-l border-border flex flex-col h-fit shadow-2xl relative"
      dir="rtl"
    >
      {/* 1. Header */}
      <div className="p-4 border-b flex justify-between items-center bg-muted/20 shrink-0">
        <h2 className="font-bold flex items-center gap-2 text-foreground font-cairo text-sm">
          <ShoppingBag className="w-4 h-4 text-primary" /> سلة المشتريات
        </h2>
        {cart.length > 0 && (
          <button
            onClick={() => {
              clearCart();
              resetForm();
            }}
            className="text-[10px] text-destructive flex items-center gap-1 hover:underline"
          >
            <Trash2 size={12} /> مسح الكل
          </button>
        )}
      </div>

      {/* 2. Container WITHOUT scroll */}
      <div className="bg-card/50">
        <div className="p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-20">
              <ShoppingBag size={40} className="mb-2" />
              <p className="font-cairo text-xs">السلة فارغة</p>
            </div>
          ) : (
            <>
              {/* Product List */}
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border group"
                >
                  <span className="text-xl">📦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate font-cairo">
                      {item.name}
                    </p>
                    <p className="text-primary font-bold text-[10px]">
                      {(item.price * item.quantity).toFixed(2)} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-md bg-background hover:bg-muted border border-border"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-bold text-xs w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-md bg-primary text-white hover:bg-orange-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* 3. Footer Area */}
              <div className="mt-6 pt-4 border-t border-dashed border-border space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-[11px] font-cairo">
                    <Percent size={14} /> الخصم (ج.م):
                  </div>
                  <Input
                    type="number"
                    value={discount}
                    onChange={handleDiscountChange}
                    className="w-20 h-7 text-center font-bold text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-muted-foreground text-[11px] font-medium font-cairo">
                    <span>المجموع الفرعي</span>
                    <span>{cartTotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t pt-2 text-primary font-cairo">
                    <span>الإجمالي النهائي</span>
                    <span>{grandTotal.toFixed(2)} ج.م</span>
                  </div>
                </div>

                <div className="relative pb-4">
                  {!showCheckout ? (
                    <Button
                      onClick={() => setShowCheckout(true)}
                      className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-orange-600 shadow-md font-cairo transition-all"
                    >
                      إتمام العملية
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-background rounded-xl border-2 border-primary/20 shadow-xl p-3 space-y-3"
                    >
                      {!showCashInput ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="رقم الموبايل"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={11}
                            className="h-9 text-xs font-cairo"
                          />
                          <Input
                            placeholder="اسم العميل"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="h-9 text-xs font-cairo"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => setShowCheckout(false)}
                              variant="secondary"
                              className="h-9 text-xs font-cairo"
                            >
                              رجوع
                            </Button>
                            <Button
                              onClick={handleSaveQuotation}
                              disabled={isProcessing}
                              variant="outline"
                              className="h-9 text-xs border-primary text-primary font-bold font-cairo"
                            >
                              عرض سعر
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 pt-2 border-t">
                            <Button
                              onClick={() => processSale("cash")}
                              className="bg-green-600 hover:bg-green-700 h-14 flex-col gap-1 text-[9px] text-white"
                            >
                              <Banknote size={18} /> نقداً
                            </Button>
                            <Button
                              onClick={() => processSale("card")}
                              className="bg-blue-600 hover:bg-blue-700 h-14 flex-col gap-1 text-[9px] text-white"
                            >
                              <CreditCard size={18} /> بطاقة
                            </Button>
                            <Button
                              onClick={() => processSale("mobile")}
                              className="bg-slate-800 hover:bg-slate-900 h-14 flex-col gap-1 text-[9px] text-white"
                            >
                              <Smartphone size={18} /> محفظة
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder="المبلغ المستلم..."
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="h-10 text-center text-lg font-bold border-2 border-green-500"
                            autoFocus
                          />
                          {changeDue >= 0 && (
                            <div className="p-2 bg-green-600 text-white text-center rounded-lg font-bold text-xs font-cairo">
                              الباقي: {changeDue.toFixed(2)} ج.م
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 h-9 text-xs font-cairo"
                              onClick={() => setShowCashInput(false)}
                            >
                              رجوع
                            </Button>
                            <Button
                              disabled={isProcessing}
                              className="flex-[2] bg-green-600 h-9 text-xs font-bold text-white font-cairo"
                              onClick={() => processSale("cash")}
                            >
                              تأكيد
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && currentSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl"
            >
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-1 font-cairo">
                تمت العملية!
              </h3>
              <p className="text-muted-foreground text-[10px] mb-4 font-mono">
                {currentSale.receiptNumber}
              </p>
              <Button
                onClick={handlePrint}
                className="w-full h-12 bg-primary text-white font-bold gap-2 shadow-lg font-cairo"
              >
                <Printer size={20} /> طباعة الفاتورة
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSuccess(false)}
                className="w-full mt-2 text-xs font-cairo"
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
