import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add20Regular,
  AppsList20Filled,
  ArrowSync20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Grid20Regular,
  Search20Regular,
  TextColumnThree20Regular,
} from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { useUsersList } from "@/hooks/useUsers";
import { usersService } from "@/lib/services/users.service";
import { apiGet } from "@/lib/api-client";
import { SETTINGS_ENDPOINTS } from "@/lib/api/endpoints";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import { SquareMenu, SquareMenuItem } from "@/components/Common/RowActionMenu";
import UserRow, { type ColumnKey } from "./UserRow";
import UserFilterPopover, { type UserFilters } from "./UserFilterPopover";
import ColumnTogglePopover from "./ColumnTogglePopover";
import UserCreateDialog from "./UserCreateDialog";
import UserEditDialog from "./UserEditDialog";
import UserViewDialog from "./UserViewDialog";
import UserBanDialog from "./UserBanDialog";
import type { AdminUser } from "@/lib/types/user.types";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import { AvatarCard, AvatarCardSkeleton } from "@/pages/Avatars/AvatarCard";

const DEFAULT_COLUMNS: ColumnKey[] = ["email", "role", "status", "elo", "created_at"];

const COLUMN_MIN_WIDTHS: Partial<Record<ColumnKey, number>> = {
  email: 200,
  role: 100,
  status: 110,
  elo: 70,
  created_at: 100,
  level: 70,
  rank: 110,
  experience: 90,
  elo_games: 90,
  is_online: 70,
  last_seen: 100,
  language: 90,
  total_games: 80,
  win_rate: 80,
  day_streak: 80,
  current_game: 110,
  updated_at: 100,
  private_id: 120,
  public_id: 120,
};

