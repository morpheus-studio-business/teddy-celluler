"use client";

import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClipboardList,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Calendar as CalendarIcon,
  Share2,
} from "lucide-react";
import { Transaction, TransactionCategory, FilterType } from "@/types";
import { getTransactions } from "@/app/actions/transaction-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categoryOptions: { value: TransactionCategory | "all"; label: string }[] =
  [
    { value: "all", label: "Semua Kategori" },
    { value: "transfer", label: "Transfer" },
    { value: "withdraw", label: "Tarik Tunai" },
    { value: "voucher", label: "Voucher" },
    { value: "data_package", label: "Paket Data" },
    { value: "pulsa", label: "Pulsa" },
    { value: "e-wallet", label: "E-Wallet" },
    { value: "other", label: "Aksesoris" },
    { value: "general", label: "Lainnya" },
  ];

const dateOptions: { value: FilterType | "custom"; label: string }[] = [
  { value: "all", label: "Semua Waktu" },
  { value: "daily", label: "Hari Ini" },
  { value: "weekly", label: "Minggu Ini" },
  { value: "monthly", label: "Bulan Ini" },
  { value: "yearly", label: "Tahun Ini" },
  { value: "custom", label: "Custom Tanggal" },
];

export default function AdminRecapPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions({ limit: 0 }).then((res) => {
      setAllTransactions(res.data);
      setLoading(false);
    });
  }, []);

  const [categoryFilter, setCategoryFilter] = useState<
    TransactionCategory | "all"
  >("all");
  const [dateFilter, setDateFilter] = useState<FilterType | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = useMemo(() => {
    const result = allTransactions.filter((t) => {
      // Category filter
      if (categoryFilter !== "all" && t.category !== categoryFilter)
        return false;

      // Date filter
      const date = new Date(t.date);
      const now = new Date();

      if (dateFilter === "daily") {
        if (
          date.getDate() !== now.getDate() ||
          date.getMonth() !== now.getMonth() ||
          date.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (dateFilter === "weekly") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (date < oneWeekAgo) return false;
      } else if (dateFilter === "monthly") {
        if (
          date.getMonth() !== now.getMonth() ||
          date.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (dateFilter === "yearly") {
        if (date.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === "custom") {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); // Start of day
          if (date < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // End of day
          if (date > end) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(lowerQuery) ||
          t.amount.toString().includes(lowerQuery) ||
          t.total.toString().includes(lowerQuery)
        );
      }

      return true;
    });

    // Sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const aValue = a[key] ?? "";
        const bValue = b[key] ?? "";
        if (aValue < bValue) {
          return direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by date desc
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    return result;
  }, [
    allTransactions,
    categoryFilter,
    dateFilter,
    startDate,
    endDate,
    searchQuery,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (key: keyof Transaction) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Calculate Cutoff Date for "Previous Balance"
  const cutoffDate = useMemo(() => {
    const now = new Date();
    if (dateFilter === "daily") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (dateFilter === "weekly") {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (dateFilter === "monthly") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (dateFilter === "yearly") {
      return new Date(now.getFullYear(), 0, 1);
    }
    if (dateFilter === "custom" && startDate) {
      const d = new Date(startDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null; // All time
  }, [dateFilter, startDate]);

  // Calculate Previous Balance
  const previousBalance = useMemo(() => {
    if (!cutoffDate) return 0; // If all time, no previous balance (or 0)

    return allTransactions
      .filter((t) => {
        // Apply Category Filter
        if (categoryFilter !== "all" && t.category !== categoryFilter)
          return false;

        // Apply Date Filter (Strictly less than cutoff)
        const tDate = new Date(t.date);
        return tDate < cutoffDate;
      })
      .reduce((acc, t) => {
        if (t.type === "income") return acc + t.total;
        return acc - t.total;
      }, 0);
  }, [allTransactions, categoryFilter, cutoffDate]);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.total, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.total, 0);

  const calculateProfit = (t: Transaction) => {
    // General category: Profit is always 0
    if (t.category === "general") return 0;

    // Service categories: Profit is Admin Fee
    if (["transfer", "withdraw", "e-wallet"].includes(t.category)) {
      return t.adminFee;
    }

    // Expense type (fallback): Profit is 0
    if (t.type === "expense") return 0;

    // Product categories: Profit is Sales (Total) - Capital
    // If capitalPrice is null/0, it assumes 100% profit (or 0 cost)
    return t.total - (t.capitalPrice || 0);
  };

  const totalProfit = filteredTransactions.reduce((sum, t) => {
    return sum + calculateProfit(t);
  }, 0);

  const currentPeriodBalance = totalIncome - totalExpense;
  const totalEndingBalance = previousBalance + currentPeriodBalance;

  const handleShareWhatsApp = () => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Laporan Rekap Transaksi", 14, 22);

    // Add Period Info
    doc.setFontSize(11);
    let periodText = `Periode Filter: ${dateOptions.find((d) => d.value === dateFilter)?.label}`;
    if (dateFilter === "custom") {
      const s = startDate
        ? new Date(startDate).toLocaleDateString("id-ID")
        : "...";
      const e = endDate ? new Date(endDate).toLocaleDateString("id-ID") : "...";
      periodText += ` (${s} - ${e})`;
    }

    doc.text(periodText, 14, 30);
    doc.text(
      `Kategori: ${categoryOptions.find((c) => c.value === categoryFilter)?.label}`,
      14,
      36,
    );

    // Add Summary
    let yPos = 46;
    doc.text(`Saldo Sebelumnya: ${formatCurrency(previousBalance)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pengeluaran: ${formatCurrency(totalExpense)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Keuntungan: ${formatCurrency(totalProfit)}`, 14, yPos);
    yPos += 6;
    doc.text(
      `Saldo Periode Ini: ${formatCurrency(currentPeriodBalance)}`,
      14,
      yPos,
    );
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Akhir: ${formatCurrency(totalEndingBalance)}`, 14, yPos);
    yPos += 10;
    doc.setFont("helvetica", "normal");

    // Add Table
    const tableData = filteredTransactions.map((t, idx) => [
      idx + 1,
      formatDate(t.date),
      categoryOptions.find((c) => c.value === t.category)?.label || t.category,
      t.description,
      formatCurrency(t.amount),
      formatCurrency(calculateProfit(t)),
      formatCurrency(t.total),
    ]);

    autoTable(doc, {
      head: [
        [
          "No",
          "Tanggal",
          "Kategori",
          "Keterangan",
          "Nominal",
          "Admin",
          "Total",
        ],
      ],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    });

    // Save PDF as Blob
    const pdfBlob = doc.output("blob");

    // Create a File object from the Blob
    const file = new File([pdfBlob], "laporan_transaksi.pdf", {
      type: "application/pdf",
    });

    // Check if Web Share API is available and can share files
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({
          files: [file],
          title: "Laporan Transaksi",
          text: "Berikut adalah laporan rekap transaksi.",
        })
        .catch((error) => console.log("Sharing failed", error));
    } else {
      // Fallback: Just download it or alert user
      doc.save("laporan_transaksi.pdf");
      alert(
        "File PDF telah diunduh. Silakan kirim file tersebut secara manual ke WhatsApp.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Rekap Transaksi
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ringkasan keuangan dan riwayat transaksi.
            </p>
          </div>
        </div>

        {/* Filters & Action */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1 xl:flex-none">
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-3 py-2 text-sm border rounded-md w-full xl:w-[250px] focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-950 dark:border-slate-800"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(val) =>
                setCategoryFilter(val as TransactionCategory | "all")
              }
            >
              <SelectTrigger className="w-full xl:w-[180px] bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Kategori" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(val) =>
                setDateFilter(val as FilterType | "custom")
              }
            >
              <SelectTrigger className="w-full xl:w-[180px] bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <SelectValue placeholder="Periode" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Pickers */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 shadow-sm">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300 w-[110px]"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300 w-[110px]"
                />
              </div>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors shadow-sm ml-auto xl:ml-0 w-full xl:w-auto"
              title="Bagikan Laporan PDF ke WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              Share PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Previous Balance */}
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo Sebelumnya
            </CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(previousBalance)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Akumulasi sebelum periode ini
            </p>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Pemasukan
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Pengeluaran
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>

        {/* Profit Card (Admin Fee) */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Total Keuntungan
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Dari biaya admin & margin produk
            </p>
          </CardContent>
        </Card>

        {/* Current Period Balance */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Saldo Periode Ini
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-bold ${currentPeriodBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}`}
            >
              {formatCurrency(currentPeriodBalance)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Pemasukan - Pengeluaran
            </p>
          </CardContent>
        </Card>

        {/* Total Ending Balance */}
        <Card className="bg-slate-900 dark:bg-black text-white border-slate-900 dark:border-slate-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-300">
              Saldo Akhir
            </CardTitle>
            <div className="p-1 rounded-full bg-white/10">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalEndingBalance)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total Keseluruhan</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <ClipboardList className="h-5 w-5" />
            Riwayat Transaksi
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Menampilkan {filteredTransactions.length} transaksi terbaru sesuai
            filter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data transaksi.
              </div>
            ) : (
              paginatedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        {formatDate(t.date)}
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {t.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.creatorName || "Unknown"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ml-2
                        ${
                          t.category === "withdraw"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                      {categoryOptions.find((c) => c.value === t.category)
                        ?.label || t.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Nominal</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Keuntungan</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(calculateProfit(t))}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-sm font-medium text-slate-500">
                      Total
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(t.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-slate-500 dark:text-slate-400">
                    No
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    onClick={() => handleSort("date")}
                    title="Urutkan berdasarkan Tanggal"
                  >
                    <div className="flex items-center gap-1">
                      Tanggal
                      {sortConfig?.key === "date" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    onClick={() => handleSort("category")}
                    title="Urutkan berdasarkan Kategori"
                  >
                    <div className="flex items-center gap-1">
                      Kategori
                      {sortConfig?.key === "category" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Keterangan
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    onClick={() => handleSort("amount")}
                    title="Urutkan berdasarkan Nominal"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Nominal
                      {sortConfig?.key === "amount" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>

                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    onClick={() => handleSort("adminFee")}
                    title="Urutkan berdasarkan Keuntungan"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Keuntungan
                      {sortConfig?.key === "adminFee" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    onClick={() => handleSort("total")}
                    title="Urutkan berdasarkan Total"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      {sortConfig?.key === "total" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  {/* Action Column Placeholder if needed */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada data transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((t, idx) => (
                    <TableRow
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              t.category === "withdraw"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                          {categoryOptions.find((c) => c.value === t.category)
                            ?.label || t.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {t.description}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-400 dark:text-slate-500">
                        {formatCurrency(calculateProfit(t))}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold whitespace-nowrap ${
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}{" "}
                        {formatCurrency(t.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-slate-100 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-slate-100 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
