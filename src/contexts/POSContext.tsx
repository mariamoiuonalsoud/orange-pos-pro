import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { CartItem, Product, Sale } from "@/data/pos-data";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// --- الواجهات (Interfaces) ---
export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface SaleItem extends CartItem {
  returned_quantity?: number;
  order_item_id?: string;
}

export interface SaleWithCustomer extends Omit<Sale, "items"> {
  customerPhone?: string;
  customerName?: string;
  amountPaid?: number;
  changeDue?: number;
  discountAmount?: number;
  vatAmount?: number; // مضافة للتقارير
  status?: "completed" | "partially_refunded" | "refunded";
  items: SaleItem[];
}

export interface QuotationItemDB {
  quantity: number;
  products: Product | null;
}

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  customers: Customer[];
  sales: SaleWithCustomer[]; // البيانات اللي بتغذي التقارير والـ Dashboard
  cartTotal: number;
  cartCount: number;
  cartDiscount: number;
  setCartDiscount: (val: number) => void;
  tempCustomer: { name: string; phone: string };
  setTempCustomer: (val: { name: string; phone: string }) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  findCustomerByPhone: (phone: string) => Customer | undefined;
  completeSale: (
    paymentMethod: "cash" | "card" | "mobile",
    cashierId: string,
    customerPhone: string,
    customerName: string,
    amountPaid?: number,
    changeDue?: number,
    discountAmount?: number,
  ) => Promise<SaleWithCustomer | null>;
  saveQuotation: (
    cashierId: string,
    customerPhone: string,
    customerName: string,
    discountAmount: number,
  ) => Promise<boolean>;
  deleteQuotation: (id: string) => Promise<boolean>;
  loadQuotationToCart: (
    quoteItems: QuotationItemDB[],
    name: string,
    phone: string,
    discount: number,
  ) => void;
  updateProduct: (product: Product) => Promise<boolean>;
  addProduct: (product: Omit<Product, "id">) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  fetchInitialData: () => Promise<void>;
}

