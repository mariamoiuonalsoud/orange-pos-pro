import React from "react";
import Barcode from "react-barcode";

interface QuotationProduct {
  id: string;
  name: string;
  price: number;
}

interface QuotationItem {
  quantity: number;
  products: QuotationProduct | null;
}

interface QuotationData {
  receipt_number: string;
  created_at: string;
  discount_amount: number;
  customers: { name: string; phone: string } | null;
  quotation_items: QuotationItem[];
}

interface QuotationReceiptProps {
  quote: QuotationData | null;
}

export const QuotationReceipt = React.forwardRef<
  HTMLDivElement,
  QuotationReceiptProps
>(({ quote }, ref) => {
  if (!quote) return null;

  const subtotal = quote.quotation_items.reduce(
    (sum: number, item: QuotationItem) => {
      const price = item.products?.price || 0;
      return sum + price * item.quantity;
    },
    0,
  );

  const discount = quote.discount_amount || 0;
  const totalAfterDiscount = Math.max(0, subtotal - discount);

  const grandTotal = totalAfterDiscount;

  return (
    <div
      ref={ref}
      className="p-6 text-right text-black bg-white mx-auto quotation-print-area"
      dir="rtl"
      style={{ width: "80mm", fontFamily: "Arial, sans-serif" }}
    >
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <h2 className="text-xl font-bold uppercase tracking-tight">
          Orange Group
        </h2>
        <p className="text-sm font-bold mt-1">عرض سعر تقديري</p>
        <p className="text-[10px] text-gray-500 mt-1">
          (هذا المستند ليس فاتورة بيع ولا يخصم من المخزن)
        </p>
      </div>

      <div className="text-[11px] mb-4 space-y-1">
        <p>
          <strong>رقم العرض:</strong>{" "}
          <span className="font-mono">{quote.receipt_number}</span>
        </p>
        <p>
          <strong>التاريخ:</strong>{" "}
          {new Date(quote.created_at).toLocaleDateString("ar-EG")}
        </p>
        <p>
          <strong>العميل:</strong> {quote.customers?.name || "عميل عام"}
        </p>
        {quote.customers?.phone && (
          <p>
            <strong>الهاتف:</strong> {quote.customers.phone}
          </p>
        )}
      </div>

      <table className="w-full text-[11px] border-b border-black mb-3">
        <thead>
          <tr className="border-b border-black bg-gray-50">
            <th className="text-right py-2 px-1">الصنف</th>
            <th className="text-center py-2 px-1">الكمية</th>
            <th className="text-left py-2 px-1">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {quote.quotation_items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 px-1">
                {item.products?.name || "منتج غير معروف"}
              </td>
              <td className="text-center py-2 px-1">{item.quantity}</td>
              <td className="text-left py-2 px-1">
                {((item.products?.price || 0) * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-[11px] space-y-1.5 px-1">
        <div className="flex justify-between">
          <span>المجموع الفرعي (قبل الخصم):</span>
          <span>{subtotal.toFixed(2)} ج.م</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>قيمة الخصم:</span>
            <span>-{discount.toFixed(2)} ج.م</span>
          </div>
        )}

        <div className="flex justify-between font-bold border-t pt-1 border-gray-200">
          <span>الصافي بعد الخصم:</span>
          <span>{totalAfterDiscount.toFixed(2)} ج.م</span>
        </div>

        <div className="flex justify-between text-[15px] font-black border-t-2 border-double border-black pt-2 mt-2">
          <span>الإجمالي النهائي:</span>
          <span>{grandTotal.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mt-6 border-t pt-4">
        <Barcode
          value={quote.receipt_number}
          width={1.0}
          height={30}
          fontSize={10}
          margin={0}
        />
        <div className="text-center mt-10 text-[9px] ">
          <p className="font-bold">شكراً لثقتكم في أورانج جروب</p>
          <p className="mt-1">العرض ساري لمدة 3 أيام من تاريخ الإصدار</p>
        </div>
      </div>

      {/* الـ CSS الموحد لمنع الفواصل */}
      <style type="text/css" media="print">
        {`
          @page { 
            size: 80mm auto !important; 
            margin: 0 !important; 
          }
          @media print {
            html, body {
              width: 80mm !important; 
              margin: 0 !important;
              padding: 0 !important; 
              height: auto !important;
              overflow: visible !important;
            }
            .quotation-print-area {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              page-break-inside: auto !important;
            }
            tr, td, th {
              page-break-inside: avoid !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </div>
  );
});

QuotationReceipt.displayName = "QuotationReceipt";
