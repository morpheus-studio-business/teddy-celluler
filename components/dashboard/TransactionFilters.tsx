import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterType, TransactionCategory } from "@/types";
import { LayoutGrid, Share2, Calendar as CalendarIcon } from "lucide-react";

interface TransactionFiltersProps {
  dateFilter: FilterType;
  setDateFilter: (filter: FilterType) => void;
  categoryFilter: TransactionCategory | "all";
  setCategoryFilter: (category: TransactionCategory | "all") => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onSharePdf: () => void;
}

export function TransactionFilters({
  dateFilter,
  setDateFilter,
  categoryFilter,
  setCategoryFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSharePdf,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-white dark:bg-slate-950"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {dateFilter === "daily"
                  ? "Hari Ini"
                  : dateFilter === "weekly"
                    ? "Minggu Ini"
                    : dateFilter === "monthly"
                      ? "Bulan Ini"
                      : dateFilter === "custom"
                        ? "Custom Tanggal"
                        : "Semua Tanggal"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Rentang Waktu</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setDateFilter("daily")}>
              Hari Ini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("weekly")}>
              Minggu Ini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("monthly")}>
              Bulan Ini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("custom")}>
              Custom Tanggal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDateFilter("all")}>
              Semua Tanggal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-white dark:bg-slate-950"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">
                {categoryFilter === "transfer"
                  ? "Transfer"
                  : categoryFilter === "withdraw"
                    ? "Tarik Tunai"
                    : categoryFilter === "voucher"
                      ? "Voucher"
                      : categoryFilter === "data_package"
                        ? "Paket Data"
                        : categoryFilter === "pulsa"
                          ? "Pulsa"
                          : categoryFilter === "e-wallet"
                            ? "E-Wallet"
                            : categoryFilter === "other"
                              ? "Aksesoris"
                              : "Semua Tipe"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Tipe Transaksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
              Semua Tipe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCategoryFilter("transfer")}>
              Transfer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("withdraw")}>
              Tarik Tunai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("voucher")}>
              Voucher
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("data_package")}>
              Paket Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("pulsa")}>
              Pulsa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("e-wallet")}>
              E-Wallet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("other")}>
              Aksesoris
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategoryFilter("general")}>
              Lainnya
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Custom Date Inputs */}
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

      {/* Share PDF Button */}
      <Button
        variant="outline"
        onClick={onSharePdf}
        className="gap-2 ml-auto bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 border-none"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share PDF</span>
      </Button>
    </div>
  );
}
