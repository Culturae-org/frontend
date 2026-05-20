import { useCallback, useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { logsService } from "@/lib/services/logs.service";
import type { APIRequestStats } from "@/lib/types/logs.types";
import type { ApiTimeRange } from "@/lib/types/analytics.types";

interface UseApiAnalyticsReturn {
  stats: APIRequestStats | null;
  timestamps: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const MINUTES_MAP: Record<ApiTimeRange, number> = {
  "1h": 60, "6h": 360, "12h": 720, "1d": 1440, "7d": 10080, "30d": 43200,
};

function toDateParams(range: ApiTimeRange) {
  const end = new Date();
  const start = new Date(end.getTime() - MINUTES_MAP[range] * 60 * 1000);
  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export function useApiAnalytics(timeRange: ApiTimeRange = "1h"): UseApiAnalyticsReturn {
  const [stats, setStats] = useState<APIRequestStats | null>(null);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start_date, end_date } = toDateParams(timeRange);
      const [apiStats, apiTimestamps] = await Promise.all([
        logsService.getAPIRequestStats({ start_date, end_date }),
        logsService.getAPIRequestTimestamps({ date_from: start_date, date_to: end_date }),
      ]);
      setStats(apiStats);
      setTimestamps(Array.isArray(apiTimestamps) ? apiTimestamps : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch API analytics";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { loadData(); }, [loadData]);

  return { stats, timestamps, loading, error, refresh: loadData };
}
