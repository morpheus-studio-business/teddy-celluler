import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction, TransactionCategory } from "@/types";
import { updateTransaction } from "@/app/actions/transaction-actions";

interface EditTransactionProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditTransaction({
  transaction,
  onClose,
  onUpdate,
}: EditTransactionProps) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [adminFee, setAdminFee] = useState(transaction.adminFee.toString());
  const [category, setCategory] = useState<TransactionCategory>(
    transaction.category,
  );
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate total when amount/admin changes
  const currentTotal = (() => {
    const a = parseFloat(amount.replace(/\./g, "")) || 0;
    const f = parseFloat(adminFee) || 0;
    if (category === "withdraw") {
      return a - f;
    }
    return a + f;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Recalculate total just to be safe or use currentTotal
      // Logic is already in currentTotal which depends on category
      await updateTransaction({
        id: transaction.id,
        description,
        amount: parseFloat(amount) || 0,
        adminFee: parseFloat(adminFee) || 0,
        total: currentTotal, // This now reflects the correct logic
        category,
        type,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update transaction", error);
      alert("Gagal mengupdate transaksi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipe Transaksi</label>
          <Select
            value={type}
            onValueChange={(val) => setType(val as "income" | "expense")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Select
            value={category}
            onValueChange={(val) => setCategory(val as TransactionCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="voucher">Voucher</SelectItem>
              <SelectItem value="data_package">Paket Data</SelectItem>
              <SelectItem value="pulsa">Pulsa</SelectItem>
              <SelectItem value="withdraw">Tarik Tunai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Keterangan</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan transaksi"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nominal</label>
            <NumberInput
              value={amount}
              onValueChange={setAmount}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Fee</label>
            <NumberInput
              value={adminFee}
              onValueChange={setAdminFee}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Total (Auto)
          </label>
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(currentTotal)}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
