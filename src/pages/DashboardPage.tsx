import React from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import { Package, AlertTriangle, BarChart3, Boxes } from "lucide-react";
import {
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

const DashboardPage = () => {
  const { products } = usePOS();

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 10);
  const lowStockCount = lowStockProducts.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0,
  );

  // مصفوفة الألوان للـ Pie Chart
  const COLORS = ["#ef4444", "#f97316", "#facc15", "#3b82f6", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-background pb-10">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> لوحة تحكم المخزون
        </h1>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-xl border border-border text-center shadow-sm">
            <Boxes className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              أنواع المنتجات
            </p>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              منتجات ناقصة
            </p>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border text-center shadow-sm">
            <Package className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {totalStockValue.toFixed(2)} ج.م
            </p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              قيمة المخزن
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart للمنتجات اللي قربت تخلص */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" /> توزيع النواقص (أقل من 10
              قطع)
            </h2>
            <div className="h-[300px]">
              {lowStockCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lowStockProducts}
                      dataKey="stock"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, stock }) => `${name}: ${stock}`}
                    >
                      {lowStockProducts.map((_, index) => (
                        /* التصحيح هنا: استخدام COLORS.length */
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">
                  لا توجد نواقص في المخزن حالياً ✅
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart للكميات العامة */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold mb-6">
              نظرة عامة على أعلى الكميات
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products.slice(0, 10)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Bar
                    dataKey="stock"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
