import React, { useState } from 'react';
import POSHeader from '@/components/POSHeader';
import { DEMO_CUSTOMERS } from '@/data/pos-data';
import { motion } from 'framer-motion';
import { Users, Star, Phone, Mail, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CustomersPage = () => {
  const [customers] = useState(DEMO_CUSTOMERS);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => c.name.includes(search) || c.phone.includes(search));

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> إدارة العملاء
        </h1>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input placeholder="البحث بالاسم أو رقم الهاتف..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-12" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{customer.name[0]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Star className="w-3 h-3" />
                    <span>{customer.loyaltyPoints} نقطة</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground">
                    إجمالي المشتريات: <span className="text-primary font-bold">{customer.totalPurchases.toFixed(2)} ر.س</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
