"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Plus,
  Trash2,
  Package,
  Calendar,
  Wifi,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ProductEntryForm } from "@/components/admin/ProductEntryForm";
import { getProducts, deleteProduct } from "@/app/actions/products";

interface Product {
  id: string;
  category: "voucher" | "data_package" | "pulsa" | "other";
  provider: string;
  quota: string | null;
  activePeriod: number;
  capitalPrice: number;
  sellingPrice: number;
  createdAt: Date;
}

interface ProductManagerProps {
  category: "voucher" | "data_package" | "pulsa" | "other"; // "paket_data" mapped to "data_package" in logic if needed
  title: string;
}

export function ProductManager({ category, title }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const data = await getProducts(category);
    startTransition(() => {
      setProducts(data as Product[]);
      setInitialLoading(false);
    });
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  const onSuccess = () => {
    setIsModalOpen(false);
    fetchProducts();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar produk {title}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Daftar Produk ({products.length})
          </h3>
        </div>

        {products.length === 0 && !initialLoading ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Belum ada produk yang tersedia.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      category === "voucher"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : category === "data_package"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : category === "pulsa"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {category === "voucher" ? (
                      <CreditCard className="h-5 w-5" />
                    ) : category === "data_package" ? (
                      <Wifi className="h-5 w-5" />
                    ) : category === "pulsa" ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-2">
                      {product.provider}{" "}
                      {product.quota && product.quota !== "-"
                        ? `- ${product.quota}`
                        : ""}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      {category !== "pulsa" && category !== "other" && (
                        <>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3" />
                            {product.activePeriod} Hari
                          </span>
                          <span>•</span>
                        </>
                      )}

                      <span className="whitespace-nowrap">
                        Modal: {formatCurrency(product.capitalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      +
                      {formatCurrency(
                        product.sellingPrice - product.capitalPrice,
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Tambah ${title}`}
      >
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <ProductEntryForm
            category={
              category === "data_package"
                ? "paket_data"
                : category === "pulsa"
                  ? "pulsa"
                  : category === "other"
                    ? "other"
                    : category
            }
            title=""
            onSuccess={onSuccess}
          />
        </div>
      </Modal>
    </div>
  );
}
