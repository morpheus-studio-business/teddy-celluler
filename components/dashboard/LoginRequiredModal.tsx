"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({
  isOpen,
  onClose,
}: LoginRequiredModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Akses Terbatas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Silakan masuk atau daftar akun terlebih dahulu untuk melakukan
              transaksi.
            </p>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-lg shadow-purple-900/20"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </button>
            <button
              onClick={() => router.push("/register")}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Daftar Akun
            </button>
            <button
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-2"
            >
              Nanti saja (Lihat Dashboard)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
