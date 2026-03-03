import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Smartphone, Banknote, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/orange-group-logo.png';

const CartPanel = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, completeSale } = usePOS();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');

  const handlePayment = (method: 'cash' | 'card' | 'mobile') => {
    if (!user) return;
    const sale = completeSale(method, user.id);
    setLastReceipt(sale.receiptNumber);
    setShowCheckout(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tax = cartTotal * 0.15;
  const grandTotal = cartTotal + tax;

  return (
    <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-r border-border flex flex-col h-[50vh] lg:h-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">السلة</h2>
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
            >
              {cartCount}
            </motion.span>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-sm text-destructive hover:underline">
            مسح الكل
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-12"
            >
              <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>السلة فارغة</p>
            </motion.div>
          ) : (
            cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex items-center gap-3 bg-muted/50 rounded-xl p-3"
              >
                <span className="text-2xl">{item.image}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-primary font-bold text-sm">{(item.price * item.quantity).toFixed(2)} ج.م</p>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </motion.button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals & Checkout */}
      {cart.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>المجموع الفرعي</span>
            <span>{cartTotal.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>ضريبة القيمة المضافة (15%)</span>
            <span>{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
            <span>الإجمالي</span>
            <span className="text-primary">{grandTotal.toFixed(2)} ج.م</span>
          </div>

          <AnimatePresence mode="wait">
            {!showCheckout ? (
              <motion.div key="checkout-btn" exit={{ opacity: 0 }}>
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-accent text-primary-foreground rounded-xl"
                >
                  الدفع
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="payment-methods"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">اختر طريقة الدفع</span>
                  <button onClick={() => setShowCheckout(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePayment('cash')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-success text-success-foreground font-semibold"
                >
                  <Banknote className="w-5 h-5" /> نقداً
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePayment('card')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  <CreditCard className="w-5 h-5" /> بطاقة
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePayment('mobile')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-foreground text-background font-semibold"
                >
                  <Smartphone className="w-5 h-5" /> دفع إلكتروني
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-card rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
              </motion.div>
              <img src={logo} alt="Orange Group" className="w-16 h-16 mx-auto mb-3 object-contain" />
              <h3 className="text-xl font-bold text-foreground mb-2">تمت العملية بنجاح!</h3>
              <p className="text-muted-foreground">رقم الإيصال: {lastReceipt}</p>
              <p className="text-primary font-bold text-lg mt-2">{grandTotal.toFixed(2)} ج.م</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPanel;
