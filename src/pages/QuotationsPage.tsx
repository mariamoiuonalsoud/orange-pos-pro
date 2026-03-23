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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { QuotationReceipt } from "@/components/QuotationReceipt";

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
  const { loadQuotationToCart, deleteQuotation } = usePOS();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from("quotations")
      .select(
        `*, customers(name, phone), quotation_items(quantity, products(*))`,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
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

  return (
    <div className="min-h-screen bg-background pb-10 text-right" dir="rtl">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText /> عروض الأسعار
          </h1>
          <div className="relative w-96">
            <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-11"
              autoFocus
            />
            <Barcode className="absolute left-3 top-3 h-5 w-5 text-primary/30" />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((quote) => (
            <div
              key={quote.id}
              className="bg-card p-5 rounded-2xl border border-border shadow-sm flex justify-between items-center"
            >
              <div>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                  {quote.receipt_number}
                </span>
                <div className="flex gap-4 mt-2 font-bold text-gray-700">
                  <span className="flex items-center gap-1">
                    <User size={16} className="text-primary" />{" "}
                    {quote.customers?.name || "---"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={16} className="text-primary" />{" "}
                    {quote.customers?.phone || "---"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-left ml-4">
                  <p className="text-xl font-black text-primary">
                    {quote.total_amount.toFixed(2)} ج.م
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (confirm("حذف؟")) {
                        await deleteQuotation(quote.id);
                        fetchQuotes();
                      }
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuote(quote);
                      setTimeout(() => handlePrint(), 200);
                    }}
                    className="p-2 bg-gray-100 rounded-xl"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    onClick={() => handleConvert(quote)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
                  >
                    <ArrowRightLeft size={18} /> تحويل للبيع
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden">
        <QuotationReceipt ref={printRef} quote={selectedQuote} />
      </div>
    </div>
  );
};

export default QuotationsPage;
