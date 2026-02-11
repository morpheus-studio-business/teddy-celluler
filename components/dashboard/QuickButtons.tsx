import { Button } from "@/components/ui/button";
import { TransactionCategory } from "@/types";
import { ArrowDownIcon, ArrowUpIcon, Plus } from "lucide-react";

interface QuickButtonsProps {
  onAddClick: (category: TransactionCategory) => void;
}

export function QuickButtons({ onAddClick }: QuickButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
        onClick={() => onAddClick("transfer")}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-white/20">
            <ArrowUpIcon className="h-4 w-4" />
          </div>
          <span>Pemasukan</span>
        </div>
      </Button>

      <Button
        className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20"
        onClick={() => onAddClick("withdraw")}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-white/20">
            <ArrowDownIcon className="h-4 w-4" />
          </div>
          <span>Pengeluaran</span>
        </div>
      </Button>
    </div>
  );
}
