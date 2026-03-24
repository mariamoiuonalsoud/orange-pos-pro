import React, { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import {
  Package,
  AlertTriangle,
  BarChart3,
  Boxes,
  Download,
  Zap,
  Snail,
  AlertCircle, // أيقونة إضافية للمنتجات المنتهية تماماً
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const DashboardPage = () => {
  const { products, sales } = usePOS();

  // ==========================================
  // خوارزمية تحليل المخزون الذكي
  // ==========================================
  const inventoryMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return products.map((p) => {
      let soldLast30Days = 0;

      // حساب المبيعات
      sales
        .filter((s) => new Date(s.date) >= thirtyDaysAgo)
        .forEach((s) => {
          const item = s.items.find((i) => i.id === p.id);
          if (item)
            soldLast30Days += item.quantity - (item.returned_quantity || 0);
        });

      const runRate = soldLast30Days / 30;
      const daysToStockout = runRate > 0 ? p.stock / runRate : Infinity;

      return { ...p, soldLast30Days, runRate, daysToStockout };
    });
  }, [products, sales]);

  // --- التعديل الجوهري هنا ---
  // 1. التنبيهات الذكية: تشمل (الرصيد صفر) أو (أقل من 3 قطع) أو (سيخلص خلال أسبوع)
  const smartLowStock = inventoryMetrics
    .filter(
      (p) =>
        p.stock <= 5 || // ده هيضمن ظهور أي منتج رصيده 5 أو أقل سواء عليه حركة أو لأ
        (p.daysToStockout <= 7 && p.runRate > 0),
    )
    .sort((a, b) => a.stock - b.stock);

  // 2. المنتجات بطيئة الحركة
  const slowMoving = inventoryMetrics
    .filter((p) => p.stock >= 5 && p.soldLast30Days === 0)
    .sort((a, b) => b.stock - a.stock);

  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0,
  );

  const exportInventoryToExcel = () => {
    if (products.length === 0) {
      toast.error("لا توجد منتجات لتصديرها");
      return;
    }
    const inventoryData = inventoryMetrics.map((p) => ({
      الباركود: p.barcode || "-",
      "اسم المنتج": p.name,
      "الكمية المتاحة": p.stock,
      الحالة: p.stock === 0 ? "منتهي" : p.stock <= 3 ? "حرج" : "متاح",
      "أيام حتى النفاذ":
        p.daysToStockout === Infinity
          ? "+30 يوم"
          : `${Math.ceil(p.daysToStockout)} أيام`,
      "إجمالي القيمة": p.price * p.stock,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(
      wb,
      `Inventory_Report_${new Date().toLocaleDateString()}.xlsx`,
    );
    toast.success("تم تصدير التقرير");
  };

  return (
    <div className="min-h-screen bg-background pb-10 text-right" dir="rtl">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> لوحة تحكم المخزون
            الذكية
          </h1>
          <button
            onClick={exportInventoryToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" /> تصدير Excel
          </button>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col items-center">
            <Boxes className="w-8 h-8 mb-2 text-blue-500" />
            <p className="text-3xl font-black">{totalProducts}</p>
            <p className="text-xs text-muted-foreground font-bold">
              إجمالي أنواع المنتجات
            </p>
          </div>

          {/* كارت التنبيه الذكي المعدل */}
          <div
            className={`p-5 rounded-xl border shadow-sm flex flex-col items-center ${smartLowStock.some((p) => p.stock === 0) ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}
          >
            <Zap
              className={`w-8 h-8 mb-2 ${smartLowStock.some((p) => p.stock === 0) ? "text-red-600" : "text-orange-500"}`}
            />
            <p
              className={`text-3xl font-black ${smartLowStock.some((p) => p.stock === 0) ? "text-red-700" : "text-orange-600"}`}
            >
              {smartLowStock.length}
            </p>
            <p className="text-xs font-bold opacity-80 uppercase">
              نواقص تحتاج طلب فوري
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <Snail className="w-8 h-8 mb-2 text-slate-500" />
            <p className="text-3xl font-black text-slate-700">
              {slowMoving.length}
            </p>
            <p className="text-xs text-slate-600 font-bold">
              منتجات بطيئة الحركة
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* جدول النواقص المحدث */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h2 className="text-lg font-bold flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" /> قائمة النواقص والمنتهيات
              </h2>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold">المنتج</th>
                    <th className="p-3 font-bold text-center">المتوفر</th>
                    <th className="p-3 font-bold text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {smartLowStock.length > 0 ? (
                    smartLowStock.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-bold">{p.name}</td>
                        <td
                          className={`p-3 text-center font-black ${p.stock === 0 ? "text-red-600 animate-pulse" : "text-orange-600"}`}
                        >
                          {p.stock}
                        </td>
                        <td className="p-3 text-center">
                          {p.stock === 0 ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold">
                              نفذت الكمية
                            </span>
                          ) : (
                            <span className="text-orange-500 font-bold">
                              يكفي لـ{" "}
                              {p.daysToStockout === Infinity
                                ? "?"
                                : Math.ceil(p.daysToStockout)}{" "}
                              يوم
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground"
                      >
                        كل شيء متوفر ✅
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* المنتجات الراكدة */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                <Snail className="w-5 h-5" /> بضاعة مجمّدة (لم تُبع منذ شهر)
              </h2>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px]">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold">المنتج</th>
                    <th className="p-3 font-bold text-center">الرصيد</th>
                    <th className="p-3 font-bold text-center">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMoving.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 font-bold">{p.name}</td>
                      <td className="p-3 text-center text-slate-600 font-bold">
                        {p.stock} قطعة
                      </td>
                      <td className="p-3 text-center font-bold">
                        {(p.stock * p.price).toFixed(2)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
