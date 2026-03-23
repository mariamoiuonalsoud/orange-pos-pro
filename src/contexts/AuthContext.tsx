import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export type UserRole = "admin" | "cashier";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  addUser: (newUser: Omit<User, "id">) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  fetchUsers: () => Promise<void>;
  updatePassword: (userId: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // 1. جلب قائمة المستخدمين (للأدمن)
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedUsers: User[] = data.map((u) => ({
          id: u.id,
          name: u.full_name || "بدون اسم",
          role: u.role,
          username: u.username,
        }));
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error("Fetch Users Error:", err);
    }
  };

  // 2. تسجيل الدخول
  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !data) {
        toast.error("اسم المستخدم غير موجود");
        return false;
      }

      // مقارنة مباشرة للباسورد
      if (data.password !== password) {
        toast.error("كلمة المرور غير صحيحة");
        return false;
      }

      setUser({
        id: data.id,
        name: data.full_name,
        role: data.role,
        username: data.username,
      });

      toast.success(`أهلاً بك يا ${data.full_name}`);

      if (data.role === "admin") {
        await fetchUsers();
      }

      return true;
    } catch (err) {
      toast.error("خطأ في الاتصال");
      return false;
    }
  };

  // 3. حذف مستخدم (متاح للأدمن)
  const deleteUser = async (id: string): Promise<boolean> => {
    // 1. طباعة الـ ID للتأكد إنه واصل صح
    console.log("حاول حذف المستخدم بـ ID:", id);

    if (user && id === user.id) {
      toast.error("لا يمكنك حذف حسابك الحالي");
      return false;
    }

    try {
      // 2. محاولة الحذف
      const { error, count } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("خطأ من Supabase:", error.message);
        toast.error(`فشل الحذف: ${error.message}`);
        return false;
      }

      // 3. تحديث الـ State محلياً فوراً
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("تم الحذف من الداتابيز بنجاح");
      return true;
    } catch (err) {
      console.error("خطأ غير متوقع:", err);
      return false;
    }
  };
  // 4. إضافة مستخدم جديد
  const addUser = async (newUser: Omit<User, "id">): Promise<boolean> => {
    try {
      const { error } = await supabase.from("users").insert([
        {
          full_name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
        },
      ]);

      if (error) throw error;
      toast.success("تم إضافة الموظف بنجاح");
      await fetchUsers();
      return true;
    } catch (error) {
      toast.error("حدث خطأ، قد يكون اسم المستخدم مكرر");
      return false;
    }
  };

  // 5. تحديث كلمة المرور
  const updatePassword = async (
    userId: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("id", userId);

      if (error) throw error;
      toast.success("تم تحديث كلمة المرور بنجاح");
      return true;
    } catch (err) {
      toast.error("فشل التحديث");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setUsers([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        isAuthenticated: !!user,
        addUser,
        deleteUser,
        fetchUsers,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
