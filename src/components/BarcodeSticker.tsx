import React, { forwardRef } from "react";
import Barcode from "react-barcode";

interface BarcodeStickerProps {
  productName: string;
  price: number;
  barcodeValue: string;
}

export const BarcodeSticker = forwardRef<HTMLDivElement, BarcodeStickerProps>(
  ({ productName, price, barcodeValue }, ref) => {
    return (
      <div ref={ref}>
        {/* الكود ده بيدي أمر للمتصفح يخلي مقاس ورقة الطباعة قد الاستيكر بالظبط */}
        <style type="text/css" media="print">
          {`
            @page {
              size: 50mm 25mm; /* ده مقاس الاستيكر العرض 5 سم والطول 2.5 سم */
              margin: 0;
            }
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          `}
        </style>

        <div
          className="flex flex-col items-center justify-center bg-white text-black w-full h-full"
          style={{ width: "50mm", height: "25mm", overflow: "hidden" }}
        >
          <span
            className="text-[10px] font-bold truncate w-full text-center mb-1"
            dir="rtl"
          >
            {productName}
          </span>

          <Barcode
            value={barcodeValue}
            width={1.2}
            height={30}
            fontSize={10}
            margin={0}
            displayValue={true}
          />

          <span className="text-[10px] font-bold mt-1">
            {price.toFixed(2)} EGP
          </span>
        </div>
      </div>
    );
  },
);

BarcodeSticker.displayName = "BarcodeSticker";
