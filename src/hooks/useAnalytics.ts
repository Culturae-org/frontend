import { useState, useEffect, useCallback } from "react";
import { analyticsService } from "@/lib/services/analytics.service";
import type {
  DashboardAnalytics,
  TimeRange,
} from "@/lib/types/analytics.types";

interface UseAnalyticsReturn {
  data: DashboardAnalytics | null;
  loading: boolean;
  error: Error | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const analytics = await analyticsService.getDashboardAnalytics(timeRange);
      setData(analytics);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch analytics"),
      );
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh,
  };
}
