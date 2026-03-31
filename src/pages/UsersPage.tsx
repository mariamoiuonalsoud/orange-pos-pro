import React, { useState, useEffect } from "react";
import { useAuth, UserRole, User } from "@/contexts/AuthContext";
import POSHeader from "@/components/POSHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Users,
  Eye,
  AlertTriangle,
  Lock,
  Key,
  RefreshCw,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// دالة التحقق من قوة كلمة المرور (للاستخدام في البرمجة)
const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

// مكون واجهة المستخدم لعرض شروط الباسوورد بشكل تفاعلي
const PasswordRules = ({ password }: { password: string }) => {
  const rules = [
    { id: 1, label: "8 أحرف على الأقل", valid: password.length >= 8 },
    { id: 2, label: "حرف كبير (A-Z)", valid: /[A-Z]/.test(password) },
    { id: 3, label: "حرف صغير (a-z)", valid: /[a-z]/.test(password) },
    { id: 4, label: "رقم (0-9)", valid: /[0-9]/.test(password) },
    {
      id: 5,
      label: "رمز خاص (مثل !@#$%)",
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-sm w-full">
      <p className="font-semibold mb-2 text-muted-foreground text-xs">
        شروط كلمة المرور:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              rule.valid ? "text-green-600" : "text-muted-foreground/70"
            }`}
          >
            {rule.valid ? <Check size={14} /> : <X size={14} />}
            <span className="text-xs">{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsersPage = () => {
  const {
    users,
    addUser,
    deleteUser,
    updatePassword,
    user: currentUser,
    fetchUsers,
  } = useAuth();

  const [adding, setAdding] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier" as UserRole,
  });

  const isMasterAdmin = currentUser?.username === "orange_admin";

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-destructive font-bold text-xl">
        عفواً، ليس لديك صلاحية للدخول إلى هذه الصفحة.
      </div>
    );
  }

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.password) {
      toast.error("برجاء إدخال جميع البيانات");
      return;
    }

    if (!validatePassword(form.password)) {
      toast.error("يرجى استيفاء جميع شروط كلمة المرور أولاً.");
      return;
    }

    const success = await addUser(form);
    if (success) {
      setForm({ name: "", username: "", password: "", role: "cashier" });
      setAdding(false);
    }
  };

  const handleResetPassword = async () => {
    if (!viewingUser || !newPassword) {
      toast.error("برجاء إدخال كلمة المرور الجديدة");
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error("يرجى استيفاء جميع شروط كلمة المرور أولاً.");
      return;
    }

    setIsUpdating(true);
    const success = await updatePassword(viewingUser.id, newPassword);
    if (success) {
      setNewPassword("");
      setViewingUser(null);
    }
    setIsUpdating(false);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
      <POSHeader />
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Users className="w-6 h-6 text-primary" /> إدارة الموظفين
          </h1>
          {isMasterAdmin && (
            <Button
              onClick={() => setAdding(true)}
              className="bg-primary hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" /> إضافة موظف جديد
            </Button>
          )}
        </div>

        {/* نموذج الإضافة */}
        <AnimatePresence>
          {adding && isMasterAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border rounded-xl p-4 mb-6 shadow-sm overflow-hidden"
            >
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">إضافة موظف</h3>
                <button onClick={() => setAdding(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <Input
                  placeholder="الاسم"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="اسم المستخدم"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
                <Input
                  type="password"
                  placeholder="كلمة المرور"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <select
                  className="border rounded-md px-3 h-10 text-sm bg-background text-foreground"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                >
                  <option value="cashier">كاشير</option>
                  <option value="admin">مدير نظام</option>
                </select>
              </div>

              {/* عرض شروط الباسوورد عند الإضافة (تظهر فقط عند البدء في الكتابة أو التركيز) */}
              <div className="mb-4">
                <PasswordRules password={form.password} />
              </div>

              <Button onClick={handleAdd} className="bg-primary">
                حفظ الموظف
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* الجدول */}
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-right">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-sm font-semibold">الاسم</th>
                <th className="p-4 text-sm font-semibold">اسم المستخدم</th>
                <th className="p-4 text-sm font-semibold text-center">
                  الصلاحية
                </th>
                <th className="p-4 text-sm font-semibold text-center">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border border-t">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{u.name}</td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    {u.username}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                    >
                      {u.role === "admin" ? "مدير نظام" : "كاشير"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {isMasterAdmin ? (
                        <>
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground/60 flex items-center gap-1 text-xs">
                          <Lock size={12} /> محمي
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal عرض وإعادة تعيين كلمة السر */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card p-6 rounded-2xl max-w-sm w-full border shadow-2xl relative text-right"
            >
              <button
                onClick={() => {
                  setViewingUser(null);
                  setNewPassword("");
                }}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Key size={22} />
                </div>
                <h3 className="text-xl font-bold">كلمة سر الموظف</h3>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  إعادة تعيين (Reset) كلمة سر جديدة:
                </label>
                <Input
                  type="password"
                  placeholder="اكتب الكلمة الجديدة هنا..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-center font-mono"
                  dir="ltr"
                />

                {/* عرض شروط الباسوورد في الـ Modal */}
                <PasswordRules password={newPassword} />

                <Button
                  onClick={handleResetPassword}
                  disabled={isUpdating}
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white gap-2"
                >
                  {isUpdating ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  تحديث كلمة السر
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal تأكيد الحذف */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card p-6 rounded-2xl max-w-sm w-full text-center border shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                تأكيد الحذف
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                هل تريد حذف الموظف ({userToDelete.name})؟
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  نعم، احذف
                </Button>
                <Button
                  onClick={() => setUserToDelete(null)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
