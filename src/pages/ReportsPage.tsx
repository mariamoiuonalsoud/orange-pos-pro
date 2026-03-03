import React from 'react';
import { usePOS } from '@/contexts/POSContext';
import POSHeader from '@/components/POSHeader';
import { motion } from 'framer-motion';
import { BarChart3, Receipt, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
  const { sales, products } = usePOS();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const paymentBreakdown = {
    cash: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0),
    card: sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0),
    mobile: sales.filter(s => s.paymentMethod === 'mobile').reduce((sum, s) => sum + s.total, 0),
  };

  const paymentData = [
    { name: 'نقداً', value: paymentBreakdown.cash },
    { name: 'بطاقة', value: paymentBreakdown.card },
    { name: 'إلكتروني', value: paymentBreakdown.mobile },
  ];

  // Top selling from sales
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.id].qty += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> التقارير والإحصائيات
        </h1>

        {sales.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">لا توجد مبيعات مسجلة بعد</p>
            <p className="text-sm text-muted-foreground">قم بإتمام عمليات بيع لرؤية التقارير</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-5 text-center">
                <p className="text-3xl font-bold text-primary">{totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات (ج.م)</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-5 text-center">
                <p className="text-3xl font-bold text-foreground">{sales.length}</p>
                <p className="text-sm text-muted-foreground">عدد العمليات</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border p-5 text-center">
                <p className="text-3xl font-bold text-foreground">{(totalRevenue / sales.length).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">متوسط قيمة البيع (ج.م)</p>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">حسب طريقة الدفع</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(27, 95%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">المنتجات الأكثر مبيعاً</h2>
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.qty} وحدة مباعة</p>
                      </div>
                      <span className="text-primary font-bold">{p.revenue.toFixed(2)} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent sales */}
            <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> آخر العمليات
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-3 text-sm font-semibold text-foreground">رقم الإيصال</th>
                      <th className="text-right p-3 text-sm font-semibold text-foreground">المبلغ</th>
                      <th className="text-right p-3 text-sm font-semibold text-foreground">الدفع</th>
                      <th className="text-right p-3 text-sm font-semibold text-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 20).map(sale => (
                      <tr key={sale.id} className="border-t border-border">
                        <td className="p-3 text-sm font-mono text-foreground">{sale.receiptNumber}</td>
                        <td className="p-3 text-sm font-bold text-primary">{sale.total.toFixed(2)} ج.م</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {sale.paymentMethod === 'cash' ? 'نقداً' : sale.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground" dir="ltr">
                          {new Date(sale.date).toLocaleString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
