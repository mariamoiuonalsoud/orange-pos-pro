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
  refundItem: (
    saleId: string,
    orderItemId: string,
    productId: string,
    returnQty: number,
  ) => Promise<boolean>;
}

const POSContext = createContext<POSContextType | null>(null);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleWithCustomer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- 1. دوال السلة (تم تعريفها مبكراً لتجنب أخطاء النطاق) ---
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

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

  // --- 2. جلب البيانات (Clean Query بدون صور) ---
  const fetchInitialData = async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, stock, barcode, category")
        .order("created_at", { ascending: false });

      // إضافة حقل الصورة كقيمة فارغة برمجياً لإرضاء TypeScript
      const sanitizedProds = prods?.map((p) => ({
        ...p,
        image: "",
      })) as Product[];

      if (sanitizedProds) setProducts(sanitizedProds);

      const { data: custs } = await supabase.from("customers").select("*");
      if (custs) setCustomers(custs);

      const { data: ords } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: orderItemsData } = await supabase
        .from("order_items")
        .select("*");

      if (ords && orderItemsData) {
        const formattedSales: SaleWithCustomer[] = ords.map((o) => {
          const customer = custs?.find((c) => c.id === o.customer_id);
          const saleItems: SaleItem[] = orderItemsData
            .filter((item) => item.order_id === o.id)
            .map((item) => {
              const p = sanitizedProds?.find(
                (prod) => prod.id === item.product_id,
              );
              return {
                id: item.product_id,
                order_item_id: item.id,
                name: p ? p.name : "منتج معروف",
                price: item.unit_price,
                quantity: item.quantity,
                returned_quantity: item.returned_quantity || 0,
                stock: 0,
                category: "",
                barcode: "",
                image: "", // حل الإيرور 2322: إضافة الحقل كقيمة فارغة هنا
              };
            });

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
            customerName: customer ? customer.name : "",
            customerPhone: customer ? customer.phone : "",
            items: saleItems,
            status: o.status || "completed",
          };
        });
        setSales(formattedSales);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const findCustomerByPhone = (phone: string) =>
    customers.find((c) => c.phone === phone);

  // --- 3. عمليات البيع وعروض الأسعار ---
  const saveQuotation = async (
    cashierId: string,
    customerPhone: string,
    customerName: string,
    discountAmount: number,
  ): Promise<boolean> => {
    if (cart.length === 0) return false;
    try {
      let customer_id = null;
      if (customerPhone && customerPhone !== "-") {
        const cust = findCustomerByPhone(customerPhone);
        if (!cust) {
          const { data: newCust } = await supabase
            .from("customers")
            .insert([{ name: customerName, phone: customerPhone }])
            .select()
            .single();
          if (newCust) {
            customer_id = newCust.id;
            setCustomers((prev) => [newCust, ...prev]);
          }
        } else {
          customer_id = cust.id;
        }
      }

      const receiptNumber = `QUO-${Date.now().toString(36).toUpperCase()}`;
      const amountAfterDiscount = cartTotal - discountAmount;
      const totalFinal = amountAfterDiscount * 1.15;

      const { data: newQuo, error } = await supabase
        .from("quotations")
        .insert([
          {
            receipt_number: receiptNumber,
            total_amount: totalFinal,
            vat_amount: amountAfterDiscount * 0.15,
            discount_amount: discountAmount,
            customer_id: customer_id,
            cashier_id: cashierId,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await supabase.from("quotation_items").insert(
        cart.map((item) => ({
          quotation_id: newQuo.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      );

      toast.success("تم حفظ عرض السعر");
      clearCart();
      return true;
    } catch (e) {
      toast.error("فشل حفظ العرض");
      return false;
    }
  };

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
      const receiptNumber = `ORG-${Date.now().toString(36).toUpperCase()}`;
      const amountAfterDiscount = cartTotal - discountAmount;
      const totalFinal = amountAfterDiscount * 1.15;

      const { data: order, error } = await supabase
        .from("orders")
        .insert([
          {
            total_amount: totalFinal,
            vat_amount: amountAfterDiscount * 0.15,
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

      await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        })),
      );

      clearCart();
      fetchInitialData();

      return {
        ...order,
        receiptNumber,
        items: cart.map((i) => ({ ...i, returned_quantity: 0, image: "" })),
        total: totalFinal,
        customerName,
        customerPhone,
        date: order.created_at,
      };
    } catch (e) {
      return null;
    }
  };

  // --- 4. إدارة المنتجات ---
  const addProduct = async (p: Omit<Product, "id">) => {
    const { error } = await supabase.from("products").insert([p]);
    if (error) return false;
    fetchInitialData();
    return true;
  };

  const updateProduct = async (p: Product) => {
    const { error } = await supabase.from("products").update(p).eq("id", p.id);
    if (error) return false;
    fetchInitialData();
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return false;
    fetchInitialData();
    return true;
  };

  const refundItem = async (
    saleId: string,
    orderItemId: string,
    productId: string,
    returnQty: number,
  ) => {
    console.log(saleId, orderItemId, productId, returnQty);
    return true; // (لوجيك المرتجع حسب احتياجك)
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
        cartTotal,
        cartCount,
        findCustomerByPhone,
        completeSale,
        saveQuotation,
        updateProduct,
        addProduct,
        deleteProduct,
        fetchInitialData,
        refundItem,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be inside POSProvider");
  return ctx;
};
