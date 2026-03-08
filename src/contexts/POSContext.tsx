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

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface SaleWithCustomer extends Sale {
  customerPhone?: string;
  customerName?: string;
  amountPaid?: number;
  changeDue?: number;
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
  ) => Promise<SaleWithCustomer | null>;
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

  // دالة جلب البيانات
  const fetchInitialData = async () => {
    try {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (prods) setProducts(prods);

      const { data: custs } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (custs) setCustomers(custs);

      // جلب الفواتير
      const { data: ords } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      // التعديل الجديد: جلب تفاصيل المنتجات المباعة في الفواتير
      const { data: orderItemsData } = await supabase
        .from("order_items")
        .select("*");

      if (ords) {
        const formattedSales: SaleWithCustomer[] = ords.map((o) => {
          const customer = custs?.find((c) => c.id === o.customer_id);

          // تجهيز قائمة المنتجات الخاصة بهذه الفاتورة تحديداً للطباعة
          const saleItems =
            orderItemsData
              ?.filter((item) => item.order_id === o.id)
              .map((item) => {
                const p = prods?.find((prod) => prod.id === item.product_id);
                return {
                  id: item.product_id,
                  name: p ? p.name : "منتج غير معروف",
                  price: item.unit_price,
                  quantity: item.quantity,
                  stock: 0,
                  category: "",
                  image: "📦",
                  barcode: "",
                };
              }) || [];

          return {
            id: o.id,
            receiptNumber: o.receipt_number,
            total: o.total_amount,
            date: o.created_at,
            paymentMethod: o.payment_method,
            cashierId: o.cashier_id,
            amountPaid: o.amount_paid,
            changeDue: o.change_due,
            customerName: customer ? customer.name : "",
            customerPhone: customer ? customer.phone : "",
            items: saleItems, // تمرير المنتجات بدلاً من مصفوفة فارغة
          };
        });
        setSales(formattedSales);
      }
    } catch (error) {
      console.error("Error fetching POS data:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
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
          toast.error("لا توجد كمية كافية في المخزن");
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

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(productId);
    else
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const findCustomerByPhone = (phone: string) =>
    customers.find((c) => c.phone === phone);

  const completeSale = async (
    paymentMethod: "cash" | "card" | "mobile",
    cashierId: string,
    customerPhone: string,
    customerName: string,
    amountPaid: number = 0,
    changeDue: number = 0,
  ): Promise<SaleWithCustomer | null> => {
    if (cart.length === 0) return null;

    const productIdsInCart = cart.map((item) => item.id);
    const { data: currentStockData, error: stockError } = await supabase
      .from("products")
      .select("id, name, stock")
      .in("id", productIdsInCart);

    if (stockError || !currentStockData) {
      toast.error("حدث خطأ أثناء التحقق من المخزون");
      return null;
    }

    for (const cartItem of cart) {
      const dbProduct = currentStockData.find((p) => p.id === cartItem.id);
      if (!dbProduct) {
        toast.error(`المنتج ${cartItem.name} تم حذفه من قاعدة البيانات`);
        return null;
      }
      if (cartItem.quantity > dbProduct.stock) {
        toast.error(
          `فشلت العملية! كمية "${cartItem.name}" غير متوفرة. المتاح: ${dbProduct.stock}`,
          {
            duration: 6000,
            style: { border: "2px solid #ef4444" },
          },
        );
        return null;
      }
    }

    let customer_id = null;
    if (customerPhone && customerPhone !== "-") {
      let cust = findCustomerByPhone(customerPhone);
      if (!cust) {
        const { data: newCust } = await supabase
          .from("customers")
          .insert([{ name: customerName, phone: customerPhone }])
          .select()
          .single();
        if (newCust) {
          cust = newCust;
          setCustomers((prev) => [cust!, ...prev]);
        }
      }
      if (cust) customer_id = cust.id;
    }

    const receiptNumber = `ORG-${Date.now().toString(36).toUpperCase()}`;
    const total = cartTotal * 1.15;
    const vat_amount = cartTotal * 0.15;

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          total_amount: total,
          vat_amount: vat_amount,
          payment_method: paymentMethod,
          customer_id: customer_id,
          receipt_number: receiptNumber,
          cashier_id: cashierId,
          amount_paid: amountPaid,
          change_due: changeDue,
        },
      ])
      .select()
      .single();

    if (orderError || !newOrder) {
      toast.error("حدث خطأ أثناء حفظ الفاتورة");
      return null;
    }

    const orderItems = cart.map((item) => ({
      order_id: newOrder.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));
    await supabase.from("order_items").insert(orderItems);

    for (const item of cart) {
      const dbProduct = currentStockData.find((p) => p.id === item.id);
      if (dbProduct) {
        const newStock = dbProduct.stock - item.quantity;
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id);
      }
    }

    clearCart();
    fetchInitialData();

    const sale: SaleWithCustomer = {
      id: newOrder.id,
      receiptNumber,
      items: [...cart],
      total,
      date: newOrder.created_at,
      paymentMethod,
      cashierId,
      customerPhone,
      customerName,
      amountPaid,
      changeDue,
    };
    return sale;
  };

  const addProduct = async (p: Omit<Product, "id">): Promise<boolean> => {
    const { error } = await supabase.from("products").insert([
      {
        name: p.name,
        price: p.price,
        stock: p.stock,
        barcode: p.barcode,
        category: p.category,
      },
    ]);
    if (error) {
      toast.error("حدث خطأ أثناء إضافة المنتج");
      return false;
    }
    fetchInitialData();
    return true;
  };

  const updateProduct = async (p: Product): Promise<boolean> => {
    const { error } = await supabase
      .from("products")
      .update({
        name: p.name,
        price: p.price,
        stock: p.stock,
        barcode: p.barcode,
        category: p.category,
      })
      .eq("id", p.id);

    if (error) {
      toast.error("حدث خطأ أثناء تعديل المنتج");
      return false;
    }
    fetchInitialData();
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("لا يمكن حذف هذا المنتج (قد يكون مرتبطاً بفواتير سابقة)");
      return false;
    }
    fetchInitialData();
    return true;
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

export const usePOS = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be inside POSProvider");
  return ctx;
};
