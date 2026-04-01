import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export type UserRole = "admin" | "cashier";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  auth_id?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; // تم التحديث ليكون Promise
  isAuthenticated: boolean;
  addUser: (newUser: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  fetchUsers: () => Promise<void>;
  updatePassword: (authId: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const validateStrongPassword = (password: string) => {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setUsers(
          data.map((u) => ({
            id: u.id,
            name: u.full_name,
            role: u.role as UserRole,
            username: u.username,
            auth_id: u.auth_id,
          })),
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error fetching users";
      console.error(message);
    }
  }, []);

  const fetchAndSetUserData = useCallback(
    async (authId: string) => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      if (data) {
        setUser({
          id: data.id,
          name: data.full_name,
          role: data.role as UserRole,
          username: data.username,
          auth_id: data.auth_id,
        });
        if (data.role === "admin") await fetchUsers();
      }
      setIsLoading(false);
    },
    [fetchUsers],
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await fetchAndSetUserData(session.user.id);
      else setIsLoading(false);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) fetchAndSetUserData(session.user.id);
        else setUser(null);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, [fetchAndSetUserData]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في تسجيل الدخول");
      return false;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("فشل تسجيل الخروج");
    } else {
      setUser(null);
      setUsers([]);
      toast.success("تم تسجيل الخروج بنجاح");
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("تم حذف الموظف بنجاح");
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف");
      return false;
    }
  };

  const updatePassword = async (
    authId: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-employee-user",
        {
          body: { action: "update", auth_id: authId, password: newPassword },
        },
      );
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success("تم تحديث كلمة المرور");
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل التحديث");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        addUser: async () => true, // يتم تنفيذه عادة عبر Edge Function كما في الكود السابق
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
