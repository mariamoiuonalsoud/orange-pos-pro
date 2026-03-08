import React, { useState, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import { motion } from "framer-motion";
import { Users, Phone, Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase"; // ضفنا سطر الاتصال بقاعدة البيانات

const CustomersPage = () => {
  const { customers } = usePOS();
  const [search, setSearch] = useState("");

  // State جديد عشان نخزن فيه إحصائيات كل عميل (عدد الطلبات والمجموع)
  const [customerStats, setCustomerStats] = useState<
    Record<string, { count: number; total: number }>
  >({});

  // أول ما الصفحة تفتح، بنجيب كل الفواتير ونحسب لكل عميل طلباته
  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_id, total_amount");

      if (data && !error) {
        const stats: Record<string, { count: number; total: number }> = {};
        data.forEach((order) => {
          if (order.customer_id) {
            if (!stats[order.customer_id]) {
              stats[order.customer_id] = { count: 0, total: 0 };
            }
            stats[order.customer_id].count += 1;
            stats[order.customer_id].total += Number(order.total_amount || 0);
          }
        });
        setCustomerStats(stats);
      }
    };

    fetchStats();
  }, []);

  const filtered = customers.filter(
    (c) => c.name.includes(search) || c.phone.includes(search),
  );

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> إدارة العملاء
        </h1>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-12 shadow-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>لا يوجد عملاء مسجلين بهذا الاسم أو الرقم</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((customer, i) => {
              // بنجيب إحصائيات العميل من الـ State، ولو لسه شاري أول مرة بنخليها 0
              const stats = customerStats[customer.id] || {
                count: 0,
                total: 0,
              };

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-bold text-lg uppercase">
                      {customer.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{stats.count} طلبات ناجحة</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div
                      className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg"
                      dir="ltr"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {customer.phone}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        إجمالي المشتريات
                      </span>
                      <span className="text-primary font-bold text-base">
                        {stats.total.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
