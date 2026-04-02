import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { seedData } from "@/lib/seed";
import { useCurrencyStore } from "@/stores/currencyStore";

export default function App({ Component, pageProps }: AppProps) {
  const fetchRates = useCurrencyStore((s) => s.fetchRates);

  useEffect(() => {
    seedData();
    fetchRates();
  }, [fetchRates]);

  return <Component {...pageProps} />;
}
