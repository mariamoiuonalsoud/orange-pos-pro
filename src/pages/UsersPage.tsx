import React, { useState, useEffect } from "react";
import {
  useAuth,
  UserRole,
  User,
  validateStrongPassword,
} from "@/contexts/AuthContext";
import POSHeader from "@/components/POSHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  Users,
  Key,
  RefreshCw,
  Check,
  Lock as LockIcon,
  AlertTriangle, // أيقونة التحذير الجديدة
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

// واجهة بيانات فحص كلمة المرور
interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

const PasswordRules = ({ checks }: { checks: PasswordChecks }) => {
  const rules = [
    { label: "8 أحرف", valid: checks.length },
    { label: "حرف كبير", valid: checks.upper },
    { label: "حرف صغير", valid: checks.lower },
    { label: "رقم (0-9)", valid: checks.number },
    { label: "رمز خاص", valid: checks.special },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-50">
      {rules.map((rule, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 text-[12px] transition-colors ${
            rule.valid ? "text-emerald-500 font-bold" : "text-slate-400"
          }`}
        >
          {rule.valid ? <Check size={14} /> : <X size={14} />}
          {rule.label}
        </div>
      ))}
    </div>
  );
};

const UsersPage: React.FC = () => {
  const {
    users,
    deleteUser,
    user: currentUser,
    fetchUsers,
    updatePassword,
  } = useAuth();

  const [adding, setAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null); // للمودال الجديد
  const [newPass, setNewPass] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingProcess, setIsDeletingProcess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "cashier" as UserRole,
  });

  const MASTER_ADMIN_USERNAME = "orange_admin@";

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [fetchUsers, currentUser]);

  const currentPassChecks: PasswordChecks = validateStrongPassword(
    adding ? form.password : newPass,
  );
  const isPassValid = Object.values(currentPassChecks).every(Boolean);

  const handleSave = async () => {
    if (!form.name || !form.username || !form.email || !form.password) {
      return toast.error("يرجى ملء جميع الحقول المطلوبة");
    }
    if (!isPassValid) {
      return toast.error("كلمة المرور لا تستوفي الشروط الأمنية");
    }

    setIsSaving(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-employee-user",
        {
          body: {
            action: "create",
            email: form.email,
            password: form.password,
            role: form.role,
            full_name: form.name,
          },
        },
      );

      if (functionError || data?.error)
        throw new Error(functionError?.message || data?.error);

      const { error: dbError } = await supabase.from("users").insert([
        {
          full_name: form.name,
          username: form.username,
          email: form.email,
          role: form.role,
          auth_id: data.userId,
        },
      ]);

      if (dbError) throw dbError;

      toast.success("تم إضافة الموظف بنجاح");
      setAdding(false);
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "cashier",
      });
      fetchUsers();
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(error.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePass = async () => {
    if (!isPassValid) return toast.error("يجب اختيار كلمة مرور قوية");
    if (!viewingUser?.auth_id) return toast.error("بيانات المستخدم غير مكتملة");

    setIsUpdating(true);
    const success = await updatePassword(viewingUser.auth_id, newPass);
    if (success) {
      setViewingUser(null);
      setNewPass("");
    }
    setIsUpdating(false);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingProcess(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    } finally {
      setIsDeletingProcess(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]" dir="rtl">
      <POSHeader />
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Users size={24} />
            </div>
            إدارة طاقم العمل
          </h1>
          <Button
            onClick={() => setAdding(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-6 h-12 shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            <Plus size={18} className="ml-2" /> إضافة موظف جديد
          </Button>
        </div>

        {/* Add Employee Form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-slate-100 rounded-[2rem] p-8 mb-8 shadow-xl shadow-slate-200/50 relative"
            >
              <button
                onClick={() => setAdding(false)}
                className="absolute top-6 left-6 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-bold mb-8 text-xl text-slate-800 flex items-center gap-2">
                <Plus className="text-orange-500" size={20} /> بيانات الموظف
                الجديد
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">
                    الاسم بالكامل
                  </label>
                  <Input
                    placeholder="أدخل الاسم الثلاثي"
                    className="h-13 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">
                    اسم المستخدم
                  </label>
                  <Input
                    placeholder="مثال: ahmed_24"
                    className="h-13 rounded-xl border-slate-200 text-left"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="h-13 rounded-xl border-slate-200 text-left"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">
                    كلمة المرور
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-13 rounded-xl border-slate-200"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">
                    نوع الصلاحية
                  </label>
                  <select
                    className="w-full h-13 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as UserRole })
                    }
                  >
                    <option value="cashier">كاشير</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </div>

              <PasswordRules checks={currentPassChecks} />

              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-black text-white px-10 h-13 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="animate-spin ml-2" />
                  ) : (
                    <Check className="ml-2" />
                  )}
                  اعتماد وحفظ الموظف
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Users Table */}
        <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-slate-500 font-bold">الموظف</th>
                <th className="p-5 text-slate-500 font-bold">اسم المستخدم</th>
                <th className="p-5 text-slate-500 font-bold text-center">
                  الحالة
                </th>
                <th className="p-5 text-slate-500 font-bold text-center">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMasterAdmin = u.username === MASTER_ADMIN_USERNAME;
                const isMe = u.id === currentUser?.id;
                const canChangePass =
                  !isMasterAdmin ||
                  (isMasterAdmin &&
                    currentUser?.username === MASTER_ADMIN_USERNAME);

                return (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 hover:bg-orange-50/20 transition-colors group"
                  >
                    <td className="p-5 font-bold text-slate-700">{u.name}</td>
                    <td className="p-5">
                      <span className="text-slate-800 font-mono text-xs bg-slate-100 w-fit px-2 py-0.5 rounded">
                        {u.username}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${u.role === "admin" ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        {u.role === "admin" ? "ADMIN" : "CASHIER"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canChangePass && (
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            title="تغيير كلمة المرور"
                          >
                            <Key size={20} />
                          </button>
                        )}
                        {!isMasterAdmin && !isMe && (
                          <button
                            onClick={() => setUserToDelete(u)} // فتح المودال بدلاً من الـ alert
                            className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                            title="حذف الموظف"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop Alert المخصص للحذف */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center border border-white/20"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">
                تأكيد حذف الحساب
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                هل أنتِ متأكدة من حذف الموظف{" "}
                <span className="text-red-600 font-bold">
                  {userToDelete.name}
                </span>
                ؟
                <br />{" "}
                <span className="text-xs">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={confirmDelete}
                  disabled={isDeletingProcess}
                  className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95"
                >
                  {isDeletingProcess ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    "نعم، حذف"
                  )}
                </Button>
                <Button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingProcess}
                  className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  تراجع
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال تغيير كلمة المرور */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-10 rounded-[3rem] max-w-md w-full shadow-2xl relative"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
                  <LockIcon size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">
                  تحديث الأمان
                </h2>
                <p className="text-slate-400 mt-1">
                  تغيير باسوورد:{" "}
                  <span className="text-orange-600 font-bold">
                    {viewingUser.name}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="كلمة المرور الجديدة"
                  className="h-16 rounded-2xl text-center text-xl border-slate-100 bg-slate-50 focus:bg-white transition-all shadow-inner"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <PasswordRules checks={currentPassChecks} />
                </div>

                <Button
                  onClick={handleUpdatePass}
                  disabled={isUpdating || !isPassValid}
                  className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white text-xl font-black rounded-2xl shadow-lg shadow-orange-200 disabled:grayscale transition-all"
                >
                  {isUpdating ? (
                    <RefreshCw className="animate-spin ml-2" />
                  ) : (
                    "تحديث كلمة السر"
                  )}
                </Button>

                <button
                  onClick={() => {
                    setViewingUser(null);
                    setNewPass("");
                  }}
                  className="w-full text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  إلغاء وإغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
