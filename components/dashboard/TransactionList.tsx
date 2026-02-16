import { Transaction } from "@/types";
import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { EditTransaction } from "@/components/dashboard/EditTransaction";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteTransaction } from "@/app/actions/transaction-actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionListProps {
  transactions: Transaction[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function TransactionList({
  transactions,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onRefresh,
  isLoading = false,
}: TransactionListProps) {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const router = useRouter();

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startEditing = (t: Transaction) => {
    setSelectedTransaction(t);
    setIsEditOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTransaction(deleteId);
    setDeleteId(null);
    if (onRefresh) onRefresh();
    else if (onPageChange) onPageChange(currentPage);
    else router.refresh();
  };

  const handleUpdate = () => {
    if (onRefresh) onRefresh();
    else if (onPageChange) onPageChange(currentPage);
    else router.refresh();
  };
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Memuat data transaksi...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border bg-white dark:bg-slate-950 shadow-sm p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
          <div className="h-6 w-6 text-slate-400" />
        </div>
        <p>Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-4">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-950 p-4 rounded-xl border dark:border-white/10 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 group">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {t.description}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditing(t)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => confirmDelete(t.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(new Date(t.date), "dd MMM yyyy, HH:mm", {
                    locale: id,
                  })}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Oleh: {t.creatorName || "Unknown"}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  t.type === "income"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                }`}
              >
                {t.type === "income" ? "Masuk" : "Keluar"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 mb-1">Harga</p>
                <p className="font-medium">{formatRupiah(t.amount)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span
                className={`text-lg font-bold ${
                  t.type === "income" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {t.type === "income" ? "+" : "-"} {formatRupiah(t.total)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-xl border bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px] text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Tanggal
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Keterangan
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Oleh
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Harga
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Jumlah
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow
                key={t.id}
                className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <TableCell className="py-4 font-medium text-slate-700 dark:text-slate-300">
                  {format(new Date(t.date), "dd MMM yyyy, HH:mm", {
                    locale: id,
                  })}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 group/edit">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {t.description}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/edit:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(t)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => confirmDelete(t.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {t.category === "withdraw"
                        ? "Tarik Tunai"
                        : t.category === "data_package"
                          ? "Paket Data"
                          : t.category === "e-wallet"
                            ? "E-Wallet"
                            : t.category === "other"
                              ? "Aksesoris"
                              : t.category === "general"
                                ? "Lainnya"
                                : t.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-500 dark:text-slate-400">
                  {t.creatorName || "-"}
                </TableCell>
                <TableCell className="text-right py-4 text-slate-600 dark:text-slate-400">
                  {formatRupiah(t.amount)}
                </TableCell>
                <TableCell className="text-right py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.type === "income"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"} {formatRupiah(t.total)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4 border-t dark:border-slate-800">
          <p className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 text-sm font-medium rounded-md border bg-white dark:bg-slate-900 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() =>
                onPageChange?.(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1 text-sm font-medium rounded-md border bg-white dark:bg-slate-900 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Transaksi"
      >
        {selectedTransaction && (
          <EditTransaction
            transaction={selectedTransaction}
            onClose={() => setIsEditOpen(false)}
            onUpdate={handleUpdate}
          />
        )}
      </TransactionModal>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus catatan transaksi ini? Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
