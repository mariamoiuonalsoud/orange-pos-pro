import React, { useState, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Phone, Search, ShoppingBag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// تعريف نوع بيانات العميل لضمان دقة الكود
interface Customer {
  id: string;
  name: string;
  phone: string;
}

const CustomersPage = () => {
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]); // State لتخزين العملاء من الداتابيز
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State لتخزين إحصائيات كل عميل
  const [customerStats, setCustomerStats] = useState<
    Record<string, { count: number; total: number }>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. جلب بيانات العملاء الأساسية
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .order("name");

        if (customersError) throw customersError;
        setDbCustomers(customersData || []);

        // 2. جلب إحصائيات الطلبات
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("customer_id, total_amount");

        if (ordersError) throw ordersError;

        if (ordersData) {
          const stats: Record<string, { count: number; total: number }> = {};
          ordersData.forEach((order) => {
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
      } catch (error) {
        // بنحول الـ error لنوع Error الحقيقي عشان TypeScript يقدر يقرأ الـ message
        const err = error as Error;
        console.error("Error fetching data:", err.message);
        toast.error("فشل في تحميل بيانات العملاء");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // تصفية البحث بناءً على الـ dbCustomers اللي جبناها من السوبابيس
  const filtered = dbCustomers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)),
  );

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
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
            className="pr-10 h-12 shadow-sm focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">
              جاري تحميل بيانات العملاء...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>لا يوجد عملاء مسجلين حالياً</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((customer, i) => {
              const stats = customerStats[customer.id] || {
                count: 0,
                total: 0,
              };

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                      {customer.name ? customer.name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground line-clamp-1">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{stats.count} طلبات</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-lg text-sm"
                      dir="ltr"
                    >
                      <Phone className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-foreground">
                        {customer.phone}
                      </span>
                    </div>

                    <div className="pt-3 border-t flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-bold">
                        إجمالي المشتريات
                      </span>
                      <span className="text-primary font-bold">
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
