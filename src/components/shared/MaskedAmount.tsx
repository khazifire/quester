import { useAppStore } from "@/stores/appStore";
import { useCurrencyStore } from "@/stores/currencyStore";

interface MaskedAmountProps {
  value: number;
  currency?: string;
  className?: string;
  showOriginal?: boolean;
}

export function MaskedAmount({ value, currency, className, showOriginal }: MaskedAmountProps) {
  const showAmounts = useAppStore((s) => s.showAmounts);
  const convert = useCurrencyStore((s) => s.convert);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const getSymbol = useCurrencyStore((s) => s.getSymbol);

  const converted = convert(value, currency);
  const symbol = getSymbol(showOriginal ? currency : mainCurrency);
  const displayValue = showOriginal ? value : converted;

  const formatted = showAmounts
    ? `${symbol}${Math.round(displayValue).toLocaleString("en-US")}`
    : `${symbol}${"•".repeat(String(Math.round(displayValue)).length)}`;

  return <span className={className}>{formatted}</span>;
}
