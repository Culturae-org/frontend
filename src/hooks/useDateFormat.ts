import { useCallback, useState } from "react";
import { format, parseISO } from "date-fns";

const STORAGE_KEY = "culturae_date_format";
const DEFAULT_FORMAT = "dd/MM/yyyy";

export interface DateFormatOption {
  value: string;
  label: string;
  example: string;
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY", example: "16/05/2026" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY", example: "05/16/2026" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD", example: "2026-05-16" },
  { value: "MMM dd, yyyy", label: "MMM DD, YYYY", example: "May 16, 2026" },
  { value: "dd MMM yyyy", label: "DD MMM YYYY", example: "16 May 2026" },
];

function readStorage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}

export function useDateFormat() {
  const [dateFormat, setDateFormatState] = useState<string>(readStorage);

  const setDateFormat = useCallback((value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setDateFormatState(value);
  }, []);

  const formatDate = useCallback(
    (date: string | Date | null | undefined): string => {
      if (!date) return "—";
      try {
        const d = typeof date === "string" ? parseISO(date) : date;
        return format(d, `${dateFormat} HH:mm`);
      } catch {
        return String(date);
      }
    },
    [dateFormat],
  );

  const formatDateWithSeconds = useCallback(
    (date: string | Date | null | undefined): string => {
      if (!date) return "—";
      try {
        const d = typeof date === "string" ? parseISO(date) : date;
        return format(d, `${dateFormat} HH:mm:ss`);
      } catch {
        return String(date);
      }
    },
    [dateFormat],
  );

  const formatDateOnly = useCallback(
    (date: string | Date | null | undefined): string => {
      if (!date) return "—";
      try {
        const d = typeof date === "string" ? parseISO(date) : date;
        return format(d, dateFormat);
      } catch {
        return String(date);
      }
    },
    [dateFormat],
  );

  return {
    dateFormat,
    setDateFormat,
    formatDate,
    formatDateWithSeconds,
    formatDateOnly,
    formatOptions: DATE_FORMAT_OPTIONS,
  };
}
