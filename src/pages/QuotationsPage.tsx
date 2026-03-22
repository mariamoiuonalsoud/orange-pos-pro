import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import {
  FileText,
  Search,
  ArrowRightLeft,
  Clock,
  User,
  Phone,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FullQuotation {
  id: string;
  receipt_number: string;
  total_amount: number;
  discount_amount: number;
  created_at: string;
  customers: { name: string; phone: string } | null;
  quotation_items: {
    quantity: number;
    products: { id: string; name: string; price: number } | null;
  }[];
}

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState<FullQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { addToCart } = usePOS();

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(
          `id, receipt_number, total_amount, discount_amount, created_at, status, customers(name, phone), quotation_items(quantity, products(id, name, price))`,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotations((data as unknown as FullQuotation[]) || []);
    } catch (error) {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleConvert = (quote: FullQuotation) => {
    quote.quotation_items.forEach((item) => {
      if (item.products) {
        // بنمرر بيانات المنتج مع أيقونة ثابتة
        addToCart({
          ...item.products,
          stock: 999,
          barcode: "",
          category: "",
          image: "📦",
        });
      }
    });
    toast.success("تم نقل الأصناف للسلة");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText /> عروض الأسعار
        </h1>
        <div className="grid gap-4">
          {quotations.map((quote) => (
            <div
              key={quote.id}
              className="bg-card p-5 rounded-2xl border border-border shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-blue-600">
                    {quote.receipt_number}
                  </span>
                  <div className="flex gap-4 mt-2 text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> {quote.customers?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" /> {quote.customers?.phone}
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-primary">
                    {quote.total_amount.toFixed(2)} ج.م
                  </p>
                  <button
                    onClick={() => handleConvert(quote)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> تحويل لبيع
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed flex flex-wrap gap-2">
                {quote.quotation_items.map((item, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-muted px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    <Package className="w-3 h-3" /> {item.products?.name} (x
                    {item.quantity})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationsPage;
