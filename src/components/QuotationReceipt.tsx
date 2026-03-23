import React from "react";
import Barcode from "react-barcode"; // --- تعريف الأنواع (Interfaces) لتجنب الـ any ---
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

  // --- الحسابات المالية بدقة ---
  const subtotal = quote.quotation_items.reduce(
    (sum: number, item: QuotationItem) => {
      const price = item.products?.price || 0;
      return sum + price * item.quantity;
    },
    0,
  );

  const discount = quote.discount_amount || 0;
  const totalAfterDiscount = Math.max(0, subtotal - discount); // التأكد من عدم وجود قيم سالبة
  const vat = totalAfterDiscount * 0.15; // القيمة المضافة 15%
  const grandTotal = totalAfterDiscount + vat;

  return (
    <div
      ref={ref}
      className="p-6 text-right text-black bg-white"
      dir="rtl"
      style={{ width: "80mm", fontFamily: "Arial, sans-serif" }}
    >
      {/* الهيدر */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <h2 className="text-xl font-bold uppercase tracking-tight">
          Orange Group
        </h2>
        <p className="text-sm font-bold mt-1">عرض سعر تقديري</p>
        <p className="text-[10px] text-gray-500 mt-1">
          (هذا المستند ليس فاتورة بيع ولا يخصم من المخزن)
        </p>
      </div>

      {/* بيانات العرض */}
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

      {/* جدول الأصناف */}
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

      {/* الحسابات النهائية */}
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

        <div className="flex justify-between text-blue-700">
          <span>القيمة المضافة (15%):</span>
          <span>{vat.toFixed(2)} ج.م</span>
        </div>

        <div className="flex justify-between text-[15px] font-black border-t-2 border-double border-black pt-2 mt-2">
          <span>الإجمالي النهائي:</span>
          <span>{grandTotal.toFixed(2)} ج.م</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center mt-6 border-t pt-4">
        <Barcode
          value={quote.receipt_number} // أو رابط موقعك + الرقم
          width={1.0}
          height={30}
          fontSize={10}
          margin={0}
        />
      </div>
      {/* الفوتر */}
      <div className="text-center mt-10 text-[9px] border-t border-gray-200 pt-4">
        <p className="font-bold">شكراً لثقتكم في أورانج جروب</p>
        <p className="mt-1">العرض ساري لمدة 3 أيام من تاريخ الإصدار</p>
      </div>
    </div>
  );
});

QuotationReceipt.displayName = "QuotationReceipt";
