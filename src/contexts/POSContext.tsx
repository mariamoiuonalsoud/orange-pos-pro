import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CartItem, Product, Sale, DEMO_PRODUCTS } from '@/data/pos-data';
import { toast } from 'sonner';

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  completeSale: (paymentMethod: 'cash' | 'card' | 'mobile', cashierId: string) => Sale;
  sales: Sale[];
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (productId: string) => void;
}

const POSContext = createContext<POSContextType | null>(null);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      toast.error('المنتج غير متوفر في المخزون');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('الكمية المطلوبة غير متوفرة');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
    } else {
      setCart(prev => prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const completeSale = useCallback((paymentMethod: 'cash' | 'card' | 'mobile', cashierId: string): Sale => {
    const sale: Sale = {
      id: crypto.randomUUID(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashierId,
      date: new Date().toISOString(),
      receiptNumber: `ORG-${Date.now().toString(36).toUpperCase()}`,
    };
    setSales(prev => [sale, ...prev]);
    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.quantity };
      return p;
    }));
    setCart([]);
    return sale;
  }, [cart, cartTotal]);

  const updateProduct = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: crypto.randomUUID() }]);
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  return (
    <POSContext.Provider value={{
      products, cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount, completeSale, sales, updateProduct, addProduct, deleteProduct
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be inside POSProvider');
  return ctx;
};
