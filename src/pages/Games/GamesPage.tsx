import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Box,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
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
  ArrowSync20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Search20Regular,
  TextColumnThree20Regular,
  Delete20Regular,
  Dismiss24Regular,
  Archive20Regular,
  ArrowUndo20Regular,
  Broom20Regular,
  Wrench20Regular,
} from "@fluentui/react-icons";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";
import { useGames } from "@/hooks/useGames";
import { gamesService } from "@/lib/services/games.service";
import { usersService } from "@/lib/services/users.service";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AdminGame } from "@/lib/types/games.types";
import { SecondaryButton, SquareChip, NoWrapTypography } from "@/components/Common/StyledComponents";
import { RowActionMenu } from "@/components/Common/RowActionMenu";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import GameFilterPopover, { type GameFilters } from "./GameFilterPopover";
import GameColumnTogglePopover, { type GameColumnKey, OPTIONAL_GAME_COLUMNS } from "./GameColumnTogglePopover";

function ModeChip({ mode }: { mode: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "default" | "primary" | "secondary"> = {
    solo: "default",
    "1v1": "primary",
    multi: "secondary",
  };
  return (
    <SquareChip
      label={t(`games.mode.${mode}`, { defaultValue: mode })}
      color={colorMap[mode] ?? "default"}
      size="small"
      variant="outlined"
      sx={{ height: 20, fontSize: "0.75rem" }}
    />
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  return (
    <SquareChip
      label={t(`games.status.${status}`, { defaultValue: status })}
      color="default"
      size="small"
      sx={{
        height: 20,
        fontSize: "0.75rem",
        ...(status === "archived" && {
          bgcolor: "action.selected",
          color: "text.secondary",
        }),
      }}
    />
  );
}

function RowSkeleton({ colCount }: { colCount: number }) {
  const total = colCount + 6;
  return (
    <TableRow sx={{ height: 43 }}>
      {Array.from({ length: total }).map((_, i) =>
        i === total - 1 ? (
          <TableCell key={i} align="right" sx={{ width: 52, minWidth: 52 }}>
            <Skeleton variant="circular" width={28} height={28} sx={{ ml: "auto" }} />
          </TableCell>
        ) : (
          <TableCell key={i}>
            <Skeleton variant="text" width={60 + (i % 3) * 30} />
          </TableCell>
        )
      )}
    </TableRow>
  );
}

function calcDuration(startedAt: string | null | undefined, completedAt: string | null | undefined): string {
  if (!startedAt || !completedAt) return "—";
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (diffMs <= 0) return "—";
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function cellFor(
  col: GameColumnKey,
  game: AdminGame,
  formatDateOnly: (d: string | Date | null | undefined) => string,
) {
  const sx = { fontSize: "0.875rem", whiteSpace: "nowrap" as const };
  const sxSec = { fontSize: "0.875rem", color: "text.secondary", whiteSpace: "nowrap" as const };

  switch (col) {
    case "players":
      return (
        <TableCell key={col} sx={sx}>
          {game.current_players != null && game.max_players != null
            ? `${game.current_players}/${game.max_players}`
            : (game.players?.length ?? "—")}
        </TableCell>
      );
    case "questions":
      return <TableCell key={col} sx={sx}>{game.question_count ?? "—"}</TableCell>;
    case "category":
      return <TableCell key={col} sx={sx}>{game.category ?? "—"}</TableCell>;
    case "language":
      return (
        <TableCell key={col}>
          {game.language ? (
            <SquareChip
              label={game.language.toUpperCase()}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.75rem" }}
            />
          ) : "—"}
        </TableCell>
      );
    case "flag_variant":
      return <TableCell key={col} sx={sx}>{game.flag_variant ?? "—"}</TableCell>;
    case "created_at":
      return <TableCell key={col} sx={sxSec}>{formatDateOnly(game.created_at)}</TableCell>;
    case "started_at":
      return <TableCell key={col} sx={sxSec}>{game.started_at ? formatDateOnly(game.started_at) : "—"}</TableCell>;
    case "completed_at":
      return <TableCell key={col} sx={sxSec}>{game.completed_at ? formatDateOnly(game.completed_at) : "—"}</TableCell>;
    case "duration":
      return <TableCell key={col} sx={sx}>{calcDuration(game.started_at, game.completed_at)}</TableCell>;
    case "public_id":
      return (
        <TableCell key={col} sx={{ fontSize: "0.78rem", fontFamily: "monospace", color: "text.secondary" }}>
          <NoWrapTypography variant="inherit">
            {(game.public_id ?? game.id).substring(0, 8)}…
          </NoWrapTypography>
        </TableCell>
      );
    default:
      return <TableCell key={col} />;
  }
}

const DEFAULT_VISIBLE_COLS: GameColumnKey[] = [];

export default function GamesPage() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const confirm = useConfirm();
  const { formatDateOnly } = useDateFormat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    games,
    loading,
    refreshing,
    totalCount,
    currentPage,
    totalPages,
    currentLimit,
    filters,
    goToPage,
    setPageSize,
    refresh,
    setFilter,
    removeGame,
  } = useGames();

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);
  const [visibleOptional, setVisibleOptional] = useState<Set<GameColumnKey>>(new Set(DEFAULT_VISIBLE_COLS));
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const mode = searchParams.get("mode") ?? "";
    const status = searchParams.get("status") ?? "";
    const archived = searchParams.get("archived") ?? "";
    if (mode) setFilter("mode", mode);
    if (status) setFilter("status", status);
    if (archived) setFilter("archived", archived);
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filters.mode) next.set("mode", filters.mode); else next.delete("mode");
      if (filters.status) next.set("status", filters.status); else next.delete("status");
      if (filters.archived) next.set("archived", filters.archived); else next.delete("archived");
      return next;
    }, { replace: true });
  }, [filters.mode, filters.status, filters.archived]);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !refreshing && busy) {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    }
    return () => clearTimeout(busyTimer.current);
  }, [loading, refreshing, busy]);

  const hasActiveFilters = !!(filters.mode || filters.status || (filters.archived && filters.archived !== "all"));

  const currentGameFilters: GameFilters = {
    mode: filters.mode,
    status: filters.status,
    archived: filters.archived,
  };

  const handleApplyFilters = (f: GameFilters) => {
    setFilter("mode", f.mode);
    setFilter("status", f.status);
    setFilter("archived", f.archived);
  };

  const handleToggleColumn = (key: GameColumnKey) => {
    setVisibleOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleCancel = async (game: AdminGame) => {
    const ok = await confirm({
      title: t("games.actions.cancelTitle"),
      description: t("games.actions.cancelConfirm"),
      confirmText: t("games.actions.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.cancel(game.id);
      enqueueSnackbar(t("games.actions.cancelSuccess"), { variant: "success" });
      refresh();
    } catch {
      enqueueSnackbar(t("games.actions.cancelError"), { variant: "error" });
    }
  };

  const handleArchive = async (game: AdminGame) => {
    const ok = await confirm({
      title: t("games.actions.archiveTitle"),
      description: t("games.actions.archiveConfirm"),
      confirmText: t("games.actions.archive"),
    });
    if (!ok) return;
    try {
      await gamesService.archiveGame(game.id);
      enqueueSnackbar(t("games.actions.archiveSuccess"), { variant: "success" });
      refresh();
    } catch {
      enqueueSnackbar(t("games.actions.archiveError"), { variant: "error" });
    }
  };

  const handleUnarchive = async (game: AdminGame) => {
    try {
      await gamesService.unarchiveGame(game.id);
      enqueueSnackbar(t("games.actions.unarchiveSuccess"), { variant: "success" });
      refresh();
    } catch {
      enqueueSnackbar(t("games.actions.unarchiveError"), { variant: "error" });
    }
  };

  const handleCleanup = async () => {
    const ok = await confirm({
      title: t("games.actions.cleanupTitle"),
      description: t("games.actions.cleanupConfirm"),
      confirmText: t("games.actions.cleanup"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.cleanup();
      enqueueSnackbar(t("games.actions.cleanupSuccess"), { variant: "success" });
      refresh();
    } catch {
      enqueueSnackbar(t("games.actions.cleanupError"), { variant: "error" });
    }
  };

  const handleMaintenance = async () => {
    const ok = await confirm({
      title: t("games.actions.maintenanceTitle"),
      description: t("games.actions.maintenanceConfirm"),
      confirmText: t("games.actions.maintenance"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.maintenance();
      enqueueSnackbar(t("games.actions.maintenanceSuccess"), { variant: "success" });
      refresh();
    } catch {
      enqueueSnackbar(t("games.actions.maintenanceError"), { variant: "error" });
    }
  };

  const handleDelete = async (game: AdminGame) => {
    const ok = await confirm({
      title: t("games.actions.deleteTitle"),
      description: t("games.actions.deleteConfirm"),
      confirmText: t("games.actions.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await gamesService.deleteGame(game.id);
      enqueueSnackbar(t("games.actions.deleteSuccess"), { variant: "success" });
      removeGame(game.id);
    } catch {
      enqueueSnackbar(t("games.actions.deleteError"), { variant: "error" });
    }
  };

  const COLUMN_LABELS = useMemo<Record<GameColumnKey, string>>(() => ({
    players: t("games.columns.players"),
    questions: t("games.columns.questions"),
    category: t("games.columns.category"),
    language: t("games.columns.language"),
    flag_variant: t("games.columns.flagVariant"),
    created_at: t("games.columns.createdAt"),
    started_at: t("games.columns.startedAt"),
    completed_at: t("games.columns.completedAt"),
    duration: t("games.columns.duration"),
    public_id: t("games.columns.publicId"),
  }), [t]);

  const visibleColumns = useMemo(
    () => new Set<GameColumnKey>(OPTIONAL_GAME_COLUMNS.filter((c) => visibleOptional.has(c))),
    [visibleOptional],
  );

  const isAnyLoading = loading || refreshing || busy;
  const showSkeletons = loading && games.length === 0;
  const showRefreshSkeletons = (refreshing || busy) && games.length > 0;
  const colCount = visibleColumns.size;

  return (
    <PageContainer>
      <PageHeader
        title={t("nav.games")}
        subtitle={totalCount > 0 ? t("games.subtitle", { count: totalCount }) : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder={t("games.toolbar.search")}
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          sx={{ width: 230 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search20Regular style={{ fontSize: 16 }} />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setFilter("search", "")} tabIndex={-1}>
                    <Dismiss20Regular style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <SecondaryButton
          variant="contained"
          startIcon={<ArrowSync20Regular />}
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          {t("games.toolbar.refresh")}
        </SecondaryButton>
        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <SecondaryButton
            variant="contained"
            startIcon={<Filter20Regular />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            {t("games.toolbar.filter")}
          </SecondaryButton>
        </Badge>
        <SecondaryButton
          variant="contained"
          startIcon={<TextColumnThree20Regular />}
          onClick={(e) => setColumnAnchorEl(e.currentTarget)}
        >
          {t("games.toolbar.columns")}
        </SecondaryButton>

        <Box sx={{ flexGrow: 1 }} />

        <SecondaryButton
          variant="contained"
          startIcon={<Broom20Regular />}
          onClick={handleCleanup}
          disabled={isAnyLoading}
        >
          {t("games.actions.cleanup")}
        </SecondaryButton>

        <SecondaryButton
          variant="contained"
          startIcon={<Wrench20Regular />}
          onClick={handleMaintenance}
          disabled={isAnyLoading}
        >
          {t("games.actions.maintenance")}
        </SecondaryButton>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}
      >
        {isAnyLoading && (
          <LinearProgress
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
          />
        )}
        <Table size="small" stickyHeader sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 90, whiteSpace: "nowrap" }}>{t("games.columns.mode")}</TableCell>
              <TableCell sx={{ minWidth: 110, whiteSpace: "nowrap" }}>{t("games.columns.status")}</TableCell>
              <TableCell sx={{ minWidth: 160, whiteSpace: "nowrap" }}>{t("games.columns.players")}</TableCell>
              <TableCell sx={{ minWidth: 110, whiteSpace: "nowrap" }}>{t("games.columns.category")}</TableCell>
              <TableCell sx={{ minWidth: 90, whiteSpace: "nowrap" }}>{t("games.columns.createdAt")}</TableCell>
              {Array.from(visibleColumns).map((col) => (
                <TableCell key={col} sx={{ minWidth: 90, whiteSpace: "nowrap" }}>
                  {COLUMN_LABELS[col]}
                </TableCell>
              ))}
              <TableCell sx={{ minWidth: 52 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeletons ? (
              Array.from({ length: 10 }).map((_, i) => (
                <RowSkeleton key={`skel-${i}`} colCount={colCount} />
              ))
            ) : showRefreshSkeletons ? (
              games.map((_, i) => (
                <RowSkeleton key={`ref-${i}`} colCount={colCount} />
              ))
            ) : games.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount + 6} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("games.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              games.map((game) => {
                const isActive = ["waiting", "ready", "in_progress"].includes(game.status);
                const isArchived = game.is_archived;
                return (
                  <TableRow
                    key={game.id}
                    hover
                    sx={{ cursor: "pointer", height: 43, opacity: isArchived ? 0.45 : 1 }}
                    onClick={() => navigate(`/games/${game.id}`)}
                  >
                    <TableCell><ModeChip mode={game.mode} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StatusChip status={game.status} />
                        {isArchived && <StatusChip status="archived" />}
                      </Stack>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {game.players && game.players.length > 0 ? (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                          {game.players.map((p, i) => {
                            const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                            const userId = p.user?.id || p.user_public_id || null;
                            return (
                              <Typography
                                key={p.id}
                                variant="body2"
                                component="span"
                                onClick={async () => {
                                  if (userId) {
                                    navigate(`/users?view=${userId}`);
                                    return;
                                  }
                                  try {
                                    const res = await usersService.getUsers({ query: username, limit: 1 });
                                    const found = res.data[0];
                                    if (found) navigate(`/users?view=${found.id}`);
                                  } catch { /* ignore */ }
                                }}
                                sx={{
                                  cursor: "pointer",
                                  color: "primary.main",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {username}{i < game.players!.length - 1 ? "," : ""}
                              </Typography>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    {cellFor("category", game, formatDateOnly)}
                    <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                      {formatDateOnly(game.created_at)}
                    </TableCell>
                    {Array.from(visibleColumns).map((col) =>
                      cellFor(col, game, formatDateOnly)
                    )}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <RowActionMenu
                        actions={[
                          ...(isActive ? [{
                            label: t("games.actions.cancel"),
                            icon: <Dismiss24Regular />,
                            onClick: () => handleCancel(game),
                          }] : []),
                          ...(game.is_archived ? [{
                            label: t("games.actions.unarchive"),
                            icon: <ArrowUndo20Regular />,
                            onClick: () => handleUnarchive(game),
                          }] : [{
                            label: t("games.actions.archive"),
                            icon: <Archive20Regular />,
                            onClick: () => handleArchive(game),
                          }]),
                          {
                            label: t("games.actions.delete"),
                            icon: <Delete20Regular />,
                            onClick: () => handleDelete(game),
                            danger: true,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={currentPage - 1}
          rowsPerPage={currentLimit}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => goToPage(p + 1)}
          onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
          labelRowsPerPage={t("users.table.rowsPerPage")}
          sx={{ mt: 1 }}
        />
      )}

      <GameFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={currentGameFilters}
        onApply={handleApplyFilters}
      />
      <GameColumnTogglePopover
        anchorEl={columnAnchorEl}
        open={Boolean(columnAnchorEl)}
        onClose={() => setColumnAnchorEl(null)}
        visible={visibleOptional}
        onToggle={handleToggleColumn}
      />

    </PageContainer>
  );
}
