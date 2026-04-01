import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
// ضفنا أيقونات العين هنا
import { Lock, User, LogIn, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // State جديد للتحكم في إظهار وإخفاء الباسورد
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("برجاء إدخال الايميل وكلمة المرور");
      return;
    }

    const success = await login(username, password);

    if (!success) {
      setError("الايميل أو كلمة المرور غير صحيحة");
      setPassword("");
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-card w-full max-w-md p-8 rounded-2xl border border-border shadow-xl text-center relative overflow-hidden">
        {/* لمسة جمالية في الخلفية زي الكود القديم بتاعك */}
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 mt-2">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          تسجيل الدخول للنظام
        </h1>
        <p className="text-muted-foreground mb-8">
          أدخل بيانات الحساب الخاص بك
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 font-bold border border-destructive/20">
            {error}
          </div>
        )}

        {/* فورم الدخول */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-right">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              الايميل
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <Input
                type="text"
                data-testid="login-username-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="text-right"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              كلمة المرور
            </label>

            <div className="relative">
              <Input
                // هنا بنغير نوع الحقل بناءً على حالة الـ state
                type={showPassword ? "text" : "password"}
                data-testid="login-password-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="text-right pl-10" // ضفنا padding من الشمال عشان النص مياكلش الأيقونة
                dir="ltr"
              />
              {/* زرار العين */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
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
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg rounded-xl transition-all active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5 ml-2" />
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
