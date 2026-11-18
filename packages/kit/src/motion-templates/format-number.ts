import { useLayoutEffect, useState } from "react";

export function useNumberLocale() {
  const [locale, setLocale] = useState<string>();
  useLayoutEffect(() => {
    setLocale(document.documentElement.lang || undefined);
  }, []);
  return locale;
}

export function numberFormat(endpoint: number, locale?: string, signed = false) {
  const scientific = endpoint !== 0 && Math.abs(endpoint) < 0.01;
  const digits = Number.isInteger(endpoint) ? 0 : Number.isInteger(endpoint * 10) ? 1 : 2;
  return new Intl.NumberFormat(locale, {
    notation: scientific ? "scientific" : "standard",
    maximumFractionDigits: scientific ? 2 : digits,
    signDisplay: signed ? "exceptZero" : "auto",
  });
}
