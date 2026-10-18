"use client";

import { AddTransaction } from "@/components/dashboard/AddTransaction";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useDashboard } from "@/hooks/use-dashboard";

import { authClient } from "@/lib/auth-client";
import { LoginRequiredModal } from "@/components/dashboard/LoginRequiredModal";
import { useState } from "react";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { TransactionFilters } from "@/components/dashboard/TransactionFilters";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTransactions } from "@/app/actions/transaction-actions";
import { Transaction } from "@/types";

export default function Home() {
  const { data: session } = authClient.useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
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
    stats,
  } = useDashboard();

  const {
    totalIncome,
    totalExpense,
    previousBalance,
    currentPeriodBalance,
    totalEndingBalance,
  } = stats;

  const handleSharePdf = async () => {
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

    // Fetch ALL Transactions for PDF
    try {
      const response = await getTransactions({
        limit: 0, // Fetch all
        category: categoryFilter,
        dateFilter,
        startDate,
        endDate,
      });
      const allTransactions = response.data;

      // Group by Category
      const groupedTransactions: Record<string, Transaction[]> = {};

      const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
          data_package: "Paket Data",
          withdraw: "Tarik Tunai",
          general: "Lainnya",
          other: "Aksesoris",
          transfer: "Transfer",
          "e-wallet": "E-Wallet",
          voucher: "Voucher",
          accessories: "Aksesoris",
          service: "Service",
          income: "Pemasukan",
          expense: "Pengeluaran",
          pulsa: "Pulsa",
          perdana: "Perdana",
        };
        return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
      };

      allTransactions.forEach((t) => {
        // Use the label for grouping so "Paket Data" is the key
        const rawCat = t.category || "Lainnya";
        const catLabel = getCategoryLabel(rawCat);

        if (!groupedTransactions[catLabel]) {
          groupedTransactions[catLabel] = [];
        }
        groupedTransactions[catLabel].push(t as Transaction);
      });

      // Render Tables by Group
      const categories = Object.keys(groupedTransactions).sort();

      if (categories.length === 0) {
        doc.text("Tidak ada transaksi untuk periode ini.", 14, yPos);
      } else {
        categories.forEach((cat) => {
          const transactions = groupedTransactions[cat];

          // Group Header
          if (yPos > 270) {
            // Page break check if near bottom
            doc.addPage();
            yPos = 20;
          }

          // Calculate Category Subtotal
          const subtotal = transactions.reduce((acc, t) => {
            return t.type === "income" ? acc + t.total : acc - t.total;
          }, 0);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(
            `${cat.toUpperCase()} (Total: ${formatCurrency(subtotal)})`,
            14,
            yPos,
          );
          yPos += 2; // Spacing before table

          const tableData = transactions.map((t, idx) => [
            idx + 1,
            formatDate(t.date),
            t.description,
            t.type === "income" ? "Masuk" : "Keluar",
            formatCurrency(t.amount),
            formatCurrency(t.total),
          ]);

          autoTable(doc, {
            head: [["No", "Tanggal", "Keterangan", "Tipe", "Nominal", "Total"]],
            body: tableData,
            startY: yPos,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] },
            margin: { top: 20 },
            didDrawPage: (data) => {
              // If table splits across pages, update yPos for next loop
              if (data.cursor) {
                yPos = data.cursor.y;
              }
            },
          });

          // Create space for next table
          // @ts-expect-error - autotable adds this property
          yPos = doc.lastAutoTable.finalY + 10;
        });
      }

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
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
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
