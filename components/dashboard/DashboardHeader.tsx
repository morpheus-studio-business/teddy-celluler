import { SummaryStats } from "@/components/dashboard/SummaryStats";
import { QuickButtons } from "@/components/dashboard/QuickButtons";
import { HamburgerMenu } from "@/components/dashboard/HamburgerMenu";
import { Transaction, TransactionCategory } from "@/types";

interface DashboardHeaderProps {
  totalBalance: number;
  previousBalance: number;
  currentPeriodBalance: number;
  income: number;
  expense: number;
  onAddClick: (category: TransactionCategory) => void;
}

export function DashboardHeader({
  totalBalance,
  previousBalance,
  currentPeriodBalance,
  income,
  expense,
  onAddClick,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white dark:bg-brand-dark/50 pt-8 pb-12 px-4 md:px-8 backdrop-blur-sm border-b border-slate-200/50 dark:border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
                <img
                  src="/logo.svg"
                  alt="TC"
                  className="w-full h-full object-contain"
                />
              </div>
              Tedy Celluler
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-[52px]">
              Financial Dashboard
            </p>
          </div>
          <HamburgerMenu />
        </div>
        <SummaryStats
          totalBalance={totalBalance}
          previousBalance={previousBalance}
          currentPeriodBalance={currentPeriodBalance}
          income={income}
          expense={expense}
        />
        <QuickButtons onAddClick={onAddClick} />
      </div>
    </div>
  );
}
