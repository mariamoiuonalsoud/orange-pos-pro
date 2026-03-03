import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import logo from '@/assets/orange-group-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, User } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 600));
    
    const success = login(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center pos-gradient relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary-foreground blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="Orange Group"
            className="w-28 h-28 mx-auto mb-4 object-contain"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          />
          <h1 className="text-2xl font-bold text-foreground">نظام نقاط البيع</h1>
          <p className="text-muted-foreground mt-1">أورانج جروب</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="اسم المستخدم"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="pr-10 text-right h-12"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pr-10 text-right h-12"
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-destructive text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-accent text-primary-foreground"
            disabled={loading}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-6 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-1">بيانات تجريبية:</p>
          <p>مدير: admin / admin123</p>
          <p>كاشير: cashier / cashier123</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
