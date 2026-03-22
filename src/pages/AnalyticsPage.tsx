import React, { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import {
  TrendingUp,
  PackageSearch,
  Users,
  LineChart as LineChartIcon,
  Award,
  DollarSign,
  Calendar,
  Download,
  PieChart as PieChartIcon, // أيقونة التصنيفات
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx"; // 🌟 استيراد مكتبة الإكسيل الجديدة

// إضافة "categories" للتبويبات
type TabType = "financial" | "products" | "categories" | "customers";
type FilterType = "all" | "year" | "month" | "day";

const AnalyticsPage = () => {
  const { sales, products } = usePOS();
  const [activeTab, setActiveTab] = useState<TabType>("financial");
  const [dateFilterType, setDateFilterType] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const COLORS = [
    "#f97316",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f43f5e",
    "#06b6d4",
  ];

  // ==========================================
  // فلترة المبيعات بالتاريخ
  // ==========================================
  const filteredSales = useMemo(() => {
    if (dateFilterType === "all") return sales;
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const isSameYear = saleDate.getFullYear() === selectedDate.getFullYear();
      const isSameMonth =
        isSameYear && saleDate.getMonth() === selectedDate.getMonth();
      const isSameDay =
        isSameMonth && saleDate.getDate() === selectedDate.getDate();

      if (dateFilterType === "year") return isSameYear;
      if (dateFilterType === "month") return isSameMonth;
      if (dateFilterType === "day") return isSameDay;
      return true;
    });
  }, [sales, dateFilterType, selectedDate]);

  // ==========================================
  // 1. البيانات المالية المجمعة
  // ==========================================
  const financialData = useMemo(() => {
    let data: { name: string; revenue: number; profit: number }[] = [];
    if (dateFilterType === "month") {
      const daysInMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0,
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++)
        data.push({ name: `${i}`, revenue: 0, profit: 0 });
      filteredSales.forEach((sale) => {
        const d = new Date(sale.date).getDate();
        const baseAmount = sale.total / 1.15;
        data[d - 1].revenue += sale.total;
        data[d - 1].profit += baseAmount * 0.3;
      });
    } else if (dateFilterType === "day") {
      for (let i = 0; i < 24; i++)
        data.push({ name: `${i}:00`, revenue: 0, profit: 0 });
      filteredSales.forEach((sale) => {
        const h = new Date(sale.date).getHours();
        const baseAmount = sale.total / 1.15;
        data[h].revenue += sale.total;
        data[h].profit += baseAmount * 0.3;
      });
    } else {
      const months = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      data = months.map((name) => ({ name, revenue: 0, profit: 0 }));
      filteredSales.forEach((sale) => {
        const m = new Date(sale.date).getMonth();
        const baseAmount = sale.total / 1.15;
        data[m].revenue += sale.total;
        data[m].profit += baseAmount * 0.3;
      });
    }
    return data;
  }, [filteredSales, dateFilterType, selectedDate]);

  // ==========================================
  // 2. بيانات المنتجات
  // ==========================================
  const allProductSales = useMemo(() => {
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.id])
          productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        // حساب الصافي الفعلي بطرح الكمية المسترجعة إن وجدت
        const actualQty = item.quantity - (item.returned_quantity || 0);
        productSales[item.id].quantity += actualQty;
        productSales[item.id].revenue += item.price * actualQty;
      });
    });
    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const topSellingProducts = allProductSales.slice(0, 5);

  // ==========================================
  // 3. بيانات التصنيفات (Categories Analytics)
  // ==========================================
  const categoryData = useMemo(() => {
    const categories: Record<
      string,
      { name: string; revenue: number; profit: number }
    > = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        // بنجيب التصنيف من قائمة المنتجات الأصلية
        const prod = products.find((p) => p.id === item.id);
        const cat =
          prod?.category && prod.category.trim() !== ""
            ? prod.category
            : "أخرى / غير مصنف";

        if (!categories[cat])
          categories[cat] = { name: cat, revenue: 0, profit: 0 };

        const actualQty = item.quantity - (item.returned_quantity || 0);
        const rev = item.price * actualQty;
        const prof = (rev / 1.15) * 0.3; // هامش ربح تقديري 30%

        categories[cat].revenue += rev;
        categories[cat].profit += prof;
      });
    });
    return Object.values(categories).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // ==========================================
  // 4. بيانات العملاء
  // ==========================================
  const allCustomersData = useMemo(() => {
    const customerStats: Record<
      string,
      { name: string; phone: string; totalSpent: number; orderCount: number }
    > = {};
    filteredSales.forEach((sale) => {
      const custName = sale.customerName || "عميل نقدي (بدون اسم)";
      if (!customerStats[custName]) {
        customerStats[custName] = {
          name: custName,
          phone: sale.customerPhone || "-",
          totalSpent: 0,
          orderCount: 0,
        };
      }
      customerStats[custName].totalSpent += sale.total;
      customerStats[custName].orderCount += 1;
    });
    return Object.values(customerStats).sort(
      (a, b) => b.totalSpent - a.totalSpent,
    );
  }, [filteredSales]);

  const topCustomers = allCustomersData.slice(0, 5);

  // ==========================================
  // 🌟 دالة تصدير ملف Excel متعدد الصفحات (Multi-sheet)
  // ==========================================
  const exportToExcelMultiSheet = () => {
    // 1. إنشاء ملف إكسيل جديد (Workbook)
    const wb = XLSX.utils.book_new();

    // 2. تجهيز بيانات صفحة الأداء المالي
    const financialSheetData = financialData.map((d) => ({
      "الفترة الزمنية": d.name,
      "إجمالي الإيرادات (ج.م)": d.revenue,
      "صافي الربح التقديري (ج.م)": d.profit,
    }));
    const wsFinancial = XLSX.utils.json_to_sheet(financialSheetData);
    XLSX.utils.book_append_sheet(wb, wsFinancial, "الأداء المالي");

    // 3. تجهيز بيانات صفحة التصنيفات
    const categoriesSheetData =
      categoryData.length > 0
        ? categoryData.map((c) => ({
            التصنيف: c.name,
            "إجمالي الإيرادات (ج.م)": c.revenue,
            "صافي الربح التقديري (ج.م)": c.profit,
          }))
        : [{ ملاحظة: "لا توجد مبيعات في هذه الفترة" }];
    const wsCategories = XLSX.utils.json_to_sheet(categoriesSheetData);
    XLSX.utils.book_append_sheet(wb, wsCategories, "تحليل التصنيفات");

    // 4. تجهيز بيانات صفحة المنتجات
    const productsSheetData =
      allProductSales.length > 0
        ? allProductSales.map((p) => ({
            "اسم المنتج": p.name,
            "الكمية المباعة (الصافية)": p.quantity,
            "إجمالي الإيرادات (ج.م)": p.revenue,
          }))
        : [{ ملاحظة: "لا توجد مبيعات في هذه الفترة" }];
    const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "الأجهزة والمنتجات");

    // 5. تجهيز بيانات صفحة العملاء
    const customersSheetData =
      allCustomersData.length > 0
        ? allCustomersData.map((c) => ({
            "اسم العميل": c.name,
            "رقم الهاتف": c.phone,
            "عدد الطلبيات": c.orderCount,
            "إجمالي المشتريات (ج.م)": c.totalSpent,
          }))
        : [{ ملاحظة: "لا توجد بيانات عملاء في هذه الفترة" }];
    const wsCustomers = XLSX.utils.json_to_sheet(customersSheetData);
    XLSX.utils.book_append_sheet(wb, wsCustomers, "العملاء");

    // 6. حفظ الملف وتنزيله للمستخدم
    const fileName = `Orange_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("تم تصدير ملف الإكسيل الشامل بنجاح!");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* --- العنوان وزر التصدير --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> التحليلات المتقدمة
          </h1>
          <button
            onClick={exportToExcelMultiSheet}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            تصدير التقرير الشامل (Excel)
          </button>
        </div>

        {/* --- قسم فلتر التاريخ --- */}
        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-sm">نطاق التحليل:</span>
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

        {/* --- أزرار التبويبات (Tabs) --- */}
        <div className="flex bg-card p-1 rounded-xl border border-border w-fit shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("financial")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "financial"
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LineChartIcon className="w-4 h-4" /> الأداء المالي
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "categories"
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <PieChartIcon className="w-4 h-4" /> تحليل التصنيفات
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "products"
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <PackageSearch className="w-4 h-4" /> الأجهزة والمنتجات
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "customers"
                ? "bg-primary text-white shadow-md"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="w-4 h-4" /> كبار العملاء
          </button>
        </div>

        {/* --- محتوى التبويبات --- */}
        <div className="mt-6">
          {/* 1. التبويب المالي */}
          {activeTab === "financial" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" /> الإيرادات
                  والأرباح التقديرية
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={financialData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f97316"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(2)} ج.م`,
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="إجمالي الإيرادات"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="صافي الربح التقديري"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 2. تبويب التصنيفات (الجديد) */}
          {activeTab === "categories" && (
            <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-primary">
                  الإيرادات حسب التصنيف
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(2)} ج.م`,
                          "الإيرادات",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-green-600">
                  الأرباح التقديرية حسب التصنيف
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(2)} ج.م`,
                          "الربح التقديري",
                        ]}
                      />
                      <Bar
                        dataKey="profit"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 3. تبويب المنتجات */}
          {activeTab === "products" && (
            <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-6">
                  أعلى 5 منتجات تحقيقاً للإيرادات
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSellingProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(2)} ج.م`,
                          "الإيرادات",
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        barSize={25}
                      >
                        {topSellingProducts.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold mb-6">
                  الأكثر مبيعاً (بالكمية)
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topSellingProducts}
                        dataKey="quantity"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={({ name, percent }) =>
                          `${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {topSellingProducts.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} قطعة`,
                          "الكمية المباعة",
                        ]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 4. تبويب العملاء */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="p-6 border-b bg-muted/30">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" /> أعلى 5 عملاء
                    (التصدير ينزل كل العملاء)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-muted/50 text-sm">
                      <tr>
                        <th className="p-4 font-bold">الترتيب</th>
                        <th className="p-4 font-bold">اسم العميل / المستشفى</th>
                        <th className="p-4 font-bold text-center">
                          عدد الطلبيات
                        </th>
                        <th className="p-4 font-bold text-left">
                          إجمالي المسحوبات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((customer, index) => (
                        <tr
                          key={index}
                          className="border-t border-border hover:bg-muted/10 transition-colors"
                        >
                          <td className="p-4 font-bold text-muted-foreground">
                            #{index + 1}
                          </td>
                          <td className="p-4 font-bold">{customer.name}</td>
                          <td className="p-4 text-center font-mono bg-muted/30 w-32">
                            {customer.orderCount} طلب
                          </td>
                          <td className="p-4 text-left font-black text-primary text-lg">
                            {customer.totalSpent.toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                      {topCustomers.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-muted-foreground"
                          >
                            لا توجد بيانات.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
