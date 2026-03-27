import { useGetSettings } from "@workspace/api-client-react";
import { useAppStore } from "./store";
import { formatPrice } from "./utils";

export function useCurrency() {
  const { data: settings } = useGetSettings();
  const { lang } = useAppStore();
  const symbol = settings?.currencySymbol || undefined;

  const format = (price: number) => formatPrice(price, undefined, lang, symbol);

  return { symbol, format };
}
