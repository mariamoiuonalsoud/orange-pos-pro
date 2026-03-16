import React, {
  useState,
  useRef,
  forwardRef,
  useEffect,
  useCallback,
} from "react";
import { usePOS, SaleWithCustomer } from "@/contexts/POSContext";
import { useAuth } from "@/contexts/AuthContext";
import POSHeader from "@/components/POSHeader";
import {
  Receipt,
  CreditCard,
  Users,
  Calendar,
  Banknote,
  Printer,
  Search,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import { Input } from "@/components/ui/input"; // تأكدي إن المسار ده صح عندك

// --- مكون الفاتورة المخفي المخصص للطباعة (نفس تصميم الفاتورة الأصلية) ---
interface ReceiptProps {
  sale: SaleWithCustomer | null;
  cashierName: string;
}

const ReceiptToPrint = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, cashierName }, ref) => {
    if (!sale || !sale.items) return null;

    const tax = sale.total - sale.total / 1.15;
    const subtotal = sale.total / 1.15;

    return (
      <div
        ref={ref}
        className="p-6 bg-white text-black font-mono text-[12px] w-[80mm]"
        dir="rtl"
      >
        <div className="text-center border-b border-black pb-2 mb-3">
          <h2 className="text-lg font-bold uppercase">Orange Group</h2>
          <p className="text-[10px]">فرع المقطم - القاهرة</p>
          <p className="text-[10px]">هاتف: 01107288930</p>
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
            العميل:{" "}
            <span className="font-bold">
              {sale.customerName || "عميل نقدي"}
            </span>
          </p>
          {sale.customerPhone && (
            <p>
              الهاتف: <span className="font-bold">{sale.customerPhone}</span>
            </p>
          )}
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
            margin={0}
          />
          <p className="text-[10px] font-bold mt-2 text-center">
            شكراً لزيارتكم! Orange Group
          </p>
        </div>

        <style type="text/css" media="print">
          {`
            @page { 
              size: 80mm auto;
              margin: 0 !important; 
            }
            @media print {
              html, body {
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
              }
              body::before, body::after {
                display: none !important;
              }
            }
          `}
        </style>
      </div>
    );
  },
);

ReceiptToPrint.displayName = "ReceiptToPrint";

const ReportsPage = () => {
  const { sales } = usePOS();
  const { user } = useAuth(); // جلب اسم الكاشير الحالي (الأدمن)

  // حالات الطباعة
  const [saleToPrint, setSaleToPrint] = useState<SaleWithCustomer | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // --- حالات البحث الجديدة ---
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [receiptSearchQuery, setReceiptSearchQuery] = useState("");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // حساب الإجماليات
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);
  const totalRevenueBase = totalSalesAmount / 1.15;

  const handlePrintAction = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: saleToPrint?.receiptNumber || "receipt",
  });

  const triggerPrint = (sale: SaleWithCustomer) => {
    setSaleToPrint(sale);
    setTimeout(() => {
      handlePrintAction();
    }, 100);
  };

  // --- منطق الفلترة ---
  const filteredSales = sales.filter((sale) => {
    // 1. فلترة بالعميل (الاسم أو التليفون)
    const matchCustomer =
      customerSearchQuery === "" ||
      (sale.customerName?.toLowerCase() || "").includes(
        customerSearchQuery.toLowerCase(),
      ) ||
      (sale.customerPhone || "").includes(customerSearchQuery);

    // 2. فلترة برقم الفاتورة (الباركود)
    const matchReceipt =
      receiptSearchQuery === "" ||
      (sale.receiptNumber || "")
        .toLowerCase()
        .includes(receiptSearchQuery.toLowerCase().trim());

    return matchCustomer && matchReceipt;
  });

  // --- تركيز تلقائي على حقل الباركود عشان الكاشير يقدر يعمل Scan على طول ---
  useEffect(() => {
    const keepFocus = () => {
      // نتأكد إننا مش بنكتب في حقل العميل عشان منسحبش منه الـ Focus
      if (
        document.activeElement !== document.getElementById("customer-search") &&
        receiptInputRef.current
      ) {
        receiptInputRef.current.focus();
      }
    };

    // مش هنشغل التركيز التلقائي القوي زي صفحة الـ POS عشان نسمح بالبحث بالعميل براحتنا،
    // بس هنركز عليه أول ما الصفحة تفتح.
    keepFocus();
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" /> تقارير المبيعات والمشترين
        </h1>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-orange-500 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs font-bold opacity-80 uppercase">
                إجمالي المبيعات (بالضريبة)
              </p>
              <h3 className="text-2xl font-black">
                {totalSalesAmount.toFixed(2)} ج.م
              </h3>
            </div>
            <Banknote className="w-10 h-10 opacity-30" />
          </div>

          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">
                إجمالي الدخل (الصافي)
              </p>
              <h3 className="text-2xl font-black">
                {totalRevenueBase.toFixed(2)} ج.م
              </h3>
            </div>
            <CreditCard className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>

          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">
                عدد الفواتير
              </p>
              <h3 className="text-2xl font-black">{sales.length} فاتورة</h3>
            </div>
            <Users className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
        </div>

        {/* --- قسم أدوات البحث الجديد --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* بحث العميل */}
          <div className="relative">
            <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              id="customer-search"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              className="pr-10 h-12 text-base rounded-xl border-primary/20 focus:border-primary"
            />
          </div>

          {/* بحث الفاتورة (باركود) */}
          <div className="relative">
            <BarcodeIcon className="absolute right-3 top-3.5 h-5 w-5 text-primary" />
            <Input
              ref={receiptInputRef}
              placeholder="مرر باركود الفاتورة هنا (أو ابحث برقمها)..."
              value={receiptSearchQuery}
              onChange={(e) => setReceiptSearchQuery(e.target.value)}
              className="pr-10 h-12 text-base rounded-xl border-2 border-primary/50 focus:border-primary bg-primary/5 font-mono"
            />
          </div>
        </div>

        {/* سجل الفواتير */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" /> مراجعة فواتير المشترين
            </h2>
            <span className="text-xs text-muted-foreground">
              يتم عرض {filteredSales.length} فاتورة
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 font-bold">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">المشتري</th>
                  <th className="p-4">إجمالي الفاتورة</th>
                  <th className="p-4">طريقة الدفع</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-t border-border hover:bg-muted/10 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-xs">
                        {sale.receiptNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold">
                          {sale.customerName || "عميل نقدي"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {sale.customerPhone || "بدون هاتف"}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-primary">
                        {sale.total.toFixed(2)} ج.م
                      </td>
                      <td className="p-4 text-xs font-bold text-muted-foreground">
                        {sale.paymentMethod === "cash"
                          ? "نقداً"
                          : "بطاقة / محفظة"}
                      </td>
                      <td className="p-4 text-[10px]">
                        {new Date(sale.date).toLocaleString("ar-EG")}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => triggerPrint(sale)}
                          className="inline-flex items-center justify-center p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                          title="طباعة الفاتورة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      لا توجد فواتير مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* الفاتورة المخفية للطباعة */}
      <div style={{ display: "none" }}>
        <ReceiptToPrint
          ref={receiptRef}
          sale={saleToPrint}
          cashierName={user?.name || "Admin"}
        />
      </div>
    </div>
  );
};

export default ReportsPage;
