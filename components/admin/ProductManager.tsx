"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import {
  Plus,
  Trash2,
  Package,
  Calendar,
  Wifi,
  CreditCard,
  Smartphone,
  ChevronDown,
  Pencil,
} from "lucide-react";
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState("Semua");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  // Extract unique providers from actual product data
  const providers = useMemo(() => {
    const uniqueProviders = [
      ...new Set(products.map((p) => p.provider)),
    ].sort();
    return uniqueProviders;
  }, [products]);

  // Count products per provider
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.provider] = (counts[p.provider] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by active provider
  const displayedProducts = useMemo(() => {
    if (activeProvider === "Semua") return products;
    return products.filter((p) => p.provider === activeProvider);
  }, [products, activeProvider]);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const activeDeleteProduct = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
      fetchProducts();
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const onSuccess = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
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
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Provider Tabs */}
      {providers.length > 1 && (
        <>
          {/* Mobile: Dropdown Select */}
          <div className="md:hidden">
            <div className="relative">
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 pr-10 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              >
                <option value="Semua">
                  Semua Provider ({products.length})
                </option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider} ({providerCounts[provider] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Desktop: Pill Tabs */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide -mx-1 px-1">
            <div className="flex gap-2 pb-1 min-w-max">
              {/* Tab Semua */}
              <button
                onClick={() => setActiveProvider("Semua")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeProvider === "Semua"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Semua
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeProvider === "Semua"
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {/* Tab per Provider */}
              {providers.map((provider) => (
                <button
                  key={provider}
                  onClick={() => setActiveProvider(provider)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeProvider === provider
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {provider}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeProvider === provider
                        ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {providerCounts[provider] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Daftar Produk ({displayedProducts.length})
          </h3>
        </div>

        {displayedProducts.length === 0 && !initialLoading ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Belum ada produk yang tersedia.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedProducts.map((product) => (
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title="Edit Produk"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Hapus Produk"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit ${title}` : `Tambah ${title}`}
      >
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <ProductEntryForm
            key={editingProduct?.id || "new"}
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
            initialData={editingProduct}
            onSuccess={onSuccess}
          />
        </div>
      </Modal>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus produk ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={activeDeleteProduct}
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
