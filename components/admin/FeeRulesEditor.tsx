"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminFeeRule } from "@/types";
import {
  getAdminFeeRules,
  addAdminFeeRule,
  deleteAdminFeeRule,
} from "@/app/actions/admin-fee-actions";
import { NumberInput } from "@/components/ui/number-input";
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

interface FeeRulesEditorProps {
  category: "transfer" | "withdraw" | "e-wallet";
  title: string;
}

export function FeeRulesEditor({ category, title }: FeeRulesEditorProps) {
  const [rules, setRules] = useState<AdminFeeRule[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  useEffect(() => {
    getAdminFeeRules().then((allRules) => {
      setRules(allRules.filter((r) => r.category === category));
    });
  }, [category]);

  const handleAdd = async () => {
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    const fee = parseFloat(adminFee);

    if (isNaN(min) || isNaN(max) || isNaN(fee)) return;
    if (min > max) return;

    const updated = await addAdminFeeRule({
      category,
      minAmount: min,
      maxAmount: max,
      adminFee: fee,
    });
    setRules(updated.filter((r) => r.category === category));
    setMinAmount("");
    setMaxAmount("");
    setAdminFee("");
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const updated = await deleteAdminFeeRule(deleteId);
      setRules(updated.filter((r) => r.category === category));
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur range harga dan biaya admin untuk kategori{" "}
            <span className="font-medium">{title}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Aturan
        </button>
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Aturan Baru"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nominal Minimum
              </label>
              <NumberInput
                placeholder="1.000"
                value={minAmount}
                onValueChange={setMinAmount}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nominal Maksimum
              </label>
              <NumberInput
                placeholder="100.000"
                value={maxAmount}
                onValueChange={setMaxAmount}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Biaya Admin
              </label>
              <NumberInput
                placeholder="2.000"
                value={adminFee}
                onValueChange={setAdminFee}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-medium shadow-lg shadow-slate-900/20 transition-all hover:shadow-slate-900/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Aturan
            </button>
          </div>
        </div>
      </Modal>

      {/* Rules Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Daftar Aturan ({rules.length})
          </h3>
        </div>

        {rules.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Belum ada aturan biaya admin untuk kategori ini.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
                      No
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Range Nominal
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Biaya Admin
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rules.map((rule, idx) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-center">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium">
                        {formatCurrency(rule.minAmount)} —{" "}
                        {formatCurrency(rule.maxAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {formatCurrency(rule.adminFee)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteClick(rule.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {rules.map((rule, idx) => (
                <div key={rule.id} className="p-4 flex flex-col gap-3">
                  {/* Row 1: No & Range */}
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-mono text-sm pt-0.5 w-6 shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                          Range Nominal
                        </span>
                        <span>
                          {formatCurrency(rule.minAmount)} —{" "}
                          {formatCurrency(rule.maxAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Admin & Action */}
                  <div className="flex items-center justify-between pl-9">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                        Biaya Admin
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {formatCurrency(rule.adminFee)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(rule.id)}
                      className="p-2 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors self-end"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aturan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus aturan biaya ini? Tindakan ini
              tidak dapat dibatalkan.
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
