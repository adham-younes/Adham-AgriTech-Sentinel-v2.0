"use client";

import useSWR from "swr";

import { jsonFetcher } from "@/lib/fetcher";
import type { FieldAnalysisPayload } from "@/types/agri";

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useFieldAnalytics() {
  const swr = useSWR<FieldAnalysisPayload>(
    "/api/analyze-field",
    (url) => jsonFetcher<FieldAnalysisPayload>(url),
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: false,
    }
  );

  return swr;
}
