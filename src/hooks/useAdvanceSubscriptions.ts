import { useEffect } from "react";
import { useFinanceStore } from "@/stores/financeStore";
import { getToday } from "@/lib/utils";

/**
 * On mount, auto-creates expenses for any active subscriptions whose
 * nextDate has passed, and advances their nextDate forward.
 */
export function useAdvanceSubscriptions() {
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const advanceSubscription = useFinanceStore((s) => s.advanceSubscription);

  useEffect(() => {
    const today = getToday();
    subscriptions
      .filter((s) => s.active && s.nextDate <= today)
      .forEach((s) => advanceSubscription(s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
