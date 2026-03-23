import React, { forwardRef } from "react";
import Barcode from "react-barcode";
import { useAuth } from "@/contexts/AuthContext";
import { SaleWithCustomer } from "@/contexts/POSContext";

interface ReceiptProps {
  sale: SaleWithCustomer | null;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale }, ref) => {
    const { user } = useAuth();

    if (!sale || !sale.items) return null;

    // الحسابات بناءً على بيانات العملية المخزنة وليس السلة الحالية
    const finalTotal = sale.total || 0;
    const discount = sale.discountAmount || 0;
    const amountAfterDiscount = finalTotal / 1.15;
    const tax = finalTotal - amountAfterDiscount;
    const subtotalBeforeDiscount = amountAfterDiscount + discount;

    return (
      <div
        ref={ref}
        style={{ width: "80mm", backgroundColor: "white" }}
        className="p-4 text-black font-mono text-[12px] leading-tight mx-auto"
        dir="rtl"
      >
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-lg font-bold uppercase tracking-tighter">
            Orange Group
          </h2>
          <p>فرع المقطم - القاهرة</p>
          <p>هاتف: 01107288930</p>
          <p className="mt-1 text-[10px]">
            {new Date(sale.date).toLocaleString("ar-EG")}
          </p>
        </div>

        <div className="mb-2 text-[11px] space-y-0.5 border-b border-dashed border-black/20 pb-2">
          <p>
            رقم الفاتورة:{" "}
            <span className="font-bold">{sale.receiptNumber}</span>
          </p>
          <p>
            الكاشير:{" "}
            <span className="font-bold">{user?.name || "Orange Admin"}</span>
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

        <table className="w-full mb-2 text-[10px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="text-right py-1">الصنف</th>
              <th className="text-center py-1">السعر</th>
              <th className="text-center py-1">الكمية</th>
              <th className="text-left py-1">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-black/20">
            {sale.items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="py-2 max-w-[30mm] break-words">{item.name}</td>
                <td className="text-center py-2">{item.price.toFixed(2)}</td>
                <td className="text-center py-2">x{item.quantity}</td>
                <td className="text-left py-2 font-bold">
                  {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm border-t border-black pt-2 mb-2">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{subtotalBeforeDiscount.toFixed(2)} ج.م</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600 font-bold italic">
              <span>الخصم:</span>
              <span>-{discount.toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-[11px]">
            <span>ضريبة القيمة المضافة (15%):</span>
            <span>{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-black pt-1 mt-1">
            <span>الإجمالي النهائي:</span>
            <span>{finalTotal.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="mb-4 text-[11px]">
          <div className="flex justify-between">
            <span>طريقة الدفع:</span>
            <span className="font-bold">
              {sale.paymentMethod === "cash"
                ? "نقداً"
                : sale.paymentMethod === "card"
                  ? "بطاقة"
                  : "محفظة"}
            </span>
          </div>

          {sale.paymentMethod === "cash" && (
            <div className="bg-gray-100 p-2 mt-1 rounded-sm border border-black/5">
              <div className="flex justify-between">
                <span>المبلغ المدفوع:</span>
                <span>{sale.amountPaid?.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black/10 mt-1 pt-1">
                <span>الباقي:</span>
                <span>{(sale.changeDue || 0).toFixed(2)} ج.م</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <Barcode
            value={sale.receiptNumber}
            width={1.0}
            height={30}
            fontSize={10}
            margin={0}
          />
          <p className="text-center font-bold mt-2 text-[11px]">
            شكراً لزيارتكم! Orange Group
          </p>
        </div>

        <style type="text/css" media="print">
          {` @page { size: 80mm auto; margin: 0 !important; } body { margin: 0 !important; width: 80mm !important; } `}
        </style>
      </div>
    );
  },
);

Receipt.displayName = "Receipt";
