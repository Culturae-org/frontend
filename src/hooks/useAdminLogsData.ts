import { useCallback, useEffect, useState } from "react";
import { logsService } from "@/lib/services/logs.service";
import type { AdminActionLog, AdminActionStats } from "@/lib/types/logs.types";

export interface AdminLogsFilters {
  action: string;
  resource: string;
  status: string;
}

const DEFAULT_FILTERS: AdminLogsFilters = {
  action: "",
  resource: "",
  status: "all",
};

export function useAdminLogsData() {
  const [stats, setStats] = useState<AdminActionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filters, setFilters] = useState<AdminLogsFilters>(DEFAULT_FILTERS);
  const [search, setSearchRaw] = useState("");

  useEffect(() => {
    setStatsLoading(true);
    logsService
      .getAdminActionStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      if (filters.action) params.action = filters.action;
      if (filters.resource) params.resource = filters.resource;
      if (filters.status !== "all")
        params.is_success = filters.status === "success";
      if (search.trim()) params.search = search.trim();

      const result = await logsService.getAdminActionLogs(params);
      setLogs(result.data);
      setTotal(result.total_count);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [page, limit, filters, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilters = useCallback((f: AdminLogsFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  return {
    stats,
    statsLoading,
    logs,
    logsLoading,
    total,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    applyFilters,
    resetFilters,
    search,
    setSearch,
    refresh: fetchLogs,
  };
}
