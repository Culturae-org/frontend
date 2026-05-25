"use client";

import { usersService } from "@/lib/services/users.service";
import type { AdminUser } from "@/lib/types/user.types";
import { useCallback, useEffect, useRef, useState } from "react";
import { enqueueSnackbar } from "notistack";

interface AvatarsFilters {
  role: string;
  account_status: string;
}

export function useAvatarsList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(48);
  const [filters, setFiltersState] = useState<AvatarsFilters>({ role: "", account_status: "" });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const stateRef = useRef({ currentPage, currentLimit, filters, debouncedSearch });
  useEffect(() => {
    stateRef.current = { currentPage, currentLimit, filters, debouncedSearch };
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async (
    page: number,
    limit: number,
    f: AvatarsFilters,
    search: string,
    isRefresh = false,
  ) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await usersService.getUsers({
        page,
        limit,
        has_avatar: true,
        ...(f.role && { role: f.role }),
        ...(f.account_status && { account_status: f.account_status }),
        ...(search && { query: search }),
      });
      setUsers(data.data ?? []);
      setCurrentPage(data.page ?? page);
      setTotalCount(data.total_count ?? 0);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to fetch avatars", { variant: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, stateRef.current.currentLimit, filters, debouncedSearch);
    setCurrentPage(1);
  }, [fetchUsers, filters, debouncedSearch]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchUsers(page, stateRef.current.currentLimit, stateRef.current.filters, stateRef.current.debouncedSearch);
  }, [fetchUsers]);

  const setLimit = useCallback((limit: number) => {
    setCurrentLimit(limit);
    setCurrentPage(1);
    fetchUsers(1, limit, stateRef.current.filters, stateRef.current.debouncedSearch);
  }, [fetchUsers]);

  const refresh = useCallback(() => {
    fetchUsers(
      stateRef.current.currentPage,
      stateRef.current.currentLimit,
      stateRef.current.filters,
      stateRef.current.debouncedSearch,
      true,
    );
  }, [fetchUsers]);

  const setFilter = useCallback((key: keyof AvatarsFilters, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    users,
    loading,
    refreshing,
    totalCount,
    currentPage,
    currentLimit,
    search,
    filters,
    goToPage,
    setLimit,
    setSearch,
    setFilter,
    refresh,
  };
}
