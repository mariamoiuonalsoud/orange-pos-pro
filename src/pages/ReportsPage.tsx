import React, { useState, useRef, forwardRef, useEffect, useMemo } from "react";
import { usePOS, SaleWithCustomer, SaleItem } from "@/contexts/POSContext";
import { useAuth } from "@/contexts/AuthContext";
import POSHeader from "@/components/POSHeader";
import {
  Receipt,
  Users,
  Calendar,
  Printer,
  Search,
  Barcode as BarcodeIcon,
  Undo2,
  Download,
  PackageMinus,
  X,
  FileBox,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// --- مكون الفاتورة المخفي المخصص للطباعة ---
interface ReceiptProps {
  sale: SaleWithCustomer | null;
  cashierName: string;
}

const ReceiptToPrint = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, cashierName }, ref) => {
    if (!sale || !sale.items) return null;

    // منطق حساب الإجمالي الحقيقي (بدون ضريبة) بناءً على حالة التخزين
    const calculatePureTotal = (): number => {
      const itemsSum = sale.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );

      // إذا كان الإجمالي المخزن أكبر من مجموع العناصر (يعني متخزن بضريبة 15%)
      // نستخدم 1.14 كحد أمان للفرق البرمجي
      if (sale.total > itemsSum * 1.05) {
        return sale.total / 1.15;
      }

      // لو متخزن أصلاً بدون ضريبة، نرجع الإجمالي المخزن كما هو
      return sale.total;
    };

    const finalTotal = calculatePureTotal();

    return (
      <div
        ref={ref}
        className="p-6 bg-white text-black font-mono text-[12px] report-print-area"
        dir="rtl"
        style={{ width: "80mm", minHeight: "100%", height: "max-content" }}
      >
        <div className="text-center border-b border-black pb-2 mb-3">
          <h2 className="text-lg font-bold uppercase">Orange Group</h2>
          <p className="text-[10px]">فرع المقطم - القاهرة</p>
          <p className="text-[10px]">هاتف: 01107288930</p>
          <p className="text-[10px] mt-1">
            {new Date(sale.date).toLocaleString("ar-EG")}
          </p>
        </div>

        {sale.status === "refunded" && (
          <div className="text-center mb-2 border-y-2 border-dashed border-red-500 py-1">
            <span className="text-red-500 font-bold text-sm">
              *** فاتورة مسترجعة كلياً ***
            </span>
          </div>
        )}
        {sale.status === "partially_refunded" && (
          <div className="text-center mb-2 border-y-2 border-dashed border-orange-500 py-1">
            <span className="text-orange-500 font-bold text-sm">
              *** فاتورة مسترجعة جزئياً ***
            </span>
          </div>
        )}

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

        <table className="w-full border-b border-black text-[11px]">
          <thead>
            <tr className="border-b border-dashed border-black font-bold">
              <td className="py-1">الصنف</td>
              <td className="text-center">مباع</td>
              <td className="text-center text-red-600">مرتجع</td>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item: SaleItem) => (
              <tr key={item.id} className="align-top">
                <td className="py-1 max-w-[30mm] break-words">{item.name}</td>
                <td className="text-center">x{item.quantity}</td>
                <td className="text-center text-red-600">
                  {item.returned_quantity && item.returned_quantity > 0
                    ? `x${item.returned_quantity}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[12px] space-y-1 mb-3">
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>الإجمالي النهائي:</span>
            <span>{finalTotal.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Barcode
            value={sale.receiptNumber}
            width={1.5}
            height={40}
            fontSize={12}
            margin={10}
            background="#ffffff"
            lineColor="#000000"
            displayValue={true}
          />
          <p className="text-[10px] font-bold mt-2 text-center">
            شكراً لزيارتكم! Orange Group
          </p>
        </div>

        <style type="text/css" media="print">
          {`
            @page { size: 80mm auto; margin: 0 !important; }
            @media print {
              html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
              .report-print-area { page-break-inside: avoid !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}
        </style>
      </div>
    );
  },
);
ReceiptToPrint.displayName = "ReceiptToPrint";

type FilterType = "all" | "year" | "month" | "day";
type ReportTab = "all_sales" | "returns";

