import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { seedData } from "@/lib/seed";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useAppStore } from "@/stores/appStore";
import { LandingPage } from "@/components/layout/LandingPage";

export default function App({ Component, pageProps }: AppProps) {
  const fetchRates = useCurrencyStore((s) => s.fetchRates);
  const onboarded = useAppStore((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedData();
    fetchRates();
    setHydrated(true);
  }, [fetchRates]);

  if (!hydrated) return null;

  if (!onboarded) {
    return <LandingPage />;
  }

  return <Component {...pageProps} />;
}
