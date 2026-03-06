import React, { useState } from "react";
import { usePOS } from "@/contexts/POSContext"; // ربطنا بالبيانات الحقيقية
import POSHeader from "@/components/POSHeader";
import { motion } from "framer-motion";
import { Users, Star, Phone, Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";

const CustomersPage = () => {
  const { customers, sales } = usePOS(); // بنجيب العملاء والمبيعات من الـ Context
  const [search, setSearch] = useState("");

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
              // حساب إجمالي المشتريات وعدد الطلبات الحقيقي من المبيعات
              const customerSales = sales.filter(
                (s) => s.customerPhone === customer.phone,
              );
              const totalSpent = customerSales.reduce(
                (sum, s) => sum + s.total,
                0,
              );

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-bold text-lg">
                      {customer.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{customerSales.length} طلبات ناجحة</span>
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
                        {totalSpent.toFixed(2)} ج.م
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
