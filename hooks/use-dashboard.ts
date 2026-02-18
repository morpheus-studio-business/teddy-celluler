import { useState, useEffect } from "react";
import { FilterType, Transaction, TransactionCategory } from "@/types";
import {
  getTransactions,
  addTransaction,
  getTransactionStats,
} from "@/app/actions/transaction-actions";

export function useDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<FilterType>("daily");
  const [categoryFilter, setCategoryFilter] = useState<
    TransactionCategory | "all"
  >("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] =
    useState<TransactionCategory>("transfer");
  const [addMode, setAddMode] = useState<"income" | "expense">("income");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    previousBalance: 0,
    currentPeriodBalance: 0,
    totalEndingBalance: 0,
  });

  // Fetch transactions when filters or page change
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const [transactionRes, statsRes] = await Promise.all([
        getTransactions({
          page: currentPage,
          limit: 10,
          category: categoryFilter,
          dateFilter,
          startDate,
          endDate,
        }),
        getTransactionStats({
          category: categoryFilter,
          dateFilter,
          startDate,
          endDate,
        }),
      ]);

      setTransactions(transactionRes.data);
      setTotalPages(transactionRes.meta.totalPages);
      setStats(statsRes);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, categoryFilter, dateFilter, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, dateFilter, startDate, endDate]);

  const handleAddTransaction = async (data: {
    description: string;
    amount: number;
    adminFee: number;
    total: number;
    category: TransactionCategory;
    type: "income" | "expense";
    capitalPrice?: number;
    productId?: string;
  }) => {
    await addTransaction(data);
    fetchTransactions(); // Refetch to get latest data
    setIsAddOpen(false);
  };

  const openAddModal = (mode: "income" | "expense") => {
    setAddMode(mode);
    setDefaultCategory(mode === "income" ? "transfer" : "withdraw");
    setIsAddOpen(true);
  };

  // For compatibility with existing components that might expect "filteredTransactions"
  // In server-side pagination, "transactions" IS the filtered list for the current page.
  const filteredTransactions = transactions;

  return {
    transactions,
    filteredTransactions,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    isAddOpen,
    setIsAddOpen,
    defaultCategory,
    addMode,
    handleAddTransaction,
    openAddModal,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    refreshTransactions: fetchTransactions,
    stats,
  };
}
