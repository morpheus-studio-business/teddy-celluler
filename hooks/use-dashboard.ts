import { useState, useEffect } from "react";
import { FilterType, Transaction, TransactionCategory } from "@/types";
import {
  getTransactions,
  addTransaction,
} from "@/app/actions/transaction-actions";

export function useDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<
    TransactionCategory | "all"
  >("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] =
    useState<TransactionCategory>("transfer");
  const [addMode, setAddMode] = useState<"income" | "expense">("income");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

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
    const updated = await addTransaction(data);
    setTransactions(updated);
    setIsAddOpen(false);
  };

  const openAddModal = (mode: "income" | "expense") => {
    setAddMode(mode);
    setDefaultCategory(mode === "income" ? "transfer" : "withdraw");
    setIsAddOpen(true);
  };

  const filteredTransactions = transactions.filter((t) => {
    // Category Filter
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;

    // Date Filter
    const date = new Date(t.date);
    const now = new Date();
    if (dateFilter === "daily") {
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === "weekly") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= oneWeekAgo;
    }
    if (dateFilter === "monthly") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === "yearly") {
      return date.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
      return true;
    }
    return true;
  });

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
  };
}
