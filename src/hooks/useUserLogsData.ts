import { useCallback, useEffect, useState } from "react";
import { logsService } from "@/lib/services/logs.service";
import type { UserActionLog, UserActionStats } from "@/lib/types/logs.types";

export interface UserLogsFilters {
  action: string;
  resource: string;
  status: string;
}

const DEFAULT_FILTERS: UserLogsFilters = { action: "", resource: "", status: "all" };

export function useUserLogsData() {
  const [stats, setStats] = useState<UserActionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [logs, setLogs] = useState<UserActionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filters, setFilters] = useState<UserLogsFilters>(DEFAULT_FILTERS);
  const [search, setSearchRaw] = useState("");

  useEffect(() => {
    setStatsLoading(true);
    logsService.getUserActionStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const derivedActionsByType = stats?.actions_by_type ?? {};
  const derivedTopUsers = stats?.top_users ?? [];

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      if (filters.action) params.action = filters.action;
      if (filters.resource) params.resource = filters.resource;
      if (filters.status !== "all") params.is_success = filters.status === "success";
      if (search.trim()) params.search = search.trim();

      const result = await logsService.getAllUserActionLogs(params);
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

  const applyFilters = useCallback((f: UserLogsFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  return {
    stats,
    statsLoading,
    derivedActionsByType,
    derivedTopUsers,
    logs,
    logsLoading,
    total,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    applyFilters,
    search,
    setSearch,
    refresh: fetchLogs,
  };
}
