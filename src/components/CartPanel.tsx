import React, { useState, useRef, forwardRef } from "react";
import { usePOS, SaleWithCustomer, SaleItem } from "@/contexts/POSContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
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
import Barcode from "react-barcode";

// --- مكون الفاتورة المخصص للطباعة (يدعم الخصم) ---
interface ReceiptProps {
  sale: SaleWithCustomer | null;
  cashierName: string;
  isQuotation?: boolean;
}

const ReceiptToPrint = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, cashierName, isQuotation }, ref) => {
    if (!sale || !sale.items) return null;

    const discount = sale.discountAmount || 0;
    const amountAfterDiscount = sale.total / 1.15; // المبلغ قبل الضريبة وبعد الخصم
    const subtotal = amountAfterDiscount + discount; // المبلغ الأصلي قبل كل شيء
    const tax = amountAfterDiscount * 0.15;

    return (
      <div
        ref={ref}
        className="p-6 bg-white text-black font-mono text-[12px] w-[80mm]"
        dir="rtl"
      >
        <div className="text-center border-b border-black pb-2 mb-3">
          <h2 className="text-lg font-bold">
            {isQuotation ? "عرض سعر" : "ORANGE GROUP"}
          </h2>
          <p className="text-[10px]">فرع المقطم | هاتف: 01107288930</p>
          <p className="text-[10px] mt-1">
            {new Date(sale.date).toLocaleString("ar-EG")}
          </p>
        </div>

        <div className="mb-3 text-[11px] space-y-1">
          <p>
            {isQuotation ? "رقم العرض" : "رقم الفاتورة"}:{" "}
            <span className="font-bold">{sale.receiptNumber}</span>
          </p>
          <p>
            الكاشير: <span className="font-bold">{cashierName}</span>
          </p>
          <p>
            العميل: <span className="font-bold">{sale.customerName}</span>
          </p>
        </div>

        <table className="w-full mb-3 border-b border-black text-[11px]">
          <thead>
            <tr className="border-b border-dashed border-black font-bold">
              <td className="py-1">الصنف</td>
              <td className="text-center">الكمية</td>
              <td className="text-left">الإجمالي</td>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1">{item.name}</td>
                <td className="text-center">x{item.quantity}</td>
                <td className="text-left">
                  {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[12px] space-y-1 mb-4">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{subtotal.toFixed(2)} ج.م</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>الخصم:</span>
              <span>-{discount.toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>الضريبة (15%):</span>
            <span>{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>الإجمالي النهائي:</span>
            <span>{sale.total.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Barcode
            value={sale.receiptNumber}
            width={1.2}
            height={40}
            fontSize={10}
          />
          <p className="text-[10px] font-bold mt-2 text-center italic">
            {isQuotation
              ? "هذا العرض صالح لمدة 7 أيام فقط"
              : "شكراً لزيارتكم! Orange Group"}
          </p>
        </div>
        <style
          type="text/css"
          media="print"
        >{`@page { size: 80mm auto; margin: 0; } body { padding: 5mm; }`}</style>
      </div>
    );
  },
);
ReceiptToPrint.displayName = "ReceiptToPrint";

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
  const [isExisting, setIsExisting] = useState(false);
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // حسابات الأسعار والخصم مع ضمان عدم وجود قيم سالبة
  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const amountAfterDiscount = Math.max(0, cartTotal - discountVal);
  const tax = amountAfterDiscount * 0.15;
  const grandTotal = amountAfterDiscount + tax;
  const changeDue = parseFloat(cashReceived) - grandTotal;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: currentSale?.receiptNumber || "receipt",
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length === 11) {
      const c = findCustomerByPhone(val);
      if (c) {
        setCustomerName(c.name);
        setIsExisting(true);
      }
    } else if (isExisting) {
      setCustomerName("");
      setIsExisting(false);
    }
  };

  const validateInputs = () => {
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      toast.error("رقم هاتف غير صحيح");
      return false;
    }
    if (!customerName.trim()) {
      toast.error("اسم العميل مطلوب");
      return false;
    }
    return true;
  };

  const handleQuotation = async () => {
    if (!validateInputs() || isProcessing) return;
    setIsProcessing(true);

    const success = await saveQuotation(
      user?.id || "admin",
      phone,
      customerName,
      discountVal,
    );

    if (success) {
      const receiptNum = `QUO-${Date.now().toString(36).toUpperCase()}`;

      const saleItems: SaleItem[] = cart.map((item) => ({
        ...item,
        returned_quantity: 0,
      }));

      const quoData: SaleWithCustomer = {
        id: "temp",
        receiptNumber: receiptNum,
        items: saleItems,
        total: grandTotal,
        date: new Date().toISOString(),
        paymentMethod: "cash",
        cashierId: user?.id || "",
        customerPhone: phone,
        customerName: customerName,
        discountAmount: discountVal,
        status: "completed",
      };

      setCurrentSale(quoData);
      setIsQuotationType(true);
      setShowSuccess(true);
      resetForm();
    }
    setIsProcessing(false);
  };

  const processSale = async (method: "cash" | "card" | "mobile") => {
    if (!validateInputs() || isProcessing) return;

    if (method === "cash") {
      if (!showCashInput) {
        setShowCashInput(true);
        return;
      }
      if (parseFloat(cashReceived) < grandTotal || !cashReceived) {
        toast.error("المبلغ غير كافي!");
        return;
      }
    }

    setIsProcessing(true);
    const sale = await completeSale(
      method,
      user?.id || "admin",
      phone,
      customerName,
      method === "cash" ? parseFloat(cashReceived) : grandTotal,
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
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <ShoppingBag className="w-20 h-20" />
            <p>السلة فارغة</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border"
            >
              <span className="text-2xl">{item.image}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.name}</p>
                <p className="text-primary font-bold text-xs">
                  {item.price.toFixed(2)} ج.م
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded-md bg-background shadow-sm hover:text-destructive"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded-md bg-primary text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-4 bg-muted/10 border-t space-y-3">
          {/* حقل الخصم المحدث لمنع القيم السالبة */}
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Percent className="w-4 h-4" /> الخصم (ج.م):
            </div>
            <Input
              type="number"
              min="0" // يمنع النزول تحت الصفر من خلال الأسهم
              value={discount}
              onChange={(e) => {
                const val = e.target.value;
                // يمنع كتابة أي رقم سالب يدوياً
                if (parseFloat(val) < 0) {
                  setDiscount("0");
                } else {
                  setDiscount(val);
                }
              }}
              className="w-24 h-8 text-center font-bold bg-white border-blue-200"
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
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-95"
            >
              إتمام العملية
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-background rounded-2xl border-2 border-primary/20 shadow-xl">
              <div className="flex justify-between items-center text-xs font-bold text-primary italic">
                <span>بيانات العميل وطريقة الدفع</span>
                <X
                  className="w-5 h-5 cursor-pointer text-muted-foreground"
                  onClick={() => setShowCheckout(false)}
                />
              </div>

              {!showCashInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="رقم الموبايل"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={11}
                    className="h-11 border-primary/30"
                  />
                  <Input
                    placeholder="اسم العميل"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isExisting}
                    className={`h-11 ${isExisting ? "bg-green-50" : ""}`}
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleQuotation}
                      className="h-12 border-blue-500 text-blue-600 font-bold gap-2 hover:bg-blue-50"
                    >
                      <FileText className="w-4 h-4" /> حفظ كعرض سعر
                    </Button>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => processSale("cash")}
                        className="bg-green-600 h-16 flex-col gap-1 hover:bg-green-700"
                      >
                        <Banknote className="w-5 h-5" />
                        نقداً
                      </Button>
                      <Button
                        onClick={() => processSale("card")}
                        className="bg-blue-600 h-16 flex-col gap-1 hover:bg-blue-700"
                      >
                        <CreditCard className="w-5 h-5" />
                        بطاقة
                      </Button>
                      <Button
                        onClick={() => processSale("mobile")}
                        className="bg-slate-800 h-16 flex-col gap-1 hover:bg-black"
                      >
                        <Smartphone className="w-5 h-5" />
                        محفظة
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <Input
                    type="number"
                    placeholder="المبلغ المستلم..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-14 text-center text-2xl font-bold border-2 border-green-500/50"
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
                      className="flex-[2] bg-green-600 h-12 font-bold hover:bg-green-700"
                      onClick={() => processSale("cash")}
                    >
                      {isProcessing ? "جاري الحفظ..." : "تأكيد العملية"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* شاشة النجاح */}
      <AnimatePresence>
        {showSuccess && currentSale && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl border border-primary/20"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-black mb-1">
                {isQuotationType ? "تم حفظ العرض!" : "تم البيع بنجاح!"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 font-mono">
                {currentSale.receiptNumber}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handlePrint}
                  className="w-full h-14 bg-primary text-white font-black text-xl gap-3 shadow-xl hover:scale-105 transition-transform"
                >
                  <Printer className="w-6 h-6" /> طباعة{" "}
                  {isQuotationType ? "العرض" : "الفاتورة"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSuccess(false)}
                  className="w-full h-10 text-muted-foreground"
                >
                  إغلاق
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ display: "none" }}>
        <ReceiptToPrint
          ref={receiptRef}
          sale={currentSale}
          cashierName={user?.name || ""}
          isQuotation={isQuotationType}
        />
      </div>
    </div>
  );
};

export default CartPanel;