const POSContext = createContext<POSContextType | null>(null);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [tempCustomer, setTempCustomer] = useState({ name: "", phone: "" });

  // --- 1. جلب البيانات الأساسية (تعديل لضمان ظهور التقارير) ---
  const fetchInitialData = useCallback(async () => {
    try {
      // جلب المنتجات والعملاء
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (prods) setProducts(prods as Product[]);

      const { data: custs } = await supabase.from("customers").select("*");
      if (custs) setCustomers(custs as Customer[]);

      // جلب الطلبات والأصناف للتقارير والـ Dashboard
      const { data: ords, error: ordError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: items, error: itemError } = await supabase
        .from("order_items")
        .select("*");

      if (ordError || itemError) throw new Error("خطأ في جلب بيانات المبيعات");

      if (ords && items) {
        const formatted: SaleWithCustomer[] = ords.map((o) => {
          const customer = custs?.find((c) => c.id === o.customer_id);
          return {
            id: o.id,
            receiptNumber: o.receipt_number,
            total: o.total_amount,
            vatAmount: o.vat_amount || 0,
            date: o.created_at,
            paymentMethod:
              (o.payment_method as "cash" | "card" | "mobile") || "cash",
            cashierId: o.cashier_id,
            amountPaid: o.amount_paid || 0,
            changeDue: o.change_due || 0,
            discountAmount: o.discount_amount || 0,
            customerName: customer?.name || "عميل عام",
            customerPhone: customer?.phone || "---",
            status:
              (o.status as "completed" | "partially_refunded" | "refunded") ||
              "completed",
            items: items
              .filter((i) => i.order_id === o.id)
              .map((i) => ({
                id: i.product_id,
                name: prods?.find((p) => p.id === i.product_id)?.name || "منتج",
                price: i.unit_price,
                quantity: i.quantity,
                stock: 0,
                category: "",
                barcode: "",
                image: "",
              })),
          };
        });
        setSales(formatted); // هنا بنغذي الداتا للـ Dashboard
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- 2. التحكم في السلة والتحويل ---
  const clearCart = useCallback(() => {
    setCart([]);
    setTempCustomer({ name: "", phone: "" });
    setCartDiscount(0);
  }, []);

  const loadQuotationToCart = useCallback(
    (
      quoteItems: QuotationItemDB[],
      name: string,
      phone: string,
      discount: number,
    ) => {
      setCart([]);
      const items: CartItem[] = quoteItems
        .filter((i) => i.products !== null)
        .map((i) => ({ ...i.products!, quantity: i.quantity }));
      setCart(items);
      setTempCustomer({ name, phone });
      setCartDiscount(discount);
    },
    [],
  );

  const addToCart = useCallback(
    (p: Product) => {
      const existing = cart.find((i) => i.id === p.id);
      if (existing && existing.quantity >= p.stock) {
        toast.error(`المخزون غير كافٍ. المتاح: ${p.stock}`);
        return;
      }
      setCart((prev) =>
        existing
          ? prev.map((i) =>
              i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev, { ...p, quantity: 1 }],
      );
    },
    [cart],
  );

  const updateQuantity = useCallback(
    (id: string, q: number) => {
      const p = products.find((prod) => prod.id === id);
      if (p && q > p.stock) {
        toast.error("تجاوز المخزن");
        return;
      }
      setCart((prev) =>
        q <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, quantity: q } : i)),
      );
    },
    [products],
  );

  const completeSale = async (
    paymentMethod: "cash" | "card" | "mobile",
    cashierId: string,
    customerPhone: string,
    customerName: string,
    amountPaid = 0,
    changeDue = 0,
    discountAmount = 0,
  ) => {
    try {
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const vat = (subtotal - discountAmount) * 0.15;
      const total = subtotal - discountAmount + vat;

      const { data: order, error } = await supabase
        .from("orders")
        .insert([
          {
            receipt_number: `ORG-${Date.now().toString(36).toUpperCase()}`,
            total_amount: total,
            vat_amount: vat,
            discount_amount: discountAmount,
            payment_method: paymentMethod,
            cashier_id: cashierId,
            amount_paid: amountPaid,
            change_due: changeDue,
            status: "completed",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      for (const item of cart) {
        await supabase.from("order_items").insert([
          {
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          },
        ]);
        const p = products.find((prod) => prod.id === item.id);
        if (p)
          await supabase
            .from("products")
            .update({ stock: p.stock - item.quantity })
            .eq("id", item.id);
      }

      clearCart();
      await fetchInitialData(); // تحديث المبيعات فوراً لتظهر في Dashboard
      return {
        ...order,
        items: cart as SaleItem[],
        customerName,
        customerPhone,
        total,
        date: order.created_at,
      };
    } catch (e) {
      toast.error("خطأ في إتمام البيع");
      return null;
    }
  };

  const saveQuotation = async (
    cid: string,
    cp: string,
    cn: string,
    da: number,
  ) => {
    try {
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const vat = (subtotal - da) * 0.15;
      const { data: quo, error } = await supabase
        .from("quotations")
        .insert([
          {
            receipt_number: `QUO-${Date.now().toString(36).toUpperCase()}`,
            total_amount: subtotal - da + vat,
            vat_amount: vat,
            discount_amount: da,
            status: "pending",
          },
        ])
        .select()
        .single();
      if (error) return false;
      await supabase.from("quotation_items").insert(
        cart.map((i) => ({
          quotation_id: quo.id,
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        })),
      );
      clearCart();
      return true;
    } catch {
      return false;
    }
  };

  const deleteQuotation = async (id: string) => {
    const { error } = await supabase.from("quotations").delete().eq("id", id);
    if (!error) toast.success("تم الحذف");
    return !error;
  };

  const updateProduct = async (p: Product) => {
    const { error } = await supabase.from("products").update(p).eq("id", p.id);
    if (!error) await fetchInitialData();
    return !error;
  };

  const addProduct = async (p: Omit<Product, "id">) => {
    const { error } = await supabase.from("products").insert([p]);
    if (!error) await fetchInitialData();
    return !error;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) await fetchInitialData();
    return !error;
  };

  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        customers,
        sales,
        cartDiscount,
        setCartDiscount,
        tempCustomer,
        setTempCustomer,
        cartTotal: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        cartCount: cart.reduce((s, i) => s + i.quantity, 0),
        addToCart,
        removeFromCart: (id) => updateQuantity(id, 0),
        updateQuantity,
        clearCart,
        findCustomerByPhone: (p) => customers.find((c) => c.phone === p),
        completeSale,
        saveQuotation,
        deleteQuotation,
        loadQuotationToCart,
        updateProduct,
        addProduct,
        deleteProduct,
        fetchInitialData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error("usePOS error");
  return context;
}
