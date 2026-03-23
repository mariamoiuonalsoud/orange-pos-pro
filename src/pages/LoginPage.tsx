import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, LogIn, Eye, EyeOff, Loader2 } from "lucide-react"; // ضفنا أيقونة التحميل
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // حالات التحكم في الواجهة
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // التحقق الأساسي
    if (!username.trim() || !password.trim()) {
      setError("برجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoading(true); // تفعيل حالة التحميل لمنع الضغط المتكرر
    try {
      const success = await login(username, password);

      if (!success) {
        // الخطأ بيتم التعامل معاه جوه الـ AuthContext ويظهر كـ toast
        // لكن بنعرضه هنا كمان لزيادة التأكيد
        setError("بيانات الدخول غير صحيحة");
        setPassword("");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/30"
      dir="rtl"
    >
      <div className="bg-card w-full max-w-md p-8 rounded-[2rem] border border-border shadow-2xl text-center relative overflow-hidden transition-all">
        {/* الخط البرتقالي المميز لبراند Orange Group */}
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        {/* أيقونة القفل في الهيدر */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 mt-2 border border-primary/20">
          <Lock className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
          Orange Group
        </h1>
        <p className="text-muted-foreground mb-8 font-medium">
          نظام إدارة نقاط البيع الذكي
        </p>

        {/* عرض رسائل الخطأ */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl mb-6 font-bold border border-destructive/20 animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        {/* فورم الدخول */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5 text-right">
          <div className="space-y-2">
            <label className="block text-sm font-bold mr-1 text-foreground/80">
              اسم المستخدم
            </label>
            <Input
              type="text"
              placeholder="أدخل اسم المستخدم..."
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="h-12 text-right bg-muted/30 border-border/50 focus:border-primary/50 rounded-xl"
              dir="ltr"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold mr-1 text-foreground/80">
              كلمة المرور
            </label>
            <div className="relative group">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-12 text-right pl-12 bg-muted/30 border-border/50 focus:border-primary/50 rounded-xl"
                dir="ltr"
                autoComplete="current-password"
              />
              {/* زر إظهار/إخفاء الباسورد */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-2"
                title={showPassword ? "إخفاء" : "إظهار"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-xl font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.97] disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <LogIn className="w-6 h-6 ml-2" />
                دخول للنظام
              </>
            )}
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground/60 font-mono">
          © 2026 Orange Group | POS Pro v2.1
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
