"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Landmark,
  Smartphone,
  Plus,
  History,
  Pencil,
  Trash2,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { FinancialAccount, BalanceLog, AccountType } from "@/types";
import {
  getFinancialAccounts,
  recordBalance,
  updateBalanceLog,
  deleteBalanceLog,
  getBalanceLogs,
  createFinancialAccount,
  deleteFinancialAccount,
} from "@/app/actions/balance-actions";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginRequired: () => void;
}

export function BalanceModal({
  isOpen,
  onClose,
  onLoginRequired,
}: BalanceModalProps) {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"accounts" | "history" | "new-account">("accounts");
  const [filterType, setFilterType] = useState<"all" | "bank" | "ewallet">("all");
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [logs, setLogs] = useState<BalanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Input Saldo state (untuk Pegawai / Admin)
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [inputNotes, setInputNotes] = useState("");

  // Edit Log state (Khusus Admin)
  const [editingLog, setEditingLog] = useState<BalanceLog | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Tambah Akun Baru (Khusus Admin)
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<AccountType>("bank");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const accList = await getFinancialAccounts();
      setAccounts(accList);
      const logList = await getBalanceLogs();
      setLogs(logList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStatusMessage(null);
      setSelectedAccount(null);
      setEditingLog(null);
    }
  }, [isOpen]);

  const filteredAccounts = useMemo(() => {
    if (filterType === "all") return accounts;
    return accounts.filter((a) => a.type === filterType);
  }, [accounts, filterType]);

  const totalBankBalance = useMemo(() => {
    return accounts
      .filter((a) => a.type === "bank")
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const totalEwalletBalance = useMemo(() => {
    return accounts
      .filter((a) => a.type === "ewallet")
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const totalGrandBalance = totalBankBalance + totalEwalletBalance;

  // Handler Submit Saldo Baru (Pegawai & Admin)
  const handleSaveBalance = () => {
    if (!session) {
      onLoginRequired();
      return;
    }
    if (!selectedAccount) return;
    const amountNum = parseInt(inputAmount || "0", 10);
    if (isNaN(amountNum) || amountNum < 0) {
      setStatusMessage({
        type: "error",
        text: "Nominal saldo harus diisi dengan angka valid.",
      });
      return;
    }

    startTransition(async () => {
      const res = await recordBalance({
        accountId: selectedAccount.id,
        amount: amountNum,
        notes: inputNotes,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Saldo ${selectedAccount.name} berhasil diperbarui menjadi ${formatRupiah(amountNum)}.`,
        });
        setSelectedAccount(null);
        setInputAmount("");
        setInputNotes("");
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal memperbarui saldo.",
        });
      }
    });
  };

  // Handler Edit Log Saldo (Khusus Admin)
  const handleSaveEditLog = () => {
    if (!isAdmin) {
      setStatusMessage({
        type: "error",
        text: "Akses ditolak: Hanya Admin yang dapat mengedit saldo!",
      });
      return;
    }
    if (!editingLog) return;
    const amountNum = parseInt(editAmount || "0", 10);
    if (isNaN(amountNum) || amountNum < 0) {
      setStatusMessage({
        type: "error",
        text: "Nominal saldo harus diisi dengan angka valid.",
      });
      return;
    }

    startTransition(async () => {
      const res = await updateBalanceLog({
        logId: editingLog.id,
        amount: amountNum,
        notes: editNotes,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Koreksi saldo berhasil disimpan oleh Admin.",
        });
        setEditingLog(null);
        setEditAmount("");
        setEditNotes("");
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal mengoreksi saldo.",
        });
      }
    });
  };

  // Handler Hapus Log Saldo (Khusus Admin)
  const handleDeleteLog = (logId: string) => {
    if (!isAdmin) {
      setStatusMessage({
        type: "error",
        text: "Akses ditolak: Hanya Admin yang dapat menghapus catatan saldo!",
      });
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus catatan saldo ini?")) return;

    startTransition(async () => {
      const res = await deleteBalanceLog(logId);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Catatan riwayat saldo telah dihapus oleh Admin.",
        });
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal menghapus catatan saldo.",
        });
      }
    });
  };

  // Handler Tambah Akun Baru (Khusus Admin)
  const handleCreateAccount = () => {
    if (!isAdmin) return;
    if (!newAccName.trim()) {
      setStatusMessage({
        type: "error",
        text: "Nama akun/bank/e-wallet wajib diisi.",
      });
      return;
    }

    startTransition(async () => {
      const initialNum = parseInt(newAccBalance || "0", 10);
      const res = await createFinancialAccount({
        name: newAccName,
        type: newAccType,
        accountNumber: newAccNumber,
        initialBalance: isNaN(initialNum) ? 0 : initialNum,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Akun "${newAccName}" berhasil ditambahkan.`,
        });
        setNewAccName("");
        setNewAccNumber("");
        setNewAccBalance("");
        setActiveTab("accounts");
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal membuat akun.",
        });
      }
    });
  };

  const handleDeleteAccount = (acc: FinancialAccount) => {
    if (!isAdmin) return;
    if (!confirm(`Hapus akun ${acc.name}?`)) return;

    startTransition(async () => {
      const res = await deleteFinancialAccount(acc.id);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Akun ${acc.name} telah dinonaktifkan.`,
        });
        await loadData();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal menghapus akun.",
        });
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saldo Bank & E-Wallet">
      <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Ringkasan Total Saldo */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-neutral-900 text-white rounded-xl p-4 sm:p-5 shadow-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-blue-400" />
              Total Saldo Semua Akun
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
              {accounts.length} Akun Terdaftar
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            {formatRupiah(totalGrandBalance)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Bank Transfer</p>
                <p className="font-semibold text-slate-200">
                  {formatRupiah(totalBankBalance)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">E-Wallet</p>
                <p className="font-semibold text-slate-200">
                  {formatRupiah(totalEwalletBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab("accounts");
                setSelectedAccount(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "accounts"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Daftar Akun
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                setEditingLog(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Riwayat Input
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("new-account")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === "new-account"
                  ? "bg-blue-600 text-white"
                  : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              }`}
              title="Tambah Akun Bank / E-Wallet Baru"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Akun
            </button>
          )}
        </div>

        {/* TAB 1: DAFTAR AKUN SALDO */}
        {activeTab === "accounts" && (
          <div className="space-y-3">
            {/* Filter Pill: Semua, Bank, E-Wallet */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                Semua ({accounts.length})
              </button>
              <button
                onClick={() => setFilterType("bank")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                  filterType === "bank"
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                Bank ({accounts.filter((a) => a.type === "bank").length})
              </button>
              <button
                onClick={() => setFilterType("ewallet")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                  filterType === "ewallet"
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                E-Wallet ({accounts.filter((a) => a.type === "ewallet").length})
              </button>
            </div>

            {/* FORM INPUT SALDO (Saat Pegawai/Admin Klik "Update Saldo") */}
            {selectedAccount && (
              <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border-2 border-emerald-500/60 shadow-md animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {selectedAccount.type === "bank" ? (
                        <Landmark className="h-4 w-4" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Input Saldo: {selectedAccount.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Saldo saat ini: {formatRupiah(selectedAccount.currentBalance)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jumlah Saldo Terakhir (Rp)
                    </label>
                    <NumberInput
                      value={inputAmount}
                      onValueChange={setInputAmount}
                      placeholder="Masukkan saldo yang ada..."
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Catatan (Opsional)
                    </label>
                    <Input
                      value={inputNotes}
                      onChange={(e) => setInputNotes(e.target.value)}
                      placeholder="Contoh: Shift Pagi, Rekap Tutup Toko, dsb."
                      className="text-xs"
                    />
                  </div>

                  {!isAdmin && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Periksa kembali sebelum simpan. Pegawai tidak dapat mengubah atau menghapus data setelah dikirim.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={handleSaveBalance}
                      disabled={isPending || !inputAmount}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isPending ? "Menyimpan..." : "Simpan Saldo"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAccount(null)}
                      disabled={isPending}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* List Akun */}
            {isLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span>Memuat data akun...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            account.type === "bank"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          }`}
                        >
                          {account.type === "bank" ? (
                            <Landmark className="h-4 w-4" />
                          ) : (
                            <Smartphone className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {account.name}
                          </h4>
                          {account.accountNumber && (
                            <p className="text-[11px] text-slate-500 font-mono">
                              {account.accountNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Saldo Tersedia
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(account.currentBalance)}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {account.lastUpdatedAt
                          ? format(new Date(account.lastUpdatedAt), "dd MMM HH:mm", {
                              locale: idLocale,
                            })
                          : "Belum pernah diupdate"}
                        {account.lastUpdatedBy ? ` • oleh ${account.lastUpdatedBy}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAccount(account);
                        setInputAmount(account.currentBalance ? String(account.currentBalance) : "");
                        setInputNotes("");
                      }}
                      className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <Pencil className="h-3 w-3 mr-1.5 text-slate-400" />
                      Input Saldo Baru
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* TAB 2: RIWAYAT INPUT (LOGS) */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {/* Modal/Form Koreksi Saldo khusus ADMIN */}
            {isAdmin && editingLog && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5 text-amber-600" />
                    Koreksi Catatan Saldo (Khusus Admin)
                  </h4>
                  <button
                    onClick={() => setEditingLog(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nominal Benar (Rp)
                  </label>
                  <NumberInput
                    value={editAmount}
                    onValueChange={setEditAmount}
                    placeholder="Nominal yang benar..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Alasan Koreksi
                  </label>
                  <Input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Contoh: Koreksi salah ketik oleh pegawai"
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEditLog}
                    disabled={isPending || !editAmount}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  >
                    {isPending ? "Menyimpan..." : "Simpan Koreksi"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingLog(null)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  Mode Pegawai: Anda hanya dapat melihat riwayat. Pengubahan atau penghapusan data hanya dapat dilakukan oleh Admin.
                </span>
              </div>
            )}

            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada riwayat input saldo.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.accountName || "Akun"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {log.accountType === "bank" ? "Bank" : "E-Wallet"}
                        </span>
                      </div>

                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(log.amount)}
                      </p>

                      {log.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                          &quot;{log.notes}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {log.userName}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tombol aksi KHUSUS ADMIN */}
                    {isAdmin ? (
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          onClick={() => {
                            setEditingLog(log);
                            setEditAmount(String(log.amount));
                            setEditNotes(log.notes || "");
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Koreksi Jumlah (Admin)"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Hapus Entri (Admin)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded shrink-0">
                        Terkunci
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TAMBAH AKUN BARU (KHUSUS ADMIN) */}
        {activeTab === "new-account" && isAdmin && (
          <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              Tambah Rekening Bank atau E-Wallet Baru
            </h4>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Akun / Bank
                </label>
                <Input
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Contoh: Bank BSI, DANA Bisnis, Maxim Driver"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipe Akun
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccType("bank")}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                      newAccType === "bank"
                        ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Rekening Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccType("ewallet")}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-colors ${
                      newAccType === "ewallet"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    E-Wallet / Dompet
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor Rekening / No HP (Opsional)
                </label>
                <Input
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  placeholder="Contoh: 1234-01-000123-50-1"
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Saldo Awal (Opsional)
                </label>
                <NumberInput
                  value={newAccBalance}
                  onValueChange={setNewAccBalance}
                  placeholder="0"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  onClick={handleCreateAccount}
                  disabled={isPending || !newAccName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  {isPending ? "Menambahkan..." : "Tambah Akun"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("accounts")}
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