const ReportsPage: React.FC = () => {
  const { sales, refundItem } = usePOS();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>("all_sales");
  const [saleToPrint, setSaleToPrint] = useState<SaleWithCustomer | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");
  const [receiptSearchQuery, setReceiptSearchQuery] = useState<string>("");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const [dateFilterType, setDateFilterType] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [saleToRefund, setSaleToRefund] = useState<SaleWithCustomer | null>(
    null,
  );
  const [refundQuantities, setRefundQuantities] = useState<
    Record<string, number>
  >({});

  const handlePrintAction = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: saleToPrint?.receiptNumber || "receipt",
  });

  const triggerPrint = (sale: SaleWithCustomer): void => {
    setSaleToPrint(sale);
    setTimeout(() => handlePrintAction(), 100);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale: SaleWithCustomer) => {
      const matchCustomer =
        customerSearchQuery === "" ||
        (sale.customerName?.toLowerCase() || "").includes(
          customerSearchQuery.toLowerCase(),
        ) ||
        (sale.customerPhone || "").includes(customerSearchQuery);

      const matchReceipt =
        receiptSearchQuery === "" ||
        (sale.receiptNumber || "")
          .toLowerCase()
          .includes(receiptSearchQuery.toLowerCase().trim());

      let matchDate = true;
      if (dateFilterType !== "all") {
        const saleDate = new Date(sale.date);
        const isSameYear =
          saleDate.getFullYear() === selectedDate.getFullYear();
        const isSameMonth =
          isSameYear && saleDate.getMonth() === selectedDate.getMonth();
        const isSameDay =
          isSameMonth && saleDate.getDate() === selectedDate.getDate();

        if (dateFilterType === "year") matchDate = isSameYear;
        if (dateFilterType === "month") matchDate = isSameMonth;
        if (dateFilterType === "day") matchDate = isSameDay;
      }
      return matchCustomer && matchReceipt && matchDate;
    });
  }, [
    sales,
    customerSearchQuery,
    receiptSearchQuery,
    dateFilterType,
    selectedDate,
  ]);

  const displayedSales = useMemo(() => {
    if (activeTab === "returns") {
      return filteredSales.filter(
        (s: SaleWithCustomer) =>
          s.status === "refunded" || s.status === "partially_refunded",
      );
    }
    return filteredSales;
  }, [filteredSales, activeTab]);

  const exportToCSV = (): void => {
    if (displayedSales.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const headers: string[] = [
      "رقم الفاتورة",
      "العميل",
      "الهاتف",
      "الإجمالي",
      "طريقة الدفع",
      "التاريخ",
      "الحالة",
    ];
    const rows: string[][] = displayedSales.map((sale: SaleWithCustomer) => [
      sale.receiptNumber,
      sale.customerName || "عميل نقدي",
      sale.customerPhone || "-",
      sale.total.toFixed(2),
      sale.paymentMethod === "cash" ? "نقداً" : "بطاقة/محفظة",
      new Date(sale.date).toLocaleString("ar-EG").replace(",", ""),
      sale.status === "refunded"
        ? "مرتجع كلي"
        : sale.status === "partially_refunded"
          ? "مرتجع جزئي"
          : "مكتمل",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName =
      activeTab === "returns" ? "Orange_Returns_Report" : "Orange_Sales_Report";
    link.setAttribute(
      "download",
      `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openRefundModal = (sale: SaleWithCustomer): void => {
    setSaleToRefund(sale);
    setRefundQuantities({});
  };

  const handleItemRefund = async (item: SaleItem): Promise<void> => {
    if (!saleToRefund || !item.order_item_id) return;
    const qtyToReturn = refundQuantities[item.id] || 0;
    if (qtyToReturn <= 0) {
      toast.error("برجاء تحديد كمية صحيحة للاسترجاع");
      return;
    }

    const success = await refundItem(
      saleToRefund.id,
      item.order_item_id,
      item.id,
      qtyToReturn,
    );
    if (success) setSaleToRefund(null);
  };

  useEffect(() => {
    if (receiptInputRef.current) receiptInputRef.current.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" /> التقارير والمراجعة
          </h1>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{displayedSales.length} فاتورة</span>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> تصدير لـ Excel
            </button>
          </div>
        </div>

        <div className="flex bg-card p-1 rounded-xl border border-border w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("all_sales")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "all_sales"
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Receipt className="w-4 h-4" /> السجل الكامل
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "returns"
                ? "bg-red-500 text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <FileBox className="w-4 h-4" /> تقرير المرتجعات فقط
          </button>
        </div>

        {/* --- فلاتر البحث --- */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">تصفية بالتاريخ:</span>
            </div>
            <select
              className="border rounded-md p-2 text-sm bg-background cursor-pointer focus:ring-2 focus:ring-primary/50 outline-none"
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as FilterType)}
            >
              <option value="all">كل الأوقات</option>
              <option value="year">سنوي</option>
              <option value="month">شهري</option>
              <option value="day">يومي</option>
            </select>

            {dateFilterType !== "all" && (
              <input
                type={
                  dateFilterType === "year"
                    ? "number"
                    : dateFilterType === "month"
                      ? "month"
                      : "date"
                }
                className="border rounded-md p-2 text-sm bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                value={
                  dateFilterType === "year"
                    ? selectedDate.getFullYear()
                    : dateFilterType === "month"
                      ? selectedDate.toISOString().slice(0, 7)
                      : selectedDate.toISOString().slice(0, 10)
                }
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate =
                      dateFilterType === "year"
                        ? new Date(`${e.target.value}-01-01`)
                        : new Date(e.target.value);
                    setSelectedDate(newDate);
                  }
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="customer-search"
                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                value={customerSearchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerSearchQuery(e.target.value)
                }
                className="pr-10 h-12 text-base rounded-xl border-primary/20 focus:border-primary"
              />
            </div>
            <div className="relative">
              <BarcodeIcon className="absolute right-3 top-3.5 h-5 w-5 text-primary" />
              <Input
                ref={receiptInputRef}
                placeholder="مرر باركود الفاتورة هنا..."
                value={receiptSearchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReceiptSearchQuery(e.target.value)
                }
                className="pr-10 h-12 text-base rounded-xl border-2 border-primary/50 focus:border-primary bg-primary/5 font-mono"
              />
            </div>
          </div>
        </div>

        {/* --- جدول المبيعات --- */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
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
                {displayedSales.length > 0 ? (
                  displayedSales.map((sale: SaleWithCustomer) => (
                    <tr
                      key={sale.id}
                      className={`border-t border-border transition-colors ${
                        sale.status === "refunded"
                          ? "bg-red-50/50 opacity-70"
                          : sale.status === "partially_refunded"
                            ? "bg-orange-50/30"
                            : "hover:bg-muted/10"
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-mono font-bold text-xs">
                          {sale.receiptNumber}
                        </div>
                        {sale.status === "refunded" && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">
                            مسترجعة كلياً
                          </span>
                        )}
                        {sale.status === "partially_refunded" && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded">
                            مسترجعة جزئياً
                          </span>
                        )}
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => triggerPrint(sale)}
                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {sale.status !== "refunded" && (
                            <button
                              onClick={() => openRefundModal(sale)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      لا توجد فواتير مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: "none" }}>
        <ReceiptToPrint
          ref={receiptRef}
          sale={saleToPrint}
          cashierName={user?.name || "Admin"}
        />
      </div>

      {/* --- Modal الاسترجاع --- */}
      {saleToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-lg max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                  <PackageMinus className="w-6 h-6" /> استرجاع منتجات
                </h2>
                <p className="text-sm text-muted-foreground">
                  فاتورة رقم: {saleToRefund.receiptNumber}
                </p>
              </div>
              <button
                onClick={() => setSaleToRefund(null)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3">المنتج</th>
                    <th className="p-3 text-center">مباع</th>
                    <th className="p-3 text-center">متاح</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {saleToRefund.items.map((item: SaleItem) => {
                    const availableToReturn =
                      item.quantity - (item.returned_quantity || 0);
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-center text-primary font-bold">
                          {availableToReturn}
                        </td>
                        <td className="p-3 text-center">
                          <Input
                            type="number"
                            min="0"
                            max={availableToReturn}
                            value={refundQuantities[item.id] || 0}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const val = parseInt(e.target.value) || 0;
                              if (val <= availableToReturn)
                                setRefundQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: val,
                                }));
                            }}
                            className="w-16 text-center h-8"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            disabled={
                              availableToReturn <= 0 ||
                              !refundQuantities[item.id]
                            }
                            onClick={() => handleItemRefund(item)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-50"
                          >
                            إرجاع
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
