import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { PODS_ENDPOINTS } from "@/lib/api/endpoints";
import type { PodsResponse } from "@/lib/types/pods.types";

export function usePods(refetchInterval?: number) {
  const [data, setData] = useState<PodsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPods = async () => {
    try {
      setLoading(true);
      const res = await apiGet(PODS_ENDPOINTS.LIST);
      if (!res.ok) throw new Error("Failed to fetch pods");
      const json = await res.json();
      setData(json.data ?? json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();

    if (refetchInterval) {
      const interval = setInterval(fetchPods, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval]);

  return { data, loading, error, refetch: fetchPods };
}