export default function UsersPage() {
  const { t } = useTranslation("dashboard");
  const {
    users,
    loading,
    refreshing,
    totalCount,
    currentPage,
    currentLimit,
    search,
    filters,
    setPage,
    setLimit,
    setSearchQuery,
    setFilter,
    refetch,
  } = useUsersList();

  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);
  const [visibleOptional, setVisibleOptional] = useState<Set<ColumnKey>>(new Set());

  const editUserId = searchParams.get("edit");
  const viewUserId = searchParams.get("view");
  const viewActivityUserId = searchParams.get("view_activity");
  const activeViewId = viewUserId ?? viewActivityUserId;
  const actionParam = searchParams.get("action");


  const isCreateOpen = createOpen || actionParam === "create";

  const closeCreate = () => {
    setCreateOpen(false);
    setSearchParams((p) => { p.delete("action"); return p; }, { replace: true });
  };

  const COLUMN_LABELS = useMemo<Record<ColumnKey, string>>(() => ({
    email: t("users.table.headers.email"),
    role: t("users.table.headers.role"),
    status: t("users.table.headers.status"),
    elo: t("users.table.headers.elo"),
    created_at: t("users.table.headers.created"),
    level: t("users.table.headers.level"),
    rank: t("users.table.headers.rank"),
    experience: t("users.table.headers.xp"),
    elo_games: t("users.table.headers.eloGames"),
    is_online: t("users.table.headers.online"),
    last_seen: t("users.table.headers.lastSeen"),
    language: t("users.table.headers.language"),
    total_games: t("users.table.headers.games"),
    win_rate: t("users.table.headers.winRate"),
    day_streak: t("users.table.headers.streak"),
    current_game: t("users.table.headers.currentGame"),
    updated_at: t("users.table.headers.updated"),
    private_id: t("users.table.headers.privateId"),
    public_id: t("users.table.headers.publicId"),
  }), [t]);

  useEffect(() => {
    if (!activeViewId) { setViewUser(null); return; }
    if (viewUser?.id === activeViewId) return;
    const found = users.find((u) => u.id === activeViewId);
    if (found) {
      setViewUser(found);
    } else {
      usersService.getUserById(activeViewId)
        .then(setViewUser)
        .catch(() => setSearchParams((p) => { p.delete("view"); p.delete("view_activity"); return p; }, { replace: true }));
    }
  }, [activeViewId, users]);

  const openView = (user: AdminUser) => {
    setSearchParams((p) => { p.set("view", user.id); p.delete("edit"); p.delete("view_activity"); return p; }, { replace: true });
    setViewUser(user);
  };

  const closeView = () => {
    setSearchParams((p) => { p.delete("view"); p.delete("view_activity"); return p; }, { replace: true });
    setViewUser(null);
  };

  const openEdit = (id: string) => {
    setSearchParams((p) => { p.set("edit", id); p.delete("view"); return p; }, { replace: true });
  };

  const closeEdit = () => {
    setSearchParams((p) => { p.delete("edit"); return p; }, { replace: true });
  };

  const visibleColumns = useMemo(() => {
    const set = new Set<ColumnKey>([...DEFAULT_COLUMNS, ...visibleOptional]);
    return set;
  }, [visibleOptional]);

  const [ranks, setRanks] = useState<string[]>([]);

  useEffect(() => {
    apiGet(SETTINGS_ENDPOINTS.XP_CONFIG)
      .then((res) => res.json())
      .then((body) => {
        const rankList = body?.data?.ranks ?? body?.ranks ?? [];
        setRanks(rankList.map((r: { name: string }) => r.name).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [gridCtxMenu, setGridCtxMenu] = useState<{ user: AdminUser; x: number; y: number } | null>(null);

  const handleGridContextMenu = useCallback((user: AdminUser, e: React.MouseEvent) => {
    setGridCtxMenu({ user, x: e.clientX, y: e.clientY });
  }, []);

  const closeGridCtxMenu = useCallback(() => setGridCtxMenu(null), []);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!loading && !refreshing && busy) {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    }
    return () => clearTimeout(busyTimer.current);
  }, [loading, refreshing, busy]);

  const hasActiveFilters = !!filters.role || !!filters.account_status || !!filters.status || !!filters.rank;

  const currentFilters: UserFilters = {
    role: filters.role,
    account_status: filters.account_status,
    status: filters.status,
    rank: filters.rank,
  };

  const handleApplyFilters = (f: UserFilters) => {
    setFilter("role", f.role);
    setFilter("account_status", f.account_status);
    setFilter("status", f.status);
    setFilter("rank", f.rank);
  };

  const handleToggleColumn = (key: ColumnKey) => {
    setVisibleOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await usersService.deleteUser(id);
      enqueueSnackbar(t("users.delete.success"), { variant: "success" });
      refetch();
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("users.delete.error"),
        { variant: "error" }
      );
    }
  };

  const handleBanConfirm = async (userId: string, duration: string, reason: string) => {
    try {
      await usersService.banUser(userId, { duration, reason: reason || undefined });
      enqueueSnackbar(t("users.ban.success"), { variant: "success" });
      refetch();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.ban.error"), { variant: "error" });
      throw err;
    }
  };

  const handleUnban = async (user: AdminUser) => {
    const ok = await confirm({
      title: t("users.unban.title"),
      description: t("users.unban.description", { username: user.username }),
      confirmText: t("users.unban.confirm"),
    });
    if (!ok) return;
    try {
      await usersService.unbanUser(user.id);
      enqueueSnackbar(t("users.unban.success"), { variant: "success" });
      refetch();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.unban.error"), { variant: "error" });
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    const ok = await confirm({
      title: t("users.deactivate.title"),
      description: t("users.deactivate.description", { username: user.username }),
      confirmText: t("users.deactivate.confirm"),
      danger: true,
    });
    if (!ok) return;
    try {
      await usersService.deactivateUser(user.id);
      enqueueSnackbar(t("users.deactivate.success"), { variant: "success" });
      refetch();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.deactivate.error"), { variant: "error" });
    }
  };

  const handleReactivate = async (user: AdminUser) => {
    const ok = await confirm({
      title: t("users.reactivate.title"),
      description: t("users.reactivate.description", { username: user.username }),
      confirmText: t("users.reactivate.confirm"),
    });
    if (!ok) return;
    try {
      await usersService.updateUserStatus(user.id, { account_status: "active" });
      enqueueSnackbar(t("users.reactivate.success"), { variant: "success" });
      refetch();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.reactivate.error"), { variant: "error" });
    }
  };

  const handleEditFromView = (user: AdminUser) => {
    openEdit(user.id);
  };

  const isAnyLoading = loading || refreshing || busy;
  const showSkeletons = loading && users.length === 0;
  const showRefreshSkeletons = (refreshing || busy) && users.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title={t("nav.users")}
        subtitle={totalCount > 0 ? t("users.subtitle", { count: totalCount }) : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <Button variant="contained" startIcon={<Add20Regular />} onClick={() => setSearchParams((p) => { p.set("action", "create"); return p; }, { replace: true })}>
          {t("users.toolbar.create")}
        </Button>
        <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isAnyLoading}>
          {t("users.toolbar.refresh")}
        </SecondaryButton>
        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <SecondaryButton variant="contained" startIcon={<Filter20Regular />} onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
            {t("users.toolbar.filter")}
          </SecondaryButton>
        </Badge>
        <SecondaryButton variant="contained" startIcon={<TextColumnThree20Regular />} onClick={(e) => setColumnAnchorEl(e.currentTarget)}>
          {t("users.toolbar.columns")}
        </SecondaryButton>
        <SecondaryButton
          variant="contained"
          onClick={() => setView((v) => v === "list" ? "grid" : "list")}
          sx={{ minHeight: 36.5, px: 2 }}
        >
          {view === "list" ? <Grid20Regular style={{ fontSize: 18 }} /> : <AppsList20Filled style={{ fontSize: 18 }} />}
        </SecondaryButton>
        <TextField
          size="small"
          placeholder={t("users.toolbar.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ ml: "auto !important", width: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search20Regular style={{ fontSize: 16 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setSearchQuery("")} tabIndex={-1}>
                    <Dismiss20Regular style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Stack>

      {view === "grid" && (
        <>
          {isAnyLoading && <LinearProgress sx={{ mb: 0.5, height: 2, borderRadius: 1 }} />}
          {showSkeletons ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
              {Array.from({ length: 24 }).map((_, i) => <AvatarCardSkeleton key={i} />)}
            </Box>
          ) : showRefreshSkeletons ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
              {users.map((_, i) => <AvatarCardSkeleton key={i} />)}
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">{t("users.table.noResults")}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
              {users.map((user) => (
                <AvatarCard key={user.id} user={user} onClick={openView} onContextMenu={handleGridContextMenu} />
              ))}
            </Box>
          )}
        </>
      )}

      {view === "list" && (
        <TableContainer
          component={Paper}
          sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}
        >
          {isAnyLoading && (
            <LinearProgress
              sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
            />
          )}
          <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 180, whiteSpace: "nowrap" }}>{t("users.table.headers.username")}</TableCell>
                {Array.from(visibleColumns).map((col) => (
                  <TableCell key={col} sx={{ minWidth: COLUMN_MIN_WIDTHS[col] ?? 90, whiteSpace: "nowrap" }}>
                    {COLUMN_LABELS[col]}
                  </TableCell>
                ))}
                <TableCell sx={{ minWidth: 52 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {showSkeletons ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <UserRow key={`skel-${i}`} loading visibleColumns={visibleColumns} />
                ))
              ) : showRefreshSkeletons ? (
                users.map((_, i) => (
                  <UserRow key={`ref-${i}`} loading visibleColumns={visibleColumns} />
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.size + 2} sx={{ py: 6, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">{t("users.table.noResults")}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    visibleColumns={visibleColumns}
                    onView={openView}
                    onEdit={(u) => openEdit(u.id)}
                    onDelete={handleDelete}
                    onBan={setBanTarget}
                    onUnban={handleUnban}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={currentPage - 1}
          rowsPerPage={currentLimit}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, p) => setPage(p + 1)}
          onRowsPerPageChange={(e) => setLimit(Number(e.target.value))}
          labelRowsPerPage={t("users.table.rowsPerPage")}
          sx={{ mt: 1 }}
        />
      )}

      <UserFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={currentFilters}
        onApply={handleApplyFilters}
        ranks={ranks}
      />
      <ColumnTogglePopover
        anchorEl={columnAnchorEl}
        open={Boolean(columnAnchorEl)}
        onClose={() => setColumnAnchorEl(null)}
        visibleOptional={visibleOptional}
        onToggle={handleToggleColumn}
      />

      <UserCreateDialog
        open={isCreateOpen}
        onClose={closeCreate}
        onCreated={() => { closeCreate(); refetch(); }}
      />
      <UserViewDialog
        user={viewUser}
        open={Boolean(activeViewId)}
        onClose={closeView}
        onEdit={handleEditFromView}
        initialActivity={Boolean(viewActivityUserId)}
        onToggleActivity={(active) => {
          if (!activeViewId) return;
          setSearchParams((p) => {
            if (active) { p.set("view_activity", activeViewId); p.delete("view"); }
            else { p.set("view", activeViewId); p.delete("view_activity"); }
            return p;
          }, { replace: true });
        }}
      />
      <UserEditDialog
        userId={editUserId}
        open={Boolean(editUserId)}
        onClose={closeEdit}
        onUpdated={refetch}
      />
      <UserBanDialog
        open={Boolean(banTarget)}
        user={banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={handleBanConfirm}
      />

      <SquareMenu
        open={Boolean(gridCtxMenu)}
        onClose={closeGridCtxMenu}
        anchorReference="anchorPosition"
        anchorPosition={gridCtxMenu ? { top: gridCtxMenu.y, left: gridCtxMenu.x } : undefined}
        MenuListProps={{ dense: true }}
        componentsProps={{ root: { onContextMenu: (e: React.MouseEvent) => e.preventDefault() } }}
      >
        {gridCtxMenu && (() => {
          const u = gridCtxMenu.user;
          const close = (fn: () => void) => { closeGridCtxMenu(); fn(); };
          const items = [
            { label: t("users.actions.viewDetails"), onClick: () => close(() => openView(u)) },
            { label: t("users.actions.edit"), onClick: () => close(() => openEdit(u.id)) },
            ...(u.account_status === "active" ? [
              { label: t("users.actions.deactivate"), onClick: () => close(() => handleDeactivate(u)) },
              { label: t("users.actions.ban"), onClick: () => close(() => setBanTarget(u)) },
            ] : []),
            ...(u.account_status === "inactive" ? [
              { label: t("users.actions.reactivate"), onClick: () => close(() => handleReactivate(u)) },
              { label: t("users.actions.ban"), onClick: () => close(() => setBanTarget(u)) },
            ] : []),
            ...(u.account_status === "banned" || u.account_status === "suspended" ? [
              { label: t("users.actions.unban"), onClick: () => close(() => handleUnban(u)) },
            ] : []),
            { label: t("users.actions.delete"), onClick: () => close(() => handleDelete(u.id)) },
          ];
          return (
            <>
              {items.map((a, i) => (
                <SquareMenuItem key={i} dense onClick={a.onClick}>
                  <ListItemText>{a.label}</ListItemText>
                </SquareMenuItem>
              ))}
            </>
          );
        })()}
      </SquareMenu>
    </PageContainer>
  );
}
