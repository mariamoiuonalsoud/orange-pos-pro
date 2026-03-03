import React from 'react';
import { usePOS } from '@/contexts/POSContext';
import POSHeader from '@/components/POSHeader';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardPage = () => {
  const { sales, products } = usePOS();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.length;
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;
  const lowStockProducts = products.filter(p => p.stock < 15);

  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.category);
    if (existing) existing.value += p.stock;
    else acc.push({ name: p.category, value: p.stock });
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(27, 95%, 55%)', 'hsl(20, 90%, 45%)', 'hsl(35, 90%, 60%)', 'hsl(0, 0%, 20%)', 'hsl(142, 72%, 42%)', 'hsl(0, 84%, 60%)'];

  const stats = [
    { label: 'إجمالي الإيرادات', value: `${totalRevenue.toFixed(2)} ر.س`, icon: DollarSign, color: 'bg-primary' },
    { label: 'عدد المبيعات', value: totalSales.toString(), icon: ShoppingCart, color: 'bg-success' },
    { label: 'متوسط البيع', value: `${avgSale.toFixed(2)} ر.س`, icon: TrendingUp, color: 'bg-accent' },
    { label: 'منتجات منخفضة المخزون', value: lowStockProducts.length.toString(), icon: AlertTriangle, color: 'bg-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">لوحة التحكم</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.color} text-primary-foreground p-2 rounded-lg`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">المبيعات الأخيرة</h2>
            {sales.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">لا توجد مبيعات بعد. قم بإجراء عملية بيع لرؤية البيانات.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sales.slice(0, 10).map((s, i) => ({ name: `#${i + 1}`, total: s.total }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(27, 95%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stock Distribution */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">توزيع المخزون</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low stock alerts */}
        {lowStockProducts.length > 0 && (
          <div className="mt-6 bg-card rounded-xl border border-destructive/30 p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              تنبيهات المخزون المنخفض
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-destructive/5 rounded-lg p-3">
                  <span className="text-2xl">{p.image}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-destructive font-bold">المتبقي: {p.stock} فقط</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
