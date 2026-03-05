import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "cashier";

// ضفنا الـ username والـ password هنا عشان نقدر نديرهم كـ State في النسخة الحالية
export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[]; // ضفنا قائمة المستخدمين عشان نعرضها للأدمن
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  // دوال الإدارة (عشان الأدمن يقدر يضيف ويمسح كاشير)
  addUser: (newUser: Omit<User, "id">) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// دي البيانات المبدئية اللي هتتحول لـ State
const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "أحمد محمد",
    role: "admin",
  },
  {
    id: "2",
    username: "cashier",
    password: "cashier123",
    name: "سارة علي",
    role: "cashier",
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // خلينا المستخدمين State عشان نقدر نعدل فيهم
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    // خلينا البحث يتم في الـ State بدل الـ Constant
    const found = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (found) {
      setUser({
        id: found.id,
        name: found.name,
        role: found.role,
        username: found.username,
      });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  // دالة لإضافة مستخدم جديد
  const addUser = (newUser: Omit<User, "id">) => {
    setUsers((prev) => [...prev, { ...newUser, id: crypto.randomUUID() }]);
  };

  // دالة لمسح مستخدم
  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
