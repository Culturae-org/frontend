"use client";

import { logsService } from "@/lib/services/logs.service";
import type { APIRequestStats } from "@/lib/types/logs.types";
import { useCallback, useState } from "react";

export type { APIRequestStats };

export function useApiMetrics() {
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [timestampsLoading, setTimestampsLoading] = useState(false);
  const [timestampsError, setTimestampsError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (
      startDate?: Date,
      endDate?: Date,
    ): Promise<APIRequestStats | null> => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const params: Record<string, string> = {};
        if (startDate) params.start_date = startDate.toISOString();
        if (endDate) params.end_date = endDate.toISOString();

        const result = await logsService.getAPIRequestStats(params);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch stats";
        setStatsError(message);
        return null;
      } finally {
        setStatsLoading(false);
      }
    },
    [],
  );

  const fetchTimestamps = useCallback(
    async (
      method?: string,
      statusCode?: string,
      startDate?: Date,
      endDate?: Date,
    ): Promise<string[]> => {
      setTimestampsLoading(true);
      setTimestampsError(null);

      try {
        const params: Record<string, string> = {};
        if (method && method !== "all") params.method = method;
        if (statusCode && statusCode !== "all") params.status_code = statusCode;
        if (startDate) params.start_date = startDate.toISOString();
        if (endDate) params.end_date = endDate.toISOString();

        return await logsService.getAPIRequestTimestamps(params);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch timestamps";
        setTimestampsError(message);
        return [];
      } finally {
        setTimestampsLoading(false);
      }
    },
    [],
  );

  return {
    statsLoading,
    statsError,
    timestampsLoading,
    timestampsError,
    fetchStats,
    fetchTimestamps,
  };
}
