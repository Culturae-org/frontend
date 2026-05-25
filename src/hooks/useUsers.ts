"use client";

import { usersService } from "@/lib/services/users.service";
import { useUser } from "@/lib/stores";
import type { UsersQueryParams } from "@/lib/types/api.types";
import type {
  AdminUser,
  ConnectionLog,
  UserBanRequest,
  UserCreateData,
  UserPasswordUpdate,
  UserStatusUpdate,
  UserUpdateData,
} from "@/lib/types/user.types";
import { useCallback, useEffect, useRef, useState } from "react";
import { enqueueSnackbar } from "notistack";

export function useUserMutations() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refetchProfile, userId: currentUserId } = useUser();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const getUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getUsers({ page, limit });
      setUsers(data.data || []);
      setCurrentPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch users";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const getUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await usersService.getUserById(userId);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch user";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: UserCreateData) => {
    setLoading(true);
    setError(null);
    try {
      const user = await usersService.createUser(userData);
      enqueueSnackbar("User created successfully", { variant: "success" });
      return user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(
    async (userId: string, userData: UserUpdateData) => {
      setLoading(true);
      setError(null);
      try {
        const user = await usersService.updateUser(userId, userData);
        enqueueSnackbar("User updated successfully", { variant: "success" });
        if (currentUserId === userId) refetchProfile();
        return user;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update user";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, refetchProfile],
  );

  const updateUserPassword = useCallback(
    async (userId: string, data: UserPasswordUpdate) => {
      setLoading(true);
      setError(null);
      try {
        await usersService.updateUserPassword(userId, data);
        enqueueSnackbar("Password updated successfully", { variant: "success" });
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update password";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateUserStatus = useCallback(
    async (userId: string, data: UserStatusUpdate) => {
      setLoading(true);
      setError(null);
      try {
        await usersService.updateUserStatus(userId, data);
        enqueueSnackbar("User status updated successfully", { variant: "success" });
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update user status";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await usersService.deleteUser(userId);
      enqueueSnackbar("User deleted successfully", { variant: "success" });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const banUser = useCallback(async (userId: string, data: UserBanRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersService.banUser(userId, data);
      const isBanned =
        result.banned_until && new Date(result.banned_until) > new Date();
      const banUntilDate = result.banned_until
        ? new Date(result.banned_until).toLocaleString()
        : "";
      enqueueSnackbar(isBanned
          ? `User banned until ${banUntilDate}`
          : "User unbanned successfully", { variant: "success" });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to ban user";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(
    async (userId: string, file: File) => {
      setLoading(true);
      setError(null);
      try {
        const user = await usersService.uploadAvatar(userId, file);
        enqueueSnackbar("Avatar uploaded successfully", { variant: "success" });
        if (currentUserId === userId) refetchProfile();
        return user;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to upload avatar";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, refetchProfile],
  );

  const deleteAvatar = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
        await usersService.deleteAvatar(userId);
        enqueueSnackbar("Avatar deleted successfully", { variant: "success" });
        if (currentUserId === userId) refetchProfile();
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to delete avatar";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, refetchProfile],
  );

  const getUserSessions = useCallback(
    async (userId: string, page = 1, limit = 20) => {
      try {
        return await usersService.getUserSessions(userId, { page, limit });
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to fetch sessions", { variant: "error" });
        return null;
      }
    },
    [],
  );

  const getUserConnectionLogs = useCallback(
    async (userId: string, page = 1, limit = 50) => {
      try {
        return await usersService.getUserConnectionLogs(userId, {
          page,
          limit,
        });
      } catch (err) {
        enqueueSnackbar(err instanceof Error
            ? err.message
            : "Failed to fetch connection logs", { variant: "error" });
        return null;
      }
    },
    [],
  );

  const getUserActionLogs = useCallback(
    async (userId: string, page = 1, limit = 50) => {
      try {
        return await usersService.getUserActionLogs(userId, { page, limit });
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to fetch action logs", { variant: "error" });
        return null;
      }
    },
    [],
  );

  return {
    users,
    currentUser,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    getUsers,
    getUser,
    createUser,
    updateUser,
    updateUserPassword,
    updateUserStatus,
    deleteUser,
    banUser,
    uploadAvatar,
    deleteAvatar,
    getUserSessions,
    getUserConnectionLogs,
    getUserActionLogs,
  };
}

interface UsersListFilters {
  role: string;
  rank: string;
  account_status: string;
  status: string;
}

export function useUsersList(options?: {
  onTotalCountChange?: (count: number) => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(10);
  const [filters, setFilters] = useState<UsersListFilters>({
    role: "",
    rank: "",
    account_status: "",
    status: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stateRef = useRef({
    currentPage,
    currentLimit,
    filters,
    debouncedSearch,
  });
  useEffect(() => {
    stateRef.current = { currentPage, currentLimit, filters, debouncedSearch };
  }, [currentPage, currentLimit, filters, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === "" && Object.values(filters).every((f) => f === ""))
      setCurrentPage(1);
  }, [debouncedSearch, filters]);

  const fetchUsers = useCallback(
    async (
      page = stateRef.current.currentPage,
      limit = stateRef.current.currentLimit,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          limit,
          query: debouncedSearch || undefined,
          ...Object.fromEntries(
            Object.entries(stateRef.current.filters).filter(
              ([_, v]) => v !== "",
            ),
          ),
        } as UsersQueryParams;
        const data = await usersService.getUsers(params);
        setUsers(data.data || []);
        setCurrentPage(data.page || page);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || 0);
        optionsRef.current?.onTotalCountChange?.(data.total_count || 0);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to fetch users";
        setError(msg);
        enqueueSnackbar(msg, { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    fetchUsers(currentPage, currentLimit);
  }, [fetchUsers, currentPage, currentLimit]);

  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (prevFiltersRef.current !== filters) {
      prevFiltersRef.current = filters;
      fetchUsers(1, stateRef.current.currentLimit);
    }
  }, [filters, fetchUsers]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const updateUserStatus = useCallback(
    async (userId: string, data: { account_status: string }) => {
      try {
        await usersService.updateUserStatus(userId, data);
        enqueueSnackbar("User status updated successfully", { variant: "success" });
        await fetchUsers();
        return true;
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to update user status", { variant: "error" });
        return false;
      }
    },
    [fetchUsers],
  );

  const deactivateUser = useCallback(
    async (userId: string) => {
      try {
        await usersService.deactivateUser(userId);
        enqueueSnackbar("User deactivated successfully", { variant: "success" });
        await fetchUsers();
        return true;
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to deactivate user", { variant: "error" });
        return false;
      }
    },
    [fetchUsers],
  );

  const banUser = useCallback(
    async (userId: string, data: { duration: string; reason: string }) => {
      try {
        const result = await usersService.banUser(userId, data);
        const isBanned =
          result.banned_until && new Date(result.banned_until) > new Date();
        const banUntilDate = result.banned_until
          ? new Date(result.banned_until).toLocaleString()
          : "";
        enqueueSnackbar(isBanned
            ? `User banned until ${banUntilDate}`
            : "User unbanned successfully", { variant: "success" });
        await fetchUsers();
        return result;
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to ban user", { variant: "error" });
        throw err;
      }
    },
    [fetchUsers],
  );

  const unbanUser = useCallback(
    async (userId: string): Promise<AdminUser> => {
      try {
        const result = await usersService.unbanUser(userId);
        enqueueSnackbar("User unbanned successfully", { variant: "success" });
        await fetchUsers();
        return result;
      } catch (err) {
        enqueueSnackbar(err instanceof Error ? err.message : "Failed to unban user", { variant: "error" });
        throw err;
      }
    },
    [fetchUsers],
  );

  return {
    users,
    setUsers,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalCount,
    currentLimit,
    search,
    filters,
    setPage: setCurrentPage,
    setLimit: (limit: number) => {
      setCurrentLimit(limit);
      setCurrentPage(1);
    },
    setSearchQuery: (search: string) => {
      setSearch(search);
      setCurrentPage(1);
    },
    setFilter: (key: keyof UsersListFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    clearFilters: () => {
      setFilters({ role: "", rank: "", account_status: "", status: "" });
      setSearch("");
      setDebouncedSearch("");
      setCurrentPage(1);
    },
    refetch,
    updateUserStatus,
    deactivateUser,
    banUser,
    unbanUser,
  };
}

export function useUserStats() {
  const [levelStats, setLevelStats] = useState<Record<string, number>>({});
  const [roleStats, setRoleStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await usersService.getUserCount();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch count";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLevelStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await usersService.getLevelStats();
      setLevelStats(stats);
      return stats;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch level stats";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoleStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await usersService.getRoleStats();
      setRoleStats(stats);
      return stats;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch role stats";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCreationDates = useCallback(
    async (startDate?: string, endDate?: string) => {
      setLoading(true);
      setError(null);
      try {
        return await usersService.getCreationDates(startDate, endDate);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch creation dates";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    fetchUserCount,
    fetchLevelStats,
    fetchRoleStats,
    fetchCreationDates,
    loading,
    error,
    levelStats,
    roleStats,
  };
}

export function useUserLogs(userId: string) {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getUserConnectionLogs(userId, {
        page: 1,
        limit: 100,
      });
      setLogs(data.logs || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user logs",
      );
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to fetch user logs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}

export const useUsers = useUserMutations;
export const useUsersStats = useUserStats;
