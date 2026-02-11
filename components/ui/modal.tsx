"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg transform rounded-xl bg-white dark:bg-neutral-900 p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold leading-6 text-neutral-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
