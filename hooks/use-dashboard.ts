import { useState, useEffect } from "react";
import { FilterType, Transaction, TransactionCategory } from "@/types";
import {
  getTransactions,
  addTransaction,
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

  // Fetch transactions when filters or page change
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await getTransactions({
        page: currentPage,
        limit: 10,
        category: categoryFilter,
        dateFilter,
        startDate,
        endDate,
      });
      setTransactions(response.data);
      setTotalPages(response.meta.totalPages);
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
  };
}
