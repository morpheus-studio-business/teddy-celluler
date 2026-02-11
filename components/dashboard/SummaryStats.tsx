import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Wallet,
  History,
  Scale,
} from "lucide-react";

interface SummaryStatsProps {
  totalBalance: number;
  previousBalance: number;
  currentPeriodBalance: number;
  income: number;
  expense: number;
}

export function SummaryStats({
  totalBalance,
  previousBalance,
  currentPeriodBalance,
  income,
  expense,
}: SummaryStatsProps) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="relative overflow-hidden bg-slate-900 dark:bg-black text-white border border-slate-800 shadow-2xl shadow-slate-900/20">
        <CardContent className="p-0 relative z-10">
          {/* Top Section: Total Ending Balance */}
          <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center border-b border-white/10">
            <div className="flex items-center gap-2 mb-2 md:mb-3 text-slate-400 text-xs md:text-sm font-medium uppercase tracking-widest">
              <div className="p-1 rounded-full bg-white/10">
                <Wallet className="h-3 w-3" />
              </div>
              <span>Total Saldo Akhir</span>
            </div>
            <div className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
              {formatRupiah(totalBalance)}
            </div>
          </div>

          {/* Middle Section: Previous Balance & Current Period Balance */}
          <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 bg-white/5">
            {/* Previous Balance */}
            <div className="p-3 md:p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-1.5 mb-1 text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                <History className="h-3 w-3" />
                Saldo Sebelumnya
              </div>
              <div className="text-sm md:text-lg font-bold text-slate-200">
                {formatRupiah(previousBalance)}
              </div>
            </div>

            {/* Current Period Balance */}
            <div className="p-3 md:p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-1.5 mb-1 text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                <Scale className="h-3 w-3" />
                Saldo Periode Ini
              </div>
              <div
                className={`text-sm md:text-lg font-bold ${currentPeriodBalance >= 0 ? "text-blue-400" : "text-rose-400"}`}
              >
                {formatRupiah(currentPeriodBalance)}
              </div>
            </div>
          </div>

          {/* Bottom Section: Income & Expense */}
          <div className="grid grid-cols-2 divide-x divide-white/10">
            {/* Income Section */}
            <div className="p-4 md:p-6 flex flex-col items-center hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-emerald-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                <div className="p-1 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <ArrowUpIcon className="h-3 w-3" />
                </div>
                Pemasukan
              </div>
              <div className="text-lg md:text-2xl font-bold text-white tracking-tight">
                {formatRupiah(income)}
              </div>
            </div>

            {/* Expense Section */}
            <div className="p-4 md:p-6 flex flex-col items-center hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-rose-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                <div className="p-1 rounded-full bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                  <ArrowDownIcon className="h-3 w-3" />
                </div>
                Pengeluaran
              </div>
              <div className="text-lg md:text-2xl font-bold text-white tracking-tight">
                {formatRupiah(expense)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
