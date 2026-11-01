"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Landmark,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { FinancialAccount } from "@/types";
import {
  getFinancialAccounts,
  recordBalance,
} from "@/app/actions/balance-actions";
import { authClient } from "@/lib/auth-client";

interface RecordBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onLoginRequired?: () => void;
}

export function RecordBalanceModal({
  isOpen,
  onClose,
  onSuccess,
  onLoginRequired,
}: RecordBalanceModalProps) {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [isPending, startTransition] = useTransition();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const list = await getFinancialAccounts();
      setAccounts(list);
      if (list.length > 0 && !selectedAccount) {
        setSelectedAccount(list[0]);
      }
    } catch (err) {
      console.error("Gagal memuat akun kas & bank:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setAmount("");
      setNotes("");
      fetchAccounts();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!session) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    if (!selectedAccount) {
      setStatusMessage({
        type: "error",
        text: "Pilih rekening bank atau e-wallet terlebih dahulu.",
      });
      return;
    }

    const numAmount = parseInt(amount || "0", 10);
    if (isNaN(numAmount) || numAmount < 0) {
      setStatusMessage({
        type: "error",
        text: "Nominal saldo harus diisi dengan angka valid.",
      });
      return;
    }

    startTransition(async () => {
      const res = await recordBalance({
        accountId: selectedAccount.id,
        amount: numAmount,
        notes: notes.trim(),
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Sisa saldo ${selectedAccount.name} berhasil disimpan (${formatRupiah(numAmount)}).`,
        });

        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal menyimpan saldo.",
        });
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Sisa Saldo Kas & Bank"
    >
      <div className="space-y-4 pt-1">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 1. Pilih Rekening / E-Wallet */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Pilih Rekening Bank / E-Wallet
          </label>

          {isLoadingAccounts ? (
            <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Memuat daftar akun...
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
              Belum ada rekening atau dompet digital yang terdaftar.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(acc);
                      setAmount(acc.currentBalance ? String(acc.currentBalance) : "");
                    }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        acc.type === "bank"
                          ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                          : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {acc.type === "bank" ? (
                        <Landmark className="h-3.5 w-3.5" />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {acc.name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {formatRupiah(acc.currentBalance)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Nominal Sisa Saldo */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Sisa Saldo Terkini (Rp)
          </label>
          <NumberInput
            value={amount}
            onValueChange={setAmount}
            placeholder="Masukkan sisa saldo riil saat ini..."
            autoFocus
          />
          {selectedAccount && (
            <p className="text-[11px] text-slate-400 mt-1">
              Saldo tercatat sebelumnya: <strong>{formatRupiah(selectedAccount.currentBalance)}</strong>
            </p>
          )}
        </div>

        {/* 3. Catatan Opsional */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Catatan (Opsional)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Sisa shift pagi, Tutup kasir, Rekap harian"
          />
        </div>

        {/* Info Pegawai vs Admin */}
        {!isAdmin && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Catatan sisa saldo ini akan otomatis tersimpan di halaman <strong>Kas & Bank</strong>. Pastikan nominal sudah benar sebelum disimpan.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-1/3"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !amount || !selectedAccount}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </span>
            ) : (
              "Simpan Sisa Saldo"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
