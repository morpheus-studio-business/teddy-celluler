"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Landmark,
  Plus,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  ArrowUpIcon,
  ArrowDownIcon,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { TransactionCategory } from "@/types";

interface DockBarProps {
  onAddTransaction?: (category: TransactionCategory) => void;
}

export function DockBar({ onAddTransaction }: DockBarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isKasBank = pathname === "/kas-bank";

  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddClick = (category: TransactionCategory) => {
    setIsAddMenuOpen(false);
    if (onAddTransaction) {
      onAddTransaction(category);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      {/* TRANSACTION SHORTCUT POPUP */}
      {isAddMenuOpen && (
        <div
          ref={addMenuRef}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50 flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tambah Transaksi
            </span>
            <button
              onClick={() => setIsAddMenuOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleAddClick("transfer")}
            className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 transition-colors w-full group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 group-hover:scale-105 transition-transform">
              <ArrowUpIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Pemasukan</p>
              <p className="text-[10px] text-slate-400">Transfer, pulsa, dll</p>
            </div>
          </button>

          <button
            onClick={() => handleAddClick("withdraw")}
            className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition-colors w-full group"
          >
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 group-hover:scale-105 transition-transform">
              <ArrowDownIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Pengeluaran</p>
              <p className="text-[10px] text-slate-400">Tarik tunai, operasional</p>
            </div>
          </button>
        </div>
      )}

      {/* USER / PROFILE POPUP */}
      {isUserMenuOpen && (
        <div
          ref={userMenuRef}
          className="absolute bottom-16 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-64 bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-2 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {session ? (
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Akun Aktif
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isAdmin
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isAdmin ? "Admin" : "Karyawan"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {session.user.email}
                </p>
              </div>

              <button
                onClick={async () => {
                  await authClient.signOut();
                  setIsUserMenuOpen(false);
                  window.location.reload();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                Keluar (Logout)
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="p-2.5 text-center border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tedy Celluler
                </p>
                <p className="text-[10px] text-slate-500">
                  Silakan masuk untuk akses transaksi
                </p>
              </div>
              <Link
                href="/login"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-4 w-4 text-emerald-600" />
                Masuk (Login)
              </Link>
              <Link
                href="/register"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserPlus className="h-4 w-4 text-blue-600" />
                Daftar Akun Baru
              </Link>
            </div>
          )}
        </div>
      )}

      {/* THE DOCK CONTAINER */}
      <nav
        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-full shadow-2xl shadow-slate-900/20"
        aria-label="Bottom Dock"
      >
        {/* 1. BERANDA (HOME) */}
        {isHome ? (
          <button
            onClick={scrollToTop}
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 transition-all duration-200 group active:scale-95"
            title="Beranda"
          >
            <Home className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[9px] font-bold leading-none mt-1 hidden sm:block">
              Beranda
            </span>
          </button>
        ) : (
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all duration-200 group active:scale-95"
            title="Beranda"
          >
            <Home className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[9px] font-medium leading-none mt-1 hidden sm:block">
              Beranda
            </span>
          </Link>
        )}

        {/* 2. SALDO KAS & BANK / E-WALLET (HALAMAN KHUSUS) */}
        <Link
          href="/kas-bank"
          onClick={() => {
            setIsAddMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 group active:scale-95 relative ${
            isKasBank
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
              : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          }`}
          title="Halaman Kas & Bank"
        >
          <Landmark className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
          <span
            className={`text-[9px] leading-none mt-1 hidden sm:block ${
              isKasBank ? "font-bold" : "font-medium"
            }`}
          >
            Kas & Bank
          </span>
          {!isKasBank && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </Link>

        {/* 3. TOMBOL TAMBAH TRANSAKSI (+) (CENTRAL PROMINENT ACTION) */}
        <div className="px-1">
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              setIsAddMenuOpen(!isAddMenuOpen);
            }}
            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
            title="Tambah Transaksi"
            aria-label="Tambah Transaksi"
          >
            <Plus
              className={`h-5 w-5 transition-transform duration-200 ${
                isAddMenuOpen ? "rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* 4. ADMIN PANEL (JIKA USER ADALAH ADMIN) */}
        {isAdmin && (
          <Link
            href="/admin/recap"
            className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all duration-200 group active:scale-95"
            title="Admin Panel"
          >
            <ShieldCheck className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[9px] font-medium leading-none mt-1 hidden sm:block">
              Admin
            </span>
          </Link>
        )}

        {/* 5. PROFIL / USER MENU */}
        <button
          onClick={() => {
            setIsAddMenuOpen(false);
            setIsUserMenuOpen(!isUserMenuOpen);
          }}
          className={`flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 group active:scale-95 relative ${
            session
              ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={session ? session.user.name : "Akun & Masuk"}
        >
          <div className="relative">
            <UserIcon className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
            {session && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>
          <span className="text-[9px] font-medium leading-none mt-1 hidden sm:block truncate max-w-[50px]">
            {session ? "Akun" : "Masuk"}
          </span>
        </button>
      </nav>
    </div>
  );
}
