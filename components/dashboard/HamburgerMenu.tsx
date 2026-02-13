"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Settings, LogIn, LogOut, UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        ) : (
          <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {session ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50">
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Masuk sebagai
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                    {session.user.name}
                  </p>
                </div>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                  {session.user.email}
                </p>
              </div>

              <div className="p-2">
                {(session.user as any).role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={async () => {
                    await authClient.signOut();
                    setIsOpen(false);
                    window.location.reload();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </>
          ) : (
            <div className="p-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
