import React, { forwardRef } from "react";
import Barcode from "react-barcode";
import { useAuth } from "@/contexts/AuthContext";
import { SaleWithCustomer } from "@/contexts/POSContext";

interface ReceiptProps {
  sale: SaleWithCustomer | null;
  grandTotal: number;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, grandTotal }, ref) => {
    const { user } = useAuth();

    // تأمين الكود في حالة عدم وجود بيانات بيع
    if (!sale) return null;

    return (
      <div
        ref={ref}
        style={{ width: "80mm", backgroundColor: "white" }}
        className="p-4 text-black font-mono text-[12px] leading-tight mx-auto"
        dir="rtl"
      >
        {/* Header الفاتورة */}
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-lg font-bold uppercase">Orange Group</h2>
          <p>فرع المقطم - القاهرة</p>
          <p>هاتف: 01107288930</p>
          <p className="mt-1 text-[10px]">
            {new Date(sale.date).toLocaleString("ar-EG")}
          </p>
        </div>

        {/* بيانات العملية */}
        <div className="mb-2 text-[11px] space-y-0.5">
          <p>
            رقم الفاتورة:{" "}
            <span className="font-bold">{sale.receiptNumber}</span>
          </p>
          <p>
            الكاشير: <span className="font-bold">{user?.name}</span>
          </p>
          <p>
            العميل:{" "}
            <span className="font-bold">
              {sale.customerName || "عميل نقدي"}
            </span>
          </p>
          {sale.customerPhone && (
            <p>
              الهاتف: <span className="font-bold">{sale.customerPhone}</span>
            </p>
          )}
        </div>

        {/* جدول الأصناف */}
        <table className="w-full border-b border-black mb-2 text-[10px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-right py-1">الصنف</th>
              <th className="text-center">كمية</th>
              <th className="text-left">إجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1">{item.name}</td>
                <td className="text-center">x{item.quantity}</td>
                <td className="text-left">
                  {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* الحسابات النهائية */}
        <div className="space-y-1 text-sm border-b border-black pb-2 mb-2">
          <div className="flex justify-between">
            <span>المجموع (قبل الضريبة):</span>
            <span>{(grandTotal / 1.15).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between">
            <span>ضريبة (15%):</span>
            <span>{(grandTotal - grandTotal / 1.15).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-black pt-1">
            <span>الإجمالي النهائي:</span>
            <span>{grandTotal.toFixed(2)} ج.م</span>
          </div>
        </div>

        {/* تفاصيل الدفع والكاش */}
        <div className="mb-4 text-[11px]">
          <div className="flex justify-between italic">
            <span>طريقة الدفع:</span>
            <span>
              {sale.paymentMethod === "cash"
                ? "نقداً"
                : sale.paymentMethod === "card"
                  ? "بطاقة"
                  : "محفظة"}
            </span>
          </div>

          {sale.paymentMethod === "cash" && (
            <div className="bg-gray-50 p-1 mt-1 border border-dashed border-gray-300">
              <div className="flex justify-between">
                <span>المبلغ المدفوع:</span>
                <span>{sale.amountPaid?.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black/10 mt-1">
                <span>الباقي للعميل:</span>
                <span>{sale.changeDue?.toFixed(2)} ج.م</span>
              </div>
            </div>
          )}
        </div>

        {/* باركود الفاتورة */}
        <div className="flex flex-col items-center gap-1">
          <Barcode
            value={sale.receiptNumber}
            width={1.0} // تقليل العرض قليلاً ليناسب الـ 80mm باريحية
            height={35}
            fontSize={10}
            margin={0}
          />
          <p className="text-center font-bold mt-2 text-[11px]">
            شكراً لزيارتكم!
          </p>
        </div>

        {/* ستايل الطباعة القوي لإجبار المقاس */}
        <style type="text/css" media="print">
          {`
          @page { 
            size: 80mm auto; 
            margin: 0 !important; 
          }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 80mm !important;
          }
          @media print {
            .no-print { display: none; }
          }
        `}
        </style>
      </div>
    );
  },
);

Receipt.displayName = "Receipt";
