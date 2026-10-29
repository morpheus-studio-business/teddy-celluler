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
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
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
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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

export default function AdminSaldoPage() {
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

  // Dialog Konfirmasi Hapus
  const [accountToDelete, setAccountToDelete] = useState<FinancialAccount | null>(null);
  const [logToDelete, setLogToDelete] = useState<BalanceLog | null>(null);

  // Input Saldo Baru
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [inputNotes, setInputNotes] = useState("");

  // Edit Log Saldo (Koreksi Admin)
  const [editingLog, setEditingLog] = useState<BalanceLog | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Tambah Akun Baru
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
      const logList = await getBalanceLogs({ limit: 100 });
      setLogs(logList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Simpan Saldo Baru
  const handleSaveBalance = () => {
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

  // Simpan Koreksi Log Saldo
  const handleSaveEditLog = () => {
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

  // Konfirmasi Hapus Log Saldo
  const confirmDeleteLog = () => {
    if (!logToDelete) return;
    const log = logToDelete;
    setLogToDelete(null);

    startTransition(async () => {
      const res = await deleteBalanceLog(log.id);
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

  // Tambah Akun Baru
  const handleCreateAccount = () => {
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

  // Konfirmasi Hapus Akun
  const confirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const acc = accountToDelete;
    setAccountToDelete(null);

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Landmark className="h-6 w-6 text-blue-600" />
            Saldo Kas & Bank / E-Wallet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola dan pantau seluruh saldo rekening bank serta dompet digital toko.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="gap-2 self-start sm:self-auto"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Alert Status */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ringkasan Saldo Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Keseluruhan */}
        <div className="bg-slate-900 dark:bg-black text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Total Semua Saldo
            </span>
            <div className="p-1.5 rounded-full bg-white/10 text-white">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white mb-2">
            {formatRupiah(totalGrandBalance)}
          </div>
          <p className="text-xs text-slate-400">
            Akumulasi dari {accounts.length} rekening bank & e-wallet aktif
          </p>
        </div>

        {/* Bank Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Total Saldo Bank
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {formatRupiah(totalBankBalance)}
          </div>
          <p className="text-xs text-slate-500">
            {accounts.filter((a) => a.type === "bank").length} Rekening Bank
          </p>
        </div>

        {/* E-Wallet Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Total Saldo E-Wallet
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {formatRupiah(totalEwalletBalance)}
          </div>
          <p className="text-xs text-slate-500">
            {accounts.filter((a) => a.type === "ewallet").length} Akun E-Wallet
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              activeTab === "accounts"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Daftar Akun Saldo
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <History className="h-4 w-4" />
            Riwayat Input & Log
          </button>
        </div>

        <button
          onClick={() => setActiveTab("new-account")}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === "new-account"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100"
          }`}
        >
          <Plus className="h-4 w-4" />
          Tambah Rekening / E-Wallet Baru
        </button>
      </div>

      {/* TAB 1: DAFTAR AKUN */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filterType === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Semua ({accounts.length})
            </button>
            <button
              onClick={() => setFilterType("bank")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filterType === "bank"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Bank ({accounts.filter((a) => a.type === "bank").length})
            </button>
            <button
              onClick={() => setFilterType("ewallet")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filterType === "ewallet"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              E-Wallet ({accounts.filter((a) => a.type === "ewallet").length})
            </button>
          </div>

          {/* Form Input Saldo Cepat */}
          {selectedAccount && (
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500/60 shadow-lg animate-in fade-in space-y-4 max-w-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Update Saldo: {selectedAccount.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Saldo saat ini: {formatRupiah(selectedAccount.currentBalance)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nominal Saldo Terakhir (Rp)
                </label>
                <NumberInput
                  value={inputAmount}
                  onValueChange={setInputAmount}
                  placeholder="Ketik saldo baru..."
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
                  placeholder="Contoh: Rekap Tutup Toko, Pagi Hari"
                  className="text-xs"
                />
              </div>

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
          )}

          {/* Grid Akun */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl shrink-0 ${
                          account.type === "bank"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        }`}
                      >
                        {account.type === "bank" ? (
                          <Landmark className="h-5 w-5" />
                        ) : (
                          <Smartphone className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {account.name}
                        </h4>
                        {account.accountNumber && (
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {account.accountNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setAccountToDelete(account)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus / Nonaktifkan Akun"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs text-slate-400 uppercase font-semibold">
                      Saldo Tersedia
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(account.currentBalance)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {account.lastUpdatedAt
                        ? format(new Date(account.lastUpdatedAt), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })
                        : "Belum pernah diupdate"}
                      {account.lastUpdatedBy ? ` • ${account.lastUpdatedBy}` : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAccount(account);
                      setInputAmount(account.currentBalance ? String(account.currentBalance) : "");
                      setInputNotes("");
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Update Saldo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT INPUT (ADMIN LOGS) */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Form Koreksi Modal */}
          {editingLog && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-300 dark:border-amber-800 max-w-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Koreksi Kesalahan Input Saldo (Admin)
                </h4>
                <button
                  onClick={() => setEditingLog(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nominal Benar (Rp)
                </label>
                <NumberInput
                  value={editAmount}
                  onValueChange={setEditAmount}
                  placeholder="Ketik nominal yang benar..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Alasan Koreksi
                </label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Koreksi typo nol oleh pegawai"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleSaveEditLog}
                  disabled={isPending || !editAmount}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Koreksi"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingLog(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Catatan Seluruh Riwayat Input Saldo
              </h3>
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Belum ada data riwayat input saldo.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {log.accountName || "Akun"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          {log.accountType === "bank" ? "Bank" : "E-Wallet"}
                        </span>
                      </div>

                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatRupiah(log.amount)}
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-500 italic mt-0.5">
                          &quot;{log.notes}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" />
                          Diinput oleh: <strong className="text-slate-600 dark:text-slate-300">{log.userName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(log.createdAt), "dd MMMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLog(log);
                          setEditAmount(String(log.amount));
                          setEditNotes(log.notes || "");
                        }}
                        className="text-xs gap-1.5 hover:text-amber-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Koreksi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLogToDelete(log)}
                        className="text-xs gap-1.5 hover:text-rose-600 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TAMBAH AKUN BARU */}
      {activeTab === "new-account" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Tambah Rekening Bank atau E-Wallet Baru
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Akun / Bank
              </label>
              <Input
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                placeholder="Contoh: Bank BSI, DANA Bisnis, Maxim Driver"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipe Akun
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewAccType("bank")}
                  className={`py-2.5 px-3 text-xs rounded-xl font-medium border text-center transition-colors ${
                    newAccType === "bank"
                      ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Rekening Bank
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccType("ewallet")}
                  className={`py-2.5 px-3 text-xs rounded-xl font-medium border text-center transition-colors ${
                    newAccType === "ewallet"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  E-Wallet / Dompet Digital
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
                className="font-mono text-xs"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? "Menambahkan..." : "Tambah Akun"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab("accounts")}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Akun Bank / E-Wallet */}
      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Rekening / E-Wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan akun <strong>{accountToDelete?.name}</strong>? Tindakan ini akan menghapus akun dari daftar tampilan saldo toko.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog Konfirmasi Hapus Catatan Log Saldo */}
      <AlertDialog
        open={!!logToDelete}
        onOpenChange={(open) => !open && setLogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Riwayat Saldo?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan saldo untuk <strong>{logToDelete?.accountName}</strong> sebesar <strong>{logToDelete ? formatRupiah(logToDelete.amount) : ""}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLog}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus Catatan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
