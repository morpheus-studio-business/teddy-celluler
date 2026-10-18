"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Loader2, Plus, Save } from "lucide-react";
import { createProduct, updateProduct } from "@/app/actions/products";

const PROVIDERS = [
  "Telkomsel",
  "Indosat",
  "XL",
  "Axis",
  "Tri",
  "Smartfren",
  "By.U",
  "Live.On",
];

const ACTIVE_PERIODS = [
  { label: "1 Hari", value: 1 },
  { label: "3 Hari", value: 3 },
  { label: "5 Hari", value: 5 },
  { label: "7 Hari", value: 7 },
  { label: "14 Hari", value: 14 },
  { label: "28 Hari", value: 28 },

  { label: "60 Hari", value: 60 },
  { label: "90 Hari", value: 90 },
];

export interface ProductInitialData {
  id: string;
  provider: string;
  quota: string | null;
  activePeriod: number;
  capitalPrice: number;
  sellingPrice: number;
}

interface ProductEntryFormProps {
  category: "voucher" | "paket_data" | "pulsa" | "other";
  title?: string;
  onSuccess?: () => void;
  initialData?: ProductInitialData | null;
}

export function ProductEntryForm({
  category,
  onSuccess,
  initialData,
}: ProductEntryFormProps) {
  const isEditing = !!initialData;

  const providerList = useMemo(() => {
    if (initialData?.provider && !PROVIDERS.includes(initialData.provider)) {
      return [initialData.provider, ...PROVIDERS];
    }
    return PROVIDERS;
  }, [initialData?.provider]);

  const standardDays = ACTIVE_PERIODS.map((p) => p.value);
  const initialIsStandard = initialData
    ? standardDays.includes(initialData.activePeriod)
    : true;

  const [provider, setProvider] = useState(
    initialData
      ? initialData.provider
      : category === "other"
        ? ""
        : PROVIDERS[0],
  );
  const [quota, setQuota] = useState(
    initialData?.quota && initialData.quota !== "-" ? initialData.quota : "",
  );
  const [activeDays, setActiveDays] = useState(
    initialData && initialIsStandard
      ? initialData.activePeriod.toString()
      : ACTIVE_PERIODS[5].value.toString(),
  ); // Default 28 days
  const [useCustomDays, setUseCustomDays] = useState(
    initialData ? !initialIsStandard && initialData.activePeriod > 0 : false,
  );
  const [customDays, setCustomDays] = useState(
    initialData && !initialIsStandard
      ? initialData.activePeriod.toString()
      : "",
  );
  const [capitalPrice, setCapitalPrice] = useState(
    initialData ? initialData.capitalPrice.toString() : "",
  );
  const [sellingPrice, setSellingPrice] = useState(
    initialData ? initialData.sellingPrice.toString() : "",
  );
  const [isPending, setIsPending] = useState(false);

  // Calculate profit
  const modal = parseInt(capitalPrice) || 0;
  const jual = parseInt(sellingPrice) || 0;
  const profit = jual - modal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category !== "other" && (!capitalPrice || !quota)) {
      alert("Mohon lengkapi semua data");
      return;
    }
    if (!sellingPrice) {
      alert("Mohon isi harga jual");
      return;
    }
    if (category === "other" && !provider) {
      alert("Mohon isi keterangan/nama produk");
      return;
    }

    setIsPending(true);

    const mappedCategory =
      category === "paket_data"
        ? "data_package"
        : category === "pulsa"
          ? "pulsa"
          : category === "other"
            ? "other"
            : "voucher";

    const period =
      category === "pulsa" || category === "other"
        ? 0
        : useCustomDays
          ? parseInt(customDays) || 0
          : parseInt(activeDays) || 0;

    const result = isEditing
      ? await updateProduct({
          id: initialData.id,
          category: mappedCategory,
          provider,
          quota: category === "other" ? "-" : quota,
          activePeriod: period,
          capitalPrice: modal,
          sellingPrice: jual,
        })
      : await createProduct({
          category: mappedCategory,
          provider,
          quota: category === "other" ? "-" : quota,
          activePeriod: period,
          capitalPrice: modal,
          sellingPrice: jual,
        });

    setIsPending(false);

    if (result.success) {
      if (category === "other" && !isEditing) setProvider("");
      if (!isEditing) setQuota("");
      if (onSuccess) onSuccess();
    } else {
      alert(`Gagal menyimpan: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {category === "other" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nama Aksesoris / Produk
          </label>
          <input
            type="text"
            value={provider} // Reuse provider field for Description
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Contoh: Casing, Charger, Kabel Data, dll"
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Provider
          </label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Provider" />
            </SelectTrigger>
            <SelectContent>
              {providerList.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {category !== "other" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {category === "pulsa" ? "Besar Pulsa" : "Besar Kuota"}
          </label>
          <input
            type="text"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            placeholder={
              category === "pulsa"
                ? "Contoh: 5.000, 10.000, 100.000"
                : "Contoh: 1GB, 2.5GB, Unlimited"
            }
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
          />
        </div>
      )}

      {category !== "pulsa" && category !== "other" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Masa Aktif
          </label>
          <div className="flex gap-2">
            {!useCustomDays ? (
              <Select
                value={activeDays}
                onValueChange={(val) => {
                  if (val === "custom") {
                    setUseCustomDays(true);
                    // Not clearing activeDays yet in case they cancel
                  } else {
                    setActiveDays(val);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih Masa Aktif" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value.toString()}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-1 gap-2">
                <input
                  type="number"
                  placeholder="Hari"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setUseCustomDays(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Harga Modal
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
              Rp
            </span>
            <NumberInput
              value={capitalPrice}
              onValueChange={setCapitalPrice}
              className="pl-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {category === "other" ? "Harga Jual" : "Harga Jual"}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
              Rp
            </span>
            <NumberInput
              value={sellingPrice}
              onValueChange={setSellingPrice}
              className="pl-12 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Keuntungan
        </span>
        <span
          className={`text-lg font-bold ${
            profit > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : profit < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
          }`}
        >
          Rp {profit.toLocaleString("id-ID")}
        </span>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isEditing ? (
          <>
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Simpan Produk
          </>
        )}
      </button>
    </form>
  );
}
