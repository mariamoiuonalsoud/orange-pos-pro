import React, { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import {
  Package,
  AlertTriangle,
  BarChart3,
  Boxes,
  Download,
  Zap, // أيقونة التنبيه الذكي
  Snail, // أيقونة بطيء الحركة
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const DashboardPage = () => {
  const { products, sales } = usePOS();

  // ==========================================
  // خوارزمية تحليل المخزون الذكي (مبنية على آخر 30 يوم)
  // ==========================================
  const inventoryMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return products.map((p) => {
      let soldLast30Days = 0;

      // حساب ما تم بيعه من هذا المنتج في آخر 30 يوم
      sales
        .filter((s) => new Date(s.date) >= thirtyDaysAgo)
        .forEach((s) => {
          const item = s.items.find((i) => i.id === p.id);
          if (item)
            soldLast30Days += item.quantity - (item.returned_quantity || 0);
        });

      // معدل السحب اليومي
      const runRate = soldLast30Days / 30;
      // الأيام المتبقية حتى نفاذ الكمية
      const daysToStockout = runRate > 0 ? p.stock / runRate : Infinity;

      return { ...p, soldLast30Days, runRate, daysToStockout };
    });
  }, [products, sales]);

  // 1. التنبيهات الذكية (هتخلص خلال أقل من 7 أيام، أو رصيدها الفعلي أقل من 3)
  const smartLowStock = inventoryMetrics
    .filter(
      (p) =>
        (p.daysToStockout <= 7 && p.runRate > 0 && p.stock > 0) ||
        (p.stock > 0 && p.stock <= 3),
    )
    .sort((a, b) => a.daysToStockout - b.daysToStockout);

  // 2. المنتجات بطيئة الحركة (رصيدها كبير ومفيش سحب عليها في آخر شهر)
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
      "كود المنتج (الباركود)": p.barcode || "-",
      "اسم المنتج": p.name,
      التصنيف: p.category || "-",
      "سعر الوحدة (ج.م)": p.price,
      "الكمية المتاحة": p.stock,
      "معدل السحب اليومي": p.runRate.toFixed(2),
      "أيام حتى النفاذ":
        p.daysToStockout === Infinity
          ? "+30 يوم"
          : `${Math.ceil(p.daysToStockout)} أيام`,
      "إجمالي القيمة (ج.م)": p.price * p.stock,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, ws, "التحليل الذكي للمخزون");
    XLSX.writeFile(
      wb,
      `Orange_Smart_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success("تم تصدير تقرير المخزون بنجاح");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
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
            <Download className="w-5 h-5" /> تصدير حالة المخزون Excel
          </button>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
            <Boxes className="w-8 h-8 mb-3 text-blue-500" />
            <p className="text-3xl font-black">{totalProducts}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold mt-1">
              إجمالي أنواع المنتجات
            </p>
          </div>
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-center items-center text-center">
            <Zap className="w-8 h-8 mb-3 text-orange-500" />
            <p className="text-3xl font-black text-orange-600">
              {smartLowStock.length}
            </p>
            <p className="text-xs text-orange-600/80 uppercase font-bold mt-1">
              منتجات على وشك النفاذ (تنبيه ذكي)
            </p>
          </div>
          <div className="bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm flex flex-col justify-center items-center text-center">
            <Snail className="w-8 h-8 mb-3 text-red-500" />
            <p className="text-3xl font-black text-red-700">
              {slowMoving.length}
            </p>
            <p className="text-xs text-red-700/80 uppercase font-bold mt-1">
              منتجات بطيئة الحركة (مخزون راكد)
            </p>
          </div>
        </div>

        {/* الجداول التفصيلية */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* جدول التنبيهات الذكية */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-orange-50/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-orange-600">
                <Zap className="w-5 h-5" /> مطلوب طلبها فوراً (الأعلى سحباً)
              </h2>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold">المنتج</th>
                    <th className="p-3 font-bold text-center">متبقي</th>
                    <th className="p-3 font-bold text-center">يكفي لـ</th>
                  </tr>
                </thead>
                <tbody>
                  {smartLowStock.length > 0 ? (
                    smartLowStock.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3 font-bold">{p.name}</td>
                        <td className="p-3 text-center text-red-600 font-black">
                          {p.stock}
                        </td>
                        <td className="p-3 text-center font-bold text-orange-500">
                          {p.daysToStockout === Infinity
                            ? "غير محدد"
                            : `${Math.ceil(p.daysToStockout)} يوم`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground"
                      >
                        لا توجد نواقص حرجة حالياً ✅
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* جدول المنتجات الراكدة */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-red-50/50">
              <h2 className="text-lg font-bold flex items-center gap-2 text-red-600">
                <Snail className="w-5 h-5" /> بضاعة راكدة (آخر 30 يوم)
              </h2>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold">المنتج</th>
                    <th className="p-3 font-bold text-center">
                      الرصيد المجمّد
                    </th>
                    <th className="p-3 font-bold text-center">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMoving.length > 0 ? (
                    slowMoving.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3 font-bold">{p.name}</td>
                        <td className="p-3 text-center text-red-600 font-black">
                          {p.stock} قطعة
                        </td>
                        <td className="p-3 text-center font-bold">
                          {(p.stock * p.price).toFixed(2)} ج.م
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground"
                      >
                        حركة المخزون ممتازة ✅
                      </td>
                    </tr>
                  )}
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
