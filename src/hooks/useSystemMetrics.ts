import { useCallback, useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { logsService } from "@/lib/services/logs.service";
import type { SystemMetrics, ServiceStatusResponse } from "@/lib/types/stats.types";

interface UseSystemMetricsReturn {
  metrics: SystemMetrics | null;
  services: ServiceStatusResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSystemMetrics(): UseSystemMetricsReturn {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, s] = await Promise.all([
        logsService.getSystemMetrics(),
        logsService.getServiceStatus(),
      ]);
      setMetrics(m);
      setServices(s);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch system metrics";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const id = setInterval(loadData, 10_000);
    return () => clearInterval(id);
  }, [loadData]);

  return { metrics, services, loading, error, refresh: loadData };
}
