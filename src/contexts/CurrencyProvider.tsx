import { useAuth } from "@/src/contexts/authProvider";
import React, { createContext, PropsWithChildren, useContext, useMemo } from "react";

type CurrencyContextType = {
  currencySymbol: string;
  formatCurrency: (value: number | string | null | undefined) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currencySymbol: "$",
  formatCurrency: () => "$0.00",
});

export const CurrencyProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const currencySymbol = user?.currencySymbol || "$";

  const value = useMemo(
    () => ({
      currencySymbol,
      formatCurrency: (amount: number | string | null | undefined) => {
        const numeric = Number(amount ?? 0);
        const safe = Number.isFinite(numeric) ? numeric : 0;
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(safe);
        return `${currencySymbol}${formatted}`;
      },
    }),
    [currencySymbol],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
