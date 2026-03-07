import React, { useState, useRef, forwardRef } from "react";
import { usePOS, SaleWithCustomer } from "@/contexts/POSContext";
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
  User,
  Phone,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import logo from "@/assets/orange-group-logo.png";

// --- مكون الفاتورة (Receipt) المخصص للطباعة ---
interface ReceiptProps {
  sale: SaleWithCustomer | null;
  cashierName: string;
}

const ReceiptToPrint = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, cashierName }, ref) => {
    if (!sale || !sale.items) return null; // تأمين إضافي عشان الـ map ميضربش

    const tax = sale.total - sale.total / 1.15;
    const subtotal = sale.total / 1.15;

    return (
      <div
        ref={ref}
        className="p-6 bg-white text-black font-mono text-[12px] w-[80mm]"
        dir="rtl"
      >
        <div className="text-center border-b border-black pb-2 mb-3">
          <h2 className="text-lg font-bold">ORANGE GROUP POS</h2>
          <p className="text-[10px]">فرع الشروق | هاتف: 01000000000</p>
          <p className="text-[10px] mt-1">
            {new Date(sale.date).toLocaleString("ar-EG")}
          </p>
        </div>

        <div className="mb-3 text-[11px] space-y-1">
          <p>
            رقم الفاتورة:{" "}
            <span className="font-bold">{sale.receiptNumber}</span>
          </p>
          <p>
            الكاشير: <span className="font-bold">{cashierName}</span>
          </p>
          <p>
            العميل: <span className="font-bold">{sale.customerName}</span>
          </p>
          <p>
            الهاتف: <span className="font-bold">{sale.customerPhone}</span>
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
            <span>المجموع:</span>
            <span>{subtotal.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between">
            <span>الضريبة (15%):</span>
            <span>{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>الإجمالي النهائي:</span>
            <span>{sale.total.toFixed(2)} ج.م</span>
          </div>

          {sale.paymentMethod === "cash" && (
            <div className="mt-2 border-t border-dashed border-black pt-2">
              <div className="flex justify-between">
                <span>المدفوع نقداً:</span>
                <span>{sale.amountPaid?.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>الباقي:</span>
                <span>{sale.changeDue?.toFixed(2)} ج.م</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Barcode
            value={sale.receiptNumber}
            width={1.2}
            height={40}
            fontSize={10}
          />
          <p className="text-[10px] font-bold mt-2 text-center">
            شكراً لزيارتكم! Orange Group
          </p>
        </div>

        <style type="text/css" media="print">
          {`@page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 5mm; }`}
        </style>
      </div>
    );
  },
);

// --- المكون الرئيسي للسلة (CartPanel) ---
const CartPanel = () => {
  const {
    cart,
    updateQuantity,
    clearCart,
    cartTotal,
    completeSale,
    findCustomerByPhone,
  } = usePOS();
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentSale, setCurrentSale] = useState<SaleWithCustomer | null>(null);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [showCashInput, setShowCashInput] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // لتعطيل الأزرار أثناء البيع

  const tax = cartTotal * 0.15;
  const grandTotal = cartTotal + tax;
  const changeDue = parseFloat(cashReceived) - grandTotal;

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: currentSale?.receiptNumber || "receipt",
    pageStyle: `
    @page { size: 80mm 80mm; margin: 0 !important; }
    @media print {
      body { width: 80mm !important; margin: 0 !important; display: flex; justify-content: center; align-items: center; padding: 0 !important; -webkit-print-color-adjust: exact; }
      * { overflow: visible !important; }
    }
  `,
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length === 11) {
      const c = findCustomerByPhone(val);
      if (c) {
        setCustomerName(c.name);
        setIsExisting(true);
        toast.success(`تم التعرف على العميل: ${c.name}`);
      }
    } else {
      if (isExisting) {
        setCustomerName("");
        setIsExisting(false);
      }
    }
  };

  // --- تحديث دالة البيع لتكون Async وتنتظر الداتابيز ---
  const processSale = async (method: "cash" | "card" | "mobile") => {
    if (!user || isProcessing) return;

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("خطأ في رقم الهاتف!", {
        description: "يجب إدخال 11 رقم يبدأ بـ 01",
      });
      return;
    }

    if (!customerName.trim()) {
      toast.error("اسم العميل مطلوب!");
      return;
    }

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

    try {
      setIsProcessing(true);
      // إتمام العملية وانتظار النتيجة من السيرفر
      const sale = await completeSale(
        method,
        user.id,
        phone,
        customerName,
        method === "cash" ? parseFloat(cashReceived) : grandTotal,
        changeDue > 0 ? changeDue : 0,
      );

      if (sale) {
        setCurrentSale(sale);
        setShowSuccess(true);
        setShowCheckout(false);
        setShowCashInput(false);
        setPhone("");
        setCustomerName("");
        setCashReceived("");
      }
    } catch (error) {
      toast.error("فشلت عملية البيع، يرجى المحاولة مرة أخرى");
    } finally {
      setIsProcessing(false);
    }
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
            className="text-xs text-destructive hover:font-bold"
          >
            مسح الكل
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span>{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
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
              الدفع
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-background rounded-2xl border-2 border-primary/20 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary italic">
                  بيانات العميل وطريقة الدفع
                </span>
                <X
                  className="w-5 h-5 cursor-pointer text-muted-foreground"
                  onClick={() => setShowCheckout(false)}
                />
              </div>

              {!showCashInput ? (
                <>
                  <div className="space-y-2">
                    <Input
                      placeholder="رقم الموبايل (11 رقم)"
                      value={phone}
                      onChange={handlePhoneChange}
                      dir="ltr"
                      maxLength={11}
                      className="h-11 border-primary/30"
                    />
                    <Input
                      placeholder="اسم العميل"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isExisting}
                      className={`h-11 ${isExisting ? "bg-success/10 border-success text-success font-bold" : "border-primary/30"}`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      disabled={isProcessing}
                      onClick={() => processSale("cash")}
                      className="bg-success hover:bg-green-600 h-16 flex-col gap-1"
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="text-[10px]">نقداً</span>
                    </Button>
                    <Button
                      disabled={isProcessing}
                      onClick={() => processSale("card")}
                      className="bg-blue-600 hover:bg-blue-700 h-16 flex-col gap-1"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px]">بطاقة</span>
                    </Button>
                    <Button
                      disabled={isProcessing}
                      onClick={() => processSale("mobile")}
                      className="bg-slate-800 hover:bg-black h-16 flex-col gap-1"
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-[10px]">محفظة</span>
                    </Button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 py-2"
                >
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      المبلغ الإجمالي
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {grandTotal.toFixed(2)} ج.م
                    </p>
                  </div>
                  <Input
                    type="number"
                    placeholder="المبلغ المستلم..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="h-14 text-center text-2xl font-bold border-2 border-success/50"
                    autoFocus
                  />
                  {changeDue >= 0 && (
                    <div className="p-3 bg-success text-white text-center rounded-xl font-black text-lg animate-bounce">
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
                      className="flex-[2] bg-success h-12 font-bold"
                      onClick={() => processSale("cash")}
                    >
                      {isProcessing ? "جاري الحفظ..." : "تأكيد العملية"}
                    </Button>
                  </div>
                </motion.div>
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
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-card p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl relative border border-primary/20"
            >
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <img
                src={logo}
                className="w-16 h-16 mx-auto mb-3 object-contain"
                alt="logo"
              />
              <h3 className="text-2xl font-black mb-1">تم البيع بنجاح!</h3>
              <p className="text-muted-foreground text-sm mb-6 font-mono">
                {currentSale.receiptNumber}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handlePrint}
                  className="w-full h-14 bg-primary text-white font-black text-xl gap-3 shadow-xl hover:scale-105 transition-transform"
                >
                  <Printer className="w-6 h-6" /> طباعة الفاتورة
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
        />
      </div>
    </div>
  );
};

export default CartPanel;
