import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase"; // تأكدي من مسار ملف supabase
import { toast } from "sonner"; // لو بتستخدمي مكتبة تانية للإشعارات عدلي السطر ده

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // 1. دالة جلب المستخدمين (تم تصحيحها)
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      if (data) {
        interface DatabaseUser {
          id: string;
          full_name: string;
          role: UserRole;
          username: string;
          password?: string;
        }

        const formattedUsers: User[] = data.map((u: DatabaseUser) => ({
          id: u.id,
          name: u.full_name || "بدون اسم",
          role: u.role,
          username: u.username,
          password: u.password,
        }));

        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error("Fetch Catch Error:", err);
    }
  };

  // 2. دالة تسجيل الدخول
  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (error || !data) {
        toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
        return false;
      }

      if (data.active === false) {
        toast.error("هذا الحساب غير مفعل، يرجى مراجعة الإدارة");
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
      console.error("Login error:", err);
      toast.error("حدث خطأ في الاتصال بقاعدة البيانات");
      return false;
    }
  };

  // 3. دالة تسجيل الخروج
  const logout = () => {
    setUser(null);
    setUsers([]);
  };

  // 4. دالة إضافة مستخدم جديد
  const addUser = async (newUser: Omit<User, "id">): Promise<boolean> => {
    const { error } = await supabase.from("users").insert([
      {
        full_name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      },
    ]);

    if (error) {
      console.error("Error adding user:", error);
      toast.error("حدث خطأ! قد يكون اسم المستخدم مسجل مسبقاً.");
      return false;
    }

    toast.success("تم إضافة الموظف بنجاح");
    await fetchUsers();
    return true;
  };

  // 5. دالة حذف مستخدم
  const deleteUser = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      toast.error("حدث خطأ أثناء حذف الموظف");
      return false;
    }

    toast.success("تم حذف الموظف بنجاح");
    await fetchUsers();
    return true;
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
