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
  receiptNumber: string;
  customerPhone?: string;
  customerName?: string;
  amountPaid?: number;
  changeDue?: number;
  discountAmount?: number;
  vatAmount?: number;
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
  sales: SaleWithCustomer[];
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
    pm: "cash" | "card" | "mobile",
    cid: string,
    cp: string,
    cn: string,
    ap?: number,
    cd?: number,
    da?: number,
  ) => Promise<SaleWithCustomer | null>;
  saveQuotation: (
    cid: string,
    cp: string,
    cn: string,
    da: number,
  ) => Promise<boolean>;
  deleteQuotation: (id: string) => Promise<boolean>;
  loadQuotationToCart: (
    quoteItems: QuotationItemDB[],
    name: string,
    phone: string,
    discount: number,
  ) => void;
  updateProduct: (p: Product) => Promise<boolean>;
  addProduct: (p: Omit<Product, "id">) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
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

  const fetchInitialData = useCallback(async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (prods) setProducts(prods as Product[]);

      const { data: custs } = await supabase.from("customers").select("*");
      if (custs) setCustomers(custs as Customer[]);

      const { data: ords } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: items } = await supabase.from("order_items").select("*");

      if (ords && items) {
        const formatted: SaleWithCustomer[] = ords.map((o) => {
          const customer = custs?.find((c) => c.id === o.customer_id);
          return {
            id: o.id,
            receiptNumber: o.receipt_number,
            total: o.total_amount,
            date: o.created_at,
            paymentMethod:
              (o.payment_method as "cash" | "card" | "mobile") || "cash",
            cashierId: o.cashier_id,
            customerName: customer?.name || "عميل عام",
            customerPhone: customer?.phone || "---",
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
        setSales(formatted);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const addToCart = useCallback(
    (p: Product) => {
      const existing = cart.find((i) => i.id === p.id);
      if (existing && existing.quantity >= p.stock) {
        toast.error("نفذ المخزون!");
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
    pm: "cash" | "card" | "mobile",
    cid: string,
    cp: string,
    cn: string,
    ap = 0,
    cd = 0,
    da = 0,
  ) => {
    try {
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const vat = (subtotal - da) * 0.15;
      const total = subtotal - da + vat;

      const { data: order, error } = await supabase
        .from("orders")
        .insert([
          {
            receipt_number: `ORG-${Date.now().toString(36).toUpperCase()}`,
            total_amount: total,
            vat_amount: vat,
            discount_amount: da,
            payment_method: pm,
            cashier_id: cid,
            amount_paid: ap,
            change_due: cd,
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
      setCart([]);
      setTempCustomer({ name: "", phone: "" });
      setCartDiscount(0);
      fetchInitialData();
      return {
        ...order,
        items: cart as SaleItem[],
        customerName: cn,
        customerPhone: cp,
        total,
        date: order.created_at,
      };
    } catch {
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
      if (error) throw error;
      await supabase.from("quotation_items").insert(
        cart.map((i) => ({
          quotation_id: quo.id,
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        })),
      );
      setCart([]);
      return true;
    } catch {
      return false;
    }
  };

  const updateProduct = async (p: Product) => {
    try {
      const { name, price, category, stock, barcode } = p;
      const { error } = await supabase
        .from("products")
        .update({ name, price, category, stock, barcode })
        .eq("id", p.id);
      if (error) throw error;
      await fetchInitialData();
      return true;
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
      return false;
    }
  };

  const addProduct = async (p: Omit<Product, "id">) => {
    try {
      const { name, price, category, stock, barcode } = p;
      const { error } = await supabase
        .from("products")
        .insert([{ name, price, category, stock, barcode }]);
      if (error) throw error;
      await fetchInitialData();
      return true;
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) await fetchInitialData();
    return !error;
  };

  const value: POSContextType = {
    products,
    cart,
    customers,
    sales,
    cartTotal: cart.reduce((s, i) => s + i.price * i.quantity, 0),
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    cartDiscount,
    setCartDiscount,
    tempCustomer,
    setTempCustomer,
    addToCart,
    removeFromCart: (id) => updateQuantity(id, 0),
    updateQuantity,
    clearCart: () => setCart([]),
    findCustomerByPhone: (p) => customers.find((c) => c.phone === p),
    completeSale,
    saveQuotation,
    deleteQuotation: async (id) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      return !error;
    },
    loadQuotationToCart: (items, n, p, d) => {
      setCart(
        items
          .filter((i) => i.products)
          .map((i) => ({ ...i.products!, quantity: i.quantity })),
      );
      setTempCustomer({ name: n, phone: p });
      setCartDiscount(d);
    },
    updateProduct,
    addProduct,
    deleteProduct,
    fetchInitialData,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error("usePOS error");
  return context;
}
