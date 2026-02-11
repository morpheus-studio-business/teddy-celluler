import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function formatNumber(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
}

function parseNumber(formatted: string): string {
  return formatted.replace(/\./g, "");
}

interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> {
  value: string;
  onValueChange: (rawValue: string) => void;
}

export function NumberInput({
  value,
  onValueChange,
  className,
  ...props
}: NumberInputProps) {
  const [display, setDisplay] = useState(() => formatNumber(value));

  useEffect(() => {
    setDisplay(formatNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseNumber(e.target.value);
    setDisplay(formatNumber(raw));
    onValueChange(raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={display}
      onChange={handleChange}
      {...props}
    />
  );
}
