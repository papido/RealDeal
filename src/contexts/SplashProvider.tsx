// src/providers/SplashProvider.tsx
import React, { createContext, useContext, useState } from "react";

const SplashContext = createContext<{
  splashShown: boolean;
  setSplashShown: (value: boolean) => void;
}>({
  splashShown: false,
  setSplashShown: () => {},
});

export const SplashProvider = ({ children }: { children: React.ReactNode }) => {
  const [splashShown, setSplashShown] = useState(false);
  return (
    <SplashContext.Provider value={{ splashShown, setSplashShown }}>
      {children}
    </SplashContext.Provider>
  );
};

export const useSplash = () => useContext(SplashContext);
