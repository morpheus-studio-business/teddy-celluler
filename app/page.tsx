"use client";

import { AddTransaction } from "@/components/dashboard/AddTransaction";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboard } from "@/hooks/use-dashboard";

import { authClient } from "@/lib/auth-client";
import { LoginRequiredModal } from "@/components/dashboard/LoginRequiredModal";
import { useState, useMemo } from "react";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { TransactionFilters } from "@/components/dashboard/TransactionFilters";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const { data: session } = authClient.useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    transactions,
    filteredTransactions,
    isAddOpen,
    setIsAddOpen,
    defaultCategory,
    addMode,
    handleAddTransaction,
    openAddModal,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    refreshTransactions,
  } = useDashboard();

  // Calculate Balances Logic (Reused from Admin Recap)
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

  const previousBalance = useMemo(() => {
    if (!cutoffDate) return 0;

    return transactions
      .filter((t) => {
        // Apply Category Filter if needed (usually Balance is global, but let's respect the user's category filter if set)
        if (categoryFilter !== "all" && t.category !== categoryFilter)
          return false;

        const tDate = new Date(t.date);
        return tDate < cutoffDate;
      })
      .reduce((acc, t) => {
        if (t.type === "income") return acc + t.total;
        return acc - t.total;
      }, 0);
  }, [transactions, categoryFilter, cutoffDate]);

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.total, 0),
    [filteredTransactions],
  );

  const totalExpense = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.total, 0),
    [filteredTransactions],
  );

  const currentPeriodBalance = totalIncome - totalExpense;
  const totalEndingBalance = previousBalance + currentPeriodBalance;

  const handleSharePdf = () => {
    const doc = new jsPDF();

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

    // Title
    doc.setFontSize(18);
    doc.text("Laporan Transaksi", 14, 22);

    // Filter Info
    doc.setFontSize(11);
    let dateText = "";
    if (dateFilter === "daily") dateText = "Hari Ini";
    else if (dateFilter === "weekly") dateText = "Minggu Ini";
    else if (dateFilter === "monthly") dateText = "Bulan Ini";
    else if (dateFilter === "yearly") dateText = "Tahun Ini";
    else if (dateFilter === "custom") {
      const s = startDate
        ? new Date(startDate).toLocaleDateString("id-ID")
        : "...";
      const e = endDate ? new Date(endDate).toLocaleDateString("id-ID") : "...";
      dateText = `${s} - ${e}`;
    } else dateText = "Semua Waktu";

    doc.text(`Periode: ${dateText}`, 14, 30);

    // Summary
    let yPos = 40;
    doc.text(`Saldo Sebelumnya: ${formatCurrency(previousBalance)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Pengeluaran: ${formatCurrency(totalExpense)}`, 14, yPos);
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

    // Table
    const tableData = filteredTransactions.map((t, idx) => [
      idx + 1,
      formatDate(t.date),
      t.category,
      t.description,
      formatCurrency(t.amount),
      formatCurrency(t.total),
    ]);

    autoTable(doc, {
      head: [["No", "Tanggal", "Kategori", "Keterangan", "Nominal", "Total"]],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], "laporan_transaksi.pdf", {
      type: "application/pdf",
    });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({
          files: [file],
          title: "Laporan Transaksi",
          text: "Berikut adalah laporan transaksi.",
        })
        .catch((error) => console.log("Sharing failed", error));
    } else {
      doc.save("laporan_transaksi.pdf");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-dark pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
      <DashboardHeader
        totalBalance={totalEndingBalance}
        previousBalance={previousBalance}
        currentPeriodBalance={currentPeriodBalance}
        income={totalIncome}
        expense={totalExpense}
        onAddClick={(category) => {
          if (!session) {
            setShowLoginModal(true);
            return;
          }
          const mode = category === "withdraw" ? "expense" : "income";
          openAddModal(mode);
        }}
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <TransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={addMode === "income" ? "Tambah Pemasukan" : "Tambah Pengeluaran"}
      >
        <AddTransaction
          onAdd={handleAddTransaction}
          defaultCategory={defaultCategory}
          mode={addMode}
        />
      </TransactionModal>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid gap-6">
          {/* Controls Removed */}

          {/* Add Transaction Form (Removed Inline) */}

          {/* Filters */}
          <TransactionFilters
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onSharePdf={handleSharePdf}
          />

          {/* Transaction List */}
          <TransactionList
            transactions={filteredTransactions}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRefresh={refreshTransactions}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
