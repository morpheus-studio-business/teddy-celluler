import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getProducts } from "@/app/actions/products";
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
import { TransactionCategory, Product } from "@/types";
import { findAdminFee } from "@/app/actions/admin-fee-actions";

interface AddTransactionProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    adminFee: number;
    total: number;
    category: TransactionCategory;
    type: "income" | "expense";
    capitalPrice?: number;
    productId?: string;
  }) => void;
  defaultCategory?: TransactionCategory;
  mode: "income" | "expense";
}

export function AddTransaction({
  onAdd,
  defaultCategory = "transfer",
  mode,
}: AddTransactionProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [category, setCategory] =
    useState<TransactionCategory>(defaultCategory);

  // Product Selection Support
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [capitalPrice, setCapitalPrice] = useState<number>(0);

  useEffect(() => {
    // Reset category when mode changes to ensure valid selection
    if (mode === "income") {
      const validIncomeCategories: TransactionCategory[] = [
        "transfer",
        "e-wallet",
        "voucher",
        "data_package",
        "pulsa",
        "other",
        "general",
      ];
      if (!validIncomeCategories.includes(category)) {
        setCategory("transfer");
      }
    } else {
      // Expense mode
      const validExpenseCategories: TransactionCategory[] = [
        "withdraw",
        "general",
      ];
      if (!validExpenseCategories.includes(category)) {
        setCategory("withdraw");
      }
    }
  }, [mode, category]);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  // Fetch products when category changes
  useEffect(() => {
    if (["voucher", "data_package", "pulsa", "other"].includes(category)) {
      getProducts(
        category as "voucher" | "data_package" | "pulsa" | "other",
      ).then((data) => {
        setProducts(data as Product[]);
        setSelectedProductId("");
        setSelectedProvider("");
        if (data.length > 0) setDescription("");
      });
    } else {
      setProducts([]);
      setSelectedProductId("");
      setSelectedProvider("");
    }
  }, [category]);

  const uniqueProviders = React.useMemo(() => {
    if (category === "other") return [];
    return Array.from(new Set(products.map((p) => p.provider)));
  }, [products, category]);

  const filteredProducts = React.useMemo(() => {
    if (category === "other") return products;
    if (!selectedProvider) return [];
    return products.filter((p) => p.provider === selectedProvider);
  }, [products, category, selectedProvider]);

  const handleProductChange = (productId: string) => {
    if (productId === "manual_input") {
      setSelectedProductId("manual_input");
      setDescription("");
      setAmount("");
      setCapitalPrice(0);
      setAdminFee("");
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductId(productId);

      let productName = "";
      if (category === "other") {
        productName = product.provider;
      } else {
        // for voucher/data/pulsa: Provider - Quota - ActivePeriod
        productName = `${product.provider} ${product.quota ? "- " + product.quota : ""} ${product.activePeriod ? "- " + product.activePeriod + " Hari" : ""}`;
      }

      setDescription(productName);
      setAmount(product.sellingPrice.toString());
      setCapitalPrice(product.capitalPrice);
    } else {
      // Manual or reset
      setSelectedProductId("");
      setCapitalPrice(0);
    }
  };

  // Auto-fill admin fee based on amount and category
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      // Determine fee category
      let feeCategory: "withdraw" | "transfer" | "e-wallet" | null = null;
      if (category === "withdraw") feeCategory = "withdraw";
      else if (category === "e-wallet") feeCategory = "e-wallet";
      else if (category === "transfer") feeCategory = "transfer";

      if (feeCategory) {
        findAdminFee(feeCategory, parsedAmount).then((fee) => {
          if (fee !== null) {
            setAdminFee(fee.toString());
          } else {
            setAdminFee("");
          }
        });
      } else {
        // For other categories like voucher, pulsa, other - maybe no auto admin fee or handle differently
        // Keeping existing behavior: if not withdraw/transfer (and now e-wallet), clear or keep manual?
        // Previous code only had transfer/withdraw logic.
        // Let's clear it if not one of those types to avoid stuck values
        setAdminFee("");
      }
    }
  }, [amount, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const parsedAmount = parseFloat(amount) || 0;
    const parsedAdmin = parseFloat(adminFee) || 0;

    const calculatedTotal = parsedAmount + parsedAdmin;
    const type: "income" | "expense" = mode;

    // Special logic for General Income:
    // Profit should be 0, so Capital Price must equal Amount
    let finalCapitalPrice = selectedProductId ? capitalPrice : undefined;
    if (category === "general") {
      if (type === "income") {
        finalCapitalPrice = parsedAmount;
      } else {
        finalCapitalPrice = 0;
      }
    }

    onAdd({
      description,
      amount: parsedAmount,
      adminFee: parsedAdmin,
      total: calculatedTotal,
      category,
      type,
      capitalPrice: finalCapitalPrice || 0,
      productId: selectedProductId || undefined,
    });

    setDescription("");
    setAmount("");
    setAdminFee("");
    setSelectedProductId("");
    setSelectedProvider("");
    setCapitalPrice(0);
    if (mode === "income") setCategory("transfer");
    else setCategory("withdraw");
  };

  // Calculate generic total for display
  const currentTotal = (() => {
    const a = parseFloat(amount) || 0;
    const f = parseFloat(adminFee) || 0;
    return a + f;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* ... form content ... */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Select
            value={category}
            onValueChange={(val) => setCategory(val as TransactionCategory)}
          >
            <SelectTrigger className="w-full bg-white dark:bg-slate-950">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {mode === "income" ? (
                <>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="data_package">Paket Data</SelectItem>
                  <SelectItem value="pulsa">Pulsa</SelectItem>
                  <SelectItem value="other">Aksesoris</SelectItem>
                  <SelectItem value="general">Lainnya</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="withdraw">Tarik Tunai</SelectItem>
                  <SelectItem value="general">Lainnya</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {uniqueProviders.length > 0 && (
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                <SelectValue placeholder="Pilih Provider" />
              </SelectTrigger>
              <SelectContent>
                {uniqueProviders.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-2 space-y-2">
          <label className="text-sm font-medium">
            {products.length > 0 ? "Pilih Produk" : "Keterangan / Tujuan"}
          </label>

          {products.length > 0 ? (
            <Select
              value={selectedProductId}
              onValueChange={handleProductChange}
              disabled={uniqueProviders.length > 0 && !selectedProvider}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                <SelectValue
                  placeholder={
                    uniqueProviders.length > 0 && !selectedProvider
                      ? "Pilih Provider Dulu"
                      : "-- Pilih Produk --"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {category === "other"
                      ? `${p.provider} - ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.sellingPrice)}`
                      : `${p.quota || "-"} | ${p.activePeriod} Hari | ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.sellingPrice)}`}
                  </SelectItem>
                ))}
                <SelectItem value="manual_input">Input Manual...</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={
                category === "withdraw"
                  ? "Contoh: Tarik Tunai BCA"
                  : category === "general"
                    ? "Keterangan Manual..."
                    : "Keterangan Transaksi..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}

          {(selectedProductId === "manual_input" ||
            (products.length > 0 && !selectedProductId)) &&
            !(uniqueProviders.length > 0 && !selectedProvider) && (
              <Input
                className={`mt-2 ${selectedProductId === "" && products.length > 0 ? "hidden" : ""}`}
                placeholder={
                  category === "other"
                    ? "Contoh: Casing HP"
                    : "Keterangan Manual..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Manual Capital Price Input */}
        {selectedProductId === "manual_input" && (
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Harga Modal</label>
            <NumberInput
              placeholder="0"
              value={capitalPrice.toString()}
              onValueChange={(val) => setCapitalPrice(parseFloat(val) || 0)}
              className="bg-white dark:bg-slate-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">
            {mode === "income" ? "Harga Jual" : "Nominal"}
          </label>
          <NumberInput
            placeholder="0"
            value={amount}
            onValueChange={setAmount}
            className={
              selectedProductId && selectedProductId !== "manual_input"
                ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                : ""
            }
          />
        </div>

        {["transfer", "withdraw", "e-wallet"].includes(category) && (
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Biaya Admin</label>
            <NumberInput
              placeholder="Otomatis"
              value={adminFee}
              onValueChange={(val) => {
                if (!["transfer", "withdraw", "e-wallet"].includes(category))
                  setAdminFee(val);
              }}
              readOnly={["transfer", "withdraw", "e-wallet"].includes(category)}
              className={`transition-colors ${["transfer", "withdraw", "e-wallet"].includes(category) ? "opacity-70 cursor-not-allowed bg-slate-100 dark:bg-neutral-800" : "bg-white dark:bg-slate-950"} border-neutral-700`}
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Total {mode === "expense" ? "Keluar" : "Masuk"}
          </label>
          <div
            className={`flex h-10 w-full items-center rounded-md border border-input px-3 py-2 text-sm font-medium ${mode === "expense" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
          >
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(currentTotal)}
          </div>
        </div>
        <Button
          type="submit"
          className={`w-full md:w-auto ${
            mode === "expense"
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20"
          } text-white shadow-lg`}
        >
          <Plus className="mr-2 h-4 w-4" />
          Simpan
        </Button>
      </div>
    </form>
  );
}
