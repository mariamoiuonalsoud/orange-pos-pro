import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo users for prototype
const DEMO_USERS = [
  { id: '1', username: 'admin', password: 'admin123', name: 'أحمد محمد', role: 'admin' as UserRole },
  { id: '2', username: 'cashier', password: 'cashier123', name: 'سارة علي', role: 'cashier' as UserRole },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    const found = DEMO_USERS.find(u => u.username === username && u.password === password);
    if (found) {
      setUser({ id: found.id, name: found.name, role: found.role });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
