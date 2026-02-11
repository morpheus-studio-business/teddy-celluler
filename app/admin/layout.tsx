"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Wifi,
  Users,
  ClipboardList,
  ArrowLeft,
  Smartphone,
  Wallet,
  Package,
} from "lucide-react";

const menuItems = [
  {
    label: "Transfer",
    href: "/admin/transfer",
    icon: ArrowLeftRight,
    active: true,
  },
  {
    label: "E-Wallet",
    href: "/admin/e-wallet",
    icon: Wallet,
    active: true,
  },
  {
    label: "Tarik Tunai",
    href: "/admin/withdraw",
    icon: Banknote,
    active: true,
  },
  {
    label: "Voucher",
    href: "/admin/voucher",
    icon: CreditCard,
    active: true,
  },
  {
    label: "Paket Data",
    href: "/admin/paket-data",
    icon: Wifi,
    active: true,
  },
  {
    label: "Pulsa",
    href: "/admin/pulsa",
    icon: Smartphone,
    active: true,
  },
  {
    label: "Lainnya",
    href: "/admin/lainnya",
    icon: Package,
    active: true,
  },
  {
    label: "Rekap",
    href: "/admin/recap",
    icon: ClipboardList,
    active: true,
  },
  {
    label: "User",
    href: "/admin/karyawan",
    icon: Users,
    active: true,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors lg:hidden"
              aria-label="Menu"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              ) : (
                <Menu className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/logo.svg"
                  alt="TC"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Admin Panel
              </h1>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>

      <div className="w-full flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-neutral-800 min-h-[calc(100vh-4rem)] bg-white dark:bg-neutral-900 p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.active ? item.href : "#"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : item.active
                        ? "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    if (!item.active) e.preventDefault();
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {!item.active && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/40" />
            <aside
              ref={sidebarRef}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-neutral-900 shadow-2xl p-4 pt-20 animate-in slide-in-from-left duration-200"
            >
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.active ? item.href : "#"}
                      onClick={(e) => {
                        if (!item.active) {
                          e.preventDefault();
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                          : item.active
                            ? "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {!item.active && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600">
                          Soon
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
