import React from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import { Receipt, CreditCard, Users, Calendar, Banknote } from "lucide-react";

const ReportsPage = () => {
  // ضفنا استدعاء للـ customers من الـ Context
  const { sales, customers } = usePOS();

  // إجمالي المبيعات (كل الفلوس بالضريبة)
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0);

  // إجمالي الدخل (الفلوس بدون الضريبة - كمثال أولي)
  const totalRevenueBase = totalSalesAmount / 1.15;

  return (
    <div className="min-h-screen bg-background">
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

        {/* سجل الفواتير */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" /> مراجعة فواتير المشترين
            </h2>
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
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  // هنا بندور على العميل المرتبط بالفاتورة باستخدام رقم التليفون أو الـ ID
                  // بما إن دالة الجلب عندنا مش بتجيب الـ customer_id صراحة، هنعتمد على الـ customerPhone اللي إنتي كنتي مسجلاه في الـ Interface
                  const customer = customers.find(
                    (c) => c.phone === sale.customerPhone,
                  );

                  // لو لقينا العميل، ناخد اسمه ورقمه، ولو ملقيناهوش نرجع للكلمات الافتراضية
                  const displayCustomerName = customer
                    ? customer.name
                    : sale.customerName || "عميل نقدي";
                  const displayCustomerPhone = customer
                    ? customer.phone
                    : sale.customerPhone || "بدون هاتف";

                  return (
                    <tr
                      key={sale.id}
                      className="border-t border-border hover:bg-muted/10 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-xs">
                        {sale.receiptNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold">{displayCustomerName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {displayCustomerPhone}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
