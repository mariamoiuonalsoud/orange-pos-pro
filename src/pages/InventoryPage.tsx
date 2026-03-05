import React, { useState, useRef, useEffect } from "react";
import { usePOS } from "@/contexts/POSContext";
import POSHeader from "@/components/POSHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Save, Package, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/pos-data";
import type { Product } from "@/data/pos-data";
import { useReactToPrint } from "react-to-print";
import { BarcodeSticker } from "@/components/BarcodeSticker";

const InventoryPage = () => {
  const { products, updateProduct, addProduct, deleteProduct } = usePOS();
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "medical",
    stock: "",
    image: "📦",
  });

  // States للطباعة
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter((p) => p.name.includes(search));

  // إعداد دالة الطباعة
  const handlePrintBarcode = useReactToPrint({
    contentRef: stickerRef,
    documentTitle: printingProduct
      ? `barcode-${printingProduct.id}`
      : "barcode",
    onAfterPrint: () => setPrintingProduct(null), // تصفير الاختيار بعد الطباعة
  });

  // تشغيل الطباعة تلقائياً بمجرد اختيار منتج للطباعة
  useEffect(() => {
    if (printingProduct && stickerRef.current) {
      handlePrintBarcode();
    }
  }, [printingProduct, handlePrintBarcode]);

  const handleAdd = () => {
    if (!form.name || !form.price || !form.stock) return;

    // إنشاء باركود عشوائي مكون من 12 رقم لو المنتج ملوش باركود
    const generatedBarcode = Math.floor(
      100000000000 + Math.random() * 900000000000,
    ).toString();

    addProduct({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      stock: parseInt(form.stock),
      image: form.image,
      barcode: generatedBarcode,
    });

    setForm({
      name: "",
      price: "",
      category: "medical",
      stock: "",
      image: "📦",
    });
    setAdding(false);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateProduct(editing);
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> إدارة المخزون
          </h1>
          <Button
            onClick={() => setAdding(true)}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            <Plus className="w-4 h-4 ml-2" /> إضافة منتج
          </Button>
        </div>

        <Input
          placeholder="البحث في المنتجات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 h-12"
        />

        {/* نموذج الإضافة */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4 mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">إضافة منتج جديد</h3>
                <button onClick={() => setAdding(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  placeholder="اسم المنتج"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  placeholder="السعر"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  placeholder="الكمية"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleAdd}
                className="mt-3 bg-primary text-primary-foreground hover:bg-accent"
              >
                <Save className="w-4 h-4 ml-2" /> حفظ
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* جدول المنتجات */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    المنتج
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    الفئة
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    السعر
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    المخزون
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <motion.tr
                    key={product.id}
                    layout
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      {editing?.id === product.id ? (
                        <Input
                          value={editing.name}
                          onChange={(e) =>
                            setEditing({ ...editing, name: e.target.value })
                          }
                          className="h-8"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{product.image}</span>
                          <span className="text-sm font-medium text-foreground">
                            {product.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {CATEGORIES.find((c) => c.id === product.category)?.name}
                    </td>
                    <td className="p-3">
                      {editing?.id === product.id ? (
                        <Input
                          type="number"
                          value={editing.price}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-24"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {product.price.toFixed(2)} ج.م
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editing?.id === product.id ? (
                        <Input
                          type="number"
                          value={editing.stock}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              stock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20"
                        />
                      ) : (
                        <span
                          className={`text-sm font-bold ${product.stock < 15 ? "text-destructive" : "text-foreground"}`}
                        >
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {editing?.id === product.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              className="h-7 bg-success text-success-foreground"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditing(null)}
                              className="h-7"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* زرار طباعة الباركود الجديد */}
                            <button
                              onClick={() => setPrintingProduct(product)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500"
                              title="طباعة الباركود"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditing(product)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* منطقة الطباعة المخفية */}
      <div style={{ display: "none" }}>
        {printingProduct && (
          <BarcodeSticker
            ref={stickerRef}
            productName={printingProduct.name}
            price={printingProduct.price}
            barcodeValue={printingProduct.barcode || printingProduct.id}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
