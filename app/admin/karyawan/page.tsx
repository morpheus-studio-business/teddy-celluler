"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Users,
  Shield,
  User as UserIcon,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { User } from "@/types";
import {
  getUsers,
  deleteUser,
  updateUserRole,
  createUser,
} from "@/app/actions/user-actions";

import { Modal } from "@/components/ui/modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "karyawan">("karyawan");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  const handleAdd = async () => {
    if (!name || !email || !password) {
      setError("Semua kolom harus diisi");
      return;
    }

    setIsPending(true);
    setError("");

    try {
      // Use server action to create user without signing in
      const result = await createUser({
        name,
        email,
        password,
        role,
      });

      if (!result.success) {
        setError(result.error || "Gagal menambah user");
        setIsPending(false);
        return;
      }

      // Refresh list
      const updatedList = await getUsers();
      setUsers(updatedList);
      setName("");
      setEmail("");
      setPassword("");
      setRole("karyawan");
      setIsPending(false);
      setIsModalOpen(false); // Close modal on success
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      console.error(err);
      setError(message);
      setIsPending(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const updated = await deleteUser(deleteId);
      setUsers(updated);
      setDeleteId(null);
    }
  };

  const handleRoleChange = async (
    id: string,
    newRole: "admin" | "karyawan",
  ) => {
    const updated = await updateUserRole(id, newRole);
    setUsers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Kelola User
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tambah user dan atur role
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah User Baru"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "karyawan")
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              >
                <option value="karyawan">Karyawan</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={handleAdd}
              disabled={isPending}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-medium shadow-lg shadow-slate-900/20 transition-all hover:shadow-slate-900/30 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 justify-center mt-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tambah User
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="text-xs text-rose-500 text-center">{error}</p>
          )}
        </div>
      </Modal>

      {/* User List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Daftar User ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Belum ada user yang terdaftar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.role === "admin"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{user.name}</span>
                      {user.role === "admin" ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          <Shield className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <UserIcon className="h-2.5 w-2.5" />
                          Karyawan
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                      Bergabung:{" "}
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-3.25rem sm:pl-0">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(
                        user.id,
                        e.target.value as "admin" | "karyawan",
                      )
                    }
                    className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="karyawan">Karyawan</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleDeleteClick(user.id)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
                    title="Hapus User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus user ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
