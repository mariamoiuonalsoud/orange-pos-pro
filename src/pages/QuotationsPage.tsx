import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { usePOS, QuotationItemDB } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import {
  FileText,
  ArrowRightLeft,
  User,
  Phone,
  Printer,
  Trash2,
  Search,
  Barcode,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { QuotationReceipt } from "@/components/QuotationReceipt";
import { motion, AnimatePresence } from "framer-motion";

interface FullQuotation {
  id: string;
  receipt_number: string;
  total_amount: number;
  discount_amount: number;
  created_at: string;
  customers: { name: string; phone: string } | null;
  quotation_items: QuotationItemDB[];
}

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState<FullQuotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<FullQuotation | null>(
    null,
  );

  // حالات مودال الحذف
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

  const { loadQuotationToCart, deleteQuotation } = usePOS();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const fetchQuotes = async () => {
    // التأكد من جلب بيانات العملاء بشكل صحيح من جدول الـ customers
    const { data, error } = await supabase
      .from("quotations")
      .select(
        `
        *,
        customers (
          name,
          phone
        ),
        quotation_items (
          quantity,
          products (*)
        )
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب البيانات");
      return;
    }
    if (data) setQuotations(data as unknown as FullQuotation[]);
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const filtered = quotations.filter(
    (q) =>
      q.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customers?.name?.includes(searchTerm) ||
      q.customers?.phone?.includes(searchTerm),
  );

  const handleConvert = (quote: FullQuotation) => {
    loadQuotationToCart(
      quote.quotation_items,
      quote.customers?.name || "عميل",
      quote.customers?.phone || "",
      quote.discount_amount,
    );
    toast.success("تم تجهيز بيانات العميل والخصم.. جاري التحويل");
    setTimeout(() => navigate("/pos"), 500);
  };

  const confirmDelete = async () => {
    if (quoteToDelete) {
      const success = await deleteQuotation(quoteToDelete);
      if (success) {
        toast.success("تم حذف عرض السعر بنجاح");
        fetchQuotes();
      }
      setIsDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10 text-right" dir="rtl">
      <POSHeader />

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" /> عروض الأسعار القائمة
          </h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="بحث برقم العرض أو اسم العميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-11 rounded-xl border-primary/20 focus:border-primary shadow-sm"
              autoFocus
            />
            <Barcode className="absolute left-3 top-3 h-5 w-5 text-primary/30" />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.length > 0 ? (
            filtered.map((quote) => (
              <div
                key={quote.id}
                className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">
                      {quote.receipt_number}
                    </span>
                  </div>

                  {/* قسم بيانات العميل المعدل */}
                  <div className="flex flex-wrap gap-6 mt-3 font-bold">
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                      <User size={18} className="text-primary" />
                      <span className="text-sm text-foreground">
                        {quote.customers?.name || "عميل غير مسجل"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                      <Phone size={18} className="text-primary" />
                      <span className="text-sm text-foreground font-mono">
                        {quote.customers?.phone || "بدون رقم موبايل"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-bold mb-0.5">
                      إجمالي العرض
                    </p>
                    <p className="text-xl font-black text-primary">
                      {quote.total_amount.toFixed(2)}{" "}
                      <span className="text-xs">ج.م</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setQuoteToDelete(quote.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={20} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedQuote(quote);
                        setTimeout(() => handlePrint(), 200);
                      }}
                      className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      title="طباعة"
                    >
                      <Printer size={20} />
                    </button>

                    <button
                      onClick={() => handleConvert(quote)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                      <ArrowRightLeft size={18} /> تحويل للبيع
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
              <FileText
                size={48}
                className="mx-auto text-muted-foreground mb-4 opacity-20"
              />
              <p className="text-muted-foreground font-bold">
                لا توجد عروض أسعار حالياً
              </p>
            </div>
          )}
        </div>
      </div>

      {/* مودال الحذف الاحترافي */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 relative">
                    <Trash2 size={32} />
                    <AlertTriangle
                      size={16}
                      className="absolute -bottom-1 -right-1 fill-red-600 text-white"
                    />
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 text-foreground">
                  تأكيد حذف العرض
                </h3>
                <p className="text-muted-foreground font-bold text-sm leading-relaxed px-4">
                  هل أنت متأكد من رغبتك في حذف عرض السعر؟ <br />
                  <span className="text-red-500 text-xs mt-2 block">
                    هذا الإجراء لا يمكن التراجع عنه.
                  </span>
                </p>
              </div>

              <div className="flex gap-3 p-6 bg-muted/30 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 h-12 rounded-2xl font-bold text-gray-600"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف نهائياً
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="hidden">
        {selectedQuote && (
          <QuotationReceipt ref={printRef} quote={selectedQuote} />
        )}
      </div>
    </div>
  );
};

export default QuotationsPage;
