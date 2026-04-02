import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyWallet, ExchangeRates } from "@/lib/types";

const CACHE_DURATION = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
const API_URL = "https://open.er-api.com/v6/latest/";

interface CurrencyState {
  mainCurrency: string;
  wallets: CurrencyWallet[];
  exchangeRates: ExchangeRates | null;
  isFetching: boolean;

  setMainCurrency: (currency: string) => void;
  addWallet: (wallet: CurrencyWallet) => void;
  removeWallet: (currency: string) => void;
  updateWallet: (currency: string, label: string) => void;
  fetchRates: () => Promise<void>;
  convert: (amount: number, fromCurrency: string | undefined) => number;
  getSymbol: (currency?: string) => string;
  getAllCurrencies: () => string[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  THB: "฿",
  ZAR: "R",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  KRW: "₩",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  MYR: "RM",
  PHP: "₱",
  IDR: "Rp",
  VND: "₫",
  BRL: "R$",
  MXN: "MX$",
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      mainCurrency: "THB",
      wallets: [
        { currency: "THB", label: "Thai Baht (main)" },
        { currency: "USD", label: "US Dollar" },
        { currency: "ZAR", label: "South African Rand" },
      ],
      exchangeRates: null,
      isFetching: false,

      setMainCurrency: (currency) => set({ mainCurrency: currency }),

      addWallet: (wallet) =>
        set((s) => {
          if (s.wallets.some((w) => w.currency === wallet.currency)) return s;
          return { wallets: [...s.wallets, wallet] };
        }),

      removeWallet: (currency) =>
        set((s) => ({
          wallets: s.wallets.filter((w) => w.currency !== currency),
        })),

      updateWallet: (currency, label) =>
        set((s) => ({
          wallets: s.wallets.map((w) =>
            w.currency === currency ? { ...w, label } : w
          ),
        })),

      fetchRates: async () => {
        const state = get();
        const baseMismatch = state.exchangeRates && state.exchangeRates.base !== state.mainCurrency;
        // Refetch if cache expired OR base currency changed
        if (
          !baseMismatch &&
          state.exchangeRates &&
          Date.now() - state.exchangeRates.lastFetched < CACHE_DURATION
        ) {
          return;
        }

        set({ isFetching: true });
        try {
          const res = await fetch(`${API_URL}${state.mainCurrency}`);
          if (!res.ok) throw new Error("Failed to fetch rates");
          const data = await res.json();
          set({
            exchangeRates: {
              base: state.mainCurrency,
              rates: data.rates || {},
              lastFetched: Date.now(),
            },
            isFetching: false,
          });
        } catch {
          set({ isFetching: false });
        }
      },

      convert: (amount, fromCurrency) => {
        const state = get();
        const from = fromCurrency || state.mainCurrency;
        if (from === state.mainCurrency) return amount;

        const rates = state.exchangeRates;
        if (!rates || rates.base !== state.mainCurrency) return amount;

        // rates.rates[X] = how many X per 1 mainCurrency
        // So to convert FROM another currency TO main:
        // amount_in_main = amount / rates[fromCurrency]
        const rate = rates.rates[from];
        if (!rate || rate === 0) return amount;
        return amount / rate;
      },

      getSymbol: (currency) => {
        const cur = currency || get().mainCurrency;
        return CURRENCY_SYMBOLS[cur] || cur + " ";
      },

      getAllCurrencies: () => {
        return get().wallets.map((w) => w.currency);
      },
    }),
    {
      name: "questline-currency",
      version: 1,
    }
  )
);
