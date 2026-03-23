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
  status?: "completed" | "partially_refunded" | "refunded";
  items: SaleItem[];
}

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  customers: Customer[];
  sales: SaleWithCustomer[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
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

  // --- 1. دوال السلة ---
  const clearCart = useCallback(() => setCart([]), []);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error("المنتج نفذ من المخزن");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("الكمية المتاحة غير كافية");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  }, []);

  const removeFromCart = (productId: string) => updateQuantity(productId, 0);

  // --- 2. جلب البيانات (حل مشكلة السطر 150) ---
  const fetchInitialData = async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (prods) setProducts(prods as Product[]);

      const { data: custs } = await supabase.from("customers").select("*");
      if (custs) setCustomers(custs);

      const { data: ords } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: items } = await supabase.from("order_items").select("*");

      if (ords && items) {
        // قمنا بتعريف النوع صراحة هنا لتجنب formatted as any
        const formatted: SaleWithCustomer[] = ords.map((o) => {
          const customer = custs?.find((c) => c.id === o.customer_id);
          return {
            id: o.id,
            receiptNumber: o.receipt_number,
            total: o.total_amount,
            date: o.created_at,
            paymentMethod: o.payment_method,
            cashierId: o.cashier_id,
            amountPaid: o.amount_paid,
            changeDue: o.change_due,
            discountAmount: o.discount_amount || 0,
            customerName: customer?.name || "",
            customerPhone: customer?.phone || "",
            status: o.status || "completed",
            items: items
              .filter((i) => i.order_id === o.id)
              .map((i) => ({
                id: i.product_id,
                order_item_id: i.id,
                name:
                  products.find((p) => p.id === i.product_id)?.name ||
                  "منتج معروف",
                price: i.unit_price,
                quantity: i.quantity,
                returned_quantity: i.returned_quantity || 0,
                stock: 0,
                category: "",
                barcode: "",
                image: "",
              })),
          };
        });
        setSales(formatted);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const findCustomerByPhone = (phone: string) =>
    customers.find((c) => c.phone === phone);

  // --- 3. إتمام البيع (حل مشكلة السطر 270) ---
  const completeSale = async (
    paymentMethod: "cash" | "card" | "mobile",
    cashierId: string,
    customerPhone: string,
    customerName: string,
    amountPaid: number = 0,
    changeDue: number = 0,
    discountAmount: number = 0,
  ): Promise<SaleWithCustomer | null> => {
    if (cart.length === 0) return null;

    try {
      let customer_id = null;

      if (
        customerPhone &&
        customerPhone !== "-" &&
        customerPhone.trim() !== ""
      ) {
        const existingCust = findCustomerByPhone(customerPhone);
        if (!existingCust) {
          const { data: newCust, error: cErr } = await supabase
            .from("customers")
            .insert([
              { name: customerName || "عميل جديد", phone: customerPhone },
            ])
            .select()
            .single();
          if (!cErr && newCust) {
            customer_id = newCust.id;
            setCustomers((prev) => [newCust, ...prev]);
          }
        } else {
          customer_id = existingCust.id;
        }
      }

      const cartTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const amountAfterDiscount = cartTotal - discountAmount;
      const totalFinal = amountAfterDiscount * 1.15;
      const receiptNumber = `ORG-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert([
          {
            receipt_number: receiptNumber,
            total_amount: totalFinal,
            vat_amount: amountAfterDiscount * 0.15,
            discount_amount: discountAmount,
            payment_method: paymentMethod,
            cashier_id: cashierId,
            customer_id: customer_id,
            amount_paid: amountPaid,
            change_due: changeDue,
            status: "completed",
          },
        ])
        .select()
        .single();

      if (oErr) throw oErr;

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

        const currentProd = products.find((p) => p.id === item.id);
        if (currentProd) {
          await supabase
            .from("products")
            .update({ stock: currentProd.stock - item.quantity })
            .eq("id", item.id);
        }
      }

      const finalSale: SaleWithCustomer = {
        ...order,
        receiptNumber,
        items: cart.map((i) => ({ ...i, returned_quantity: 0 })),
        total: totalFinal,
        customerName: customerName || (customer_id ? "عميل مسجل" : "عميل نقدي"),
        customerPhone,
        date: order.created_at,
      };

      setSales((prev) => [finalSale, ...prev]);
      clearCart();
      fetchInitialData();
      toast.success("تم تسجيل العملية والعميل بنجاح");
      return finalSale;
    } catch (e) {
      // حل مشكلة e: any عن طريق تحويل النوع يدوياً
      const error = e as Error;
      toast.error("خطأ: " + error.message);
      return null;
    }
  };

  const addProduct = async (p: Omit<Product, "id">) => {
    const { image, ...data } = p;
    const { error } = await supabase.from("products").insert([data]);
    if (error) return false;
    fetchInitialData();
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchInitialData();
    return !error;
  };

  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        customers,
        sales,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        cartCount: cart.reduce((s, i) => s + i.quantity, 0),
        findCustomerByPhone,
        completeSale,
        addProduct,
        deleteProduct,
        fetchInitialData,
        saveQuotation: async () => true,
        updateProduct: async () => true,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS error");
  return ctx;
};
