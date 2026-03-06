import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { CartItem, Product, Sale, DEMO_PRODUCTS } from "@/data/pos-data";
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
  ) => SaleWithCustomer;
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  deleteProduct: (productId: string) => void;
}

const POSContext = createContext<POSContextType | null>(null);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  // Persistence using LocalStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("pos_products");
    return saved ? JSON.parse(saved) : DEMO_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("pos_customers");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<SaleWithCustomer[]>(() => {
    const saved = localStorage.getItem("pos_sales");
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    localStorage.setItem("pos_products", JSON.stringify(products));
    localStorage.setItem("pos_customers", JSON.stringify(customers));
    localStorage.setItem("pos_sales", JSON.stringify(sales));
  }, [products, customers, sales]);

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
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const findCustomerByPhone = (phone: string) =>
    customers.find((c) => c.phone === phone);

  const completeSale = (
    paymentMethod: "cash" | "card" | "mobile",
    cashierId: string,
    customerPhone: string,
    customerName: string,
    amountPaid: number = 0,
    changeDue: number = 0,
  ) => {
    // Register customer if new
    if (!findCustomerByPhone(customerPhone)) {
      setCustomers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: customerName, phone: customerPhone },
      ]);
    }

    const sale: SaleWithCustomer = {
      id: crypto.randomUUID(),
      receiptNumber: `ORG-${Date.now().toString(36).toUpperCase()}`,
      items: [...cart],
      total: cartTotal * 1.15, // Total with 15% VAT
      date: new Date().toISOString(),
      paymentMethod,
      cashierId,
      customerPhone,
      customerName,
      amountPaid,
      changeDue,
    };

    setSales((prev) => [sale, ...prev]);

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = cart.find((c) => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      }),
    );

    setCart([]);
    return sale;
  };

  const updateProduct = (p: Product) =>
    setProducts((prev) => prev.map((old) => (old.id === p.id ? p : old)));
  const addProduct = (p: Omit<Product, "id">) =>
    setProducts((prev) => [...prev, { ...p, id: crypto.randomUUID() }]);
  const deleteProduct = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

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
