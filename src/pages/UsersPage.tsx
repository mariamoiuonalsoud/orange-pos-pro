import React, { useState } from "react";
import { useAuth, UserRole, User } from "@/contexts/AuthContext";
import POSHeader from "@/components/POSHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Save, Users, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const UsersPage = () => {
  const { users, addUser, deleteUser, user: currentUser } = useAuth();
  const [adding, setAdding] = useState(false);

  // State عشان نعرف إحنا دايسين على أي موظف عشان نعرض بياناته
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier" as UserRole,
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-destructive font-bold text-xl">
        عفواً، ليس لديك صلاحية للدخول إلى هذه الصفحة.
      </div>
    );
  }

  const handleAdd = () => {
    if (!form.name || !form.username || !form.password) return;

    addUser({
      name: form.name,
      username: form.username,
      password: form.password,
      role: form.role,
    });

    setForm({ name: "", username: "", password: "", role: "cashier" });
    setAdding(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> إدارة الموظفين
          </h1>
          <Button
            onClick={() => setAdding(true)}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            <Plus className="w-4 h-4 ml-2" /> إضافة موظف
          </Button>
        </div>

        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border p-4 mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">إضافة موظف جديد</h3>
                <button onClick={() => setAdding(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  placeholder="الاسم بالكامل"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="اسم المستخدم (للدخول)"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
                <Input
                  type="text"
                  placeholder="الرقم السري"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="cashier">كاشير</option>
                  <option value="admin">مدير (أدمن)</option>
                </select>
              </div>
              <Button
                onClick={handleAdd}
                className="mt-3 bg-primary text-primary-foreground hover:bg-accent"
              >
                <Save className="w-4 h-4 ml-2" /> حفظ
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    الاسم
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    اسم المستخدم
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    الدور (الصلاحية)
                  </th>
                  <th className="text-right p-3 text-sm font-semibold text-foreground">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    layout
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 text-sm font-medium text-foreground">
                      {u.name}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {u.username}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {u.role === "admin" ? "مدير نظام" : "كاشير"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {/* زرار عرض البيانات (العين) */}
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"
                          title="عرض بيانات الموظف"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* زرار المسح */}
                        {u.id !== currentUser?.id && u.role !== "admin" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            title="مسح الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* شاشة العرض المنبثقة (Modal) اللي هتظهر لما ندوس على العين */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card w-full max-w-sm rounded-2xl p-6 border border-border shadow-xl relative"
            >
              <button
                onClick={() => setViewingUser(null)}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-foreground mb-6 text-center border-b border-border pb-3">
                بيانات تسجيل الدخول
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الاسم بالكامل
                  </label>
                  <div className="p-3 bg-muted rounded-lg font-semibold text-foreground">
                    {viewingUser.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    اسم المستخدم (Username)
                  </label>
                  <div
                    className="p-3 bg-muted rounded-lg font-semibold text-foreground"
                    dir="ltr"
                  >
                    {viewingUser.username}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    كلمة المرور (Password)
                  </label>
                  <div
                    className="p-3 bg-muted rounded-lg font-bold text-primary tracking-widest"
                    dir="ltr"
                  >
                    {viewingUser.password || "غير مسجل"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    الصلاحية
                  </label>
                  <div className="p-3 bg-muted rounded-lg font-semibold text-foreground">
                    {viewingUser.role === "admin" ? "مدير نظام" : "كاشير"}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setViewingUser(null)}
                className="w-full mt-6 bg-primary text-primary-foreground"
              >
                إغلاق
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
