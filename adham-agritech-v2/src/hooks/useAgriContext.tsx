"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface AgriContextValue {
  ndvi: number | null;
  moisture: number | null;
  setMetricsContext: (ndvi: number | null, moisture: number | null) => void;
}

const AgriContext = createContext<AgriContextValue | null>(null);

export function AgriContextProvider({ children }: { children: ReactNode }) {
  const [ndvi, setNdvi] = useState<number | null>(null);
  const [moisture, setMoisture] = useState<number | null>(null);

  const setMetricsContext = (nextNdvi: number | null, nextMoisture: number | null) => {
    setNdvi(nextNdvi);
    setMoisture(nextMoisture);
  };

  const value = useMemo(() => ({ ndvi, moisture, setMetricsContext }), [ndvi, moisture]);

  return <AgriContext.Provider value={value}>{children}</AgriContext.Provider>;
}

export function useAgriContext() {
  const ctx = useContext(AgriContext);
  if (!ctx) {
    throw new Error("useAgriContext must be used within AgriContextProvider");
  }
  return ctx;
}
