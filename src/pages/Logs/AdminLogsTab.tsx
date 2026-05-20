import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowSync20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Search20Regular,
  TextColumnThree20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
} from "@fluentui/react-icons";
import { alpha, useTheme } from "@mui/material/styles";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PieChart } from "@mui/x-charts/PieChart";
import { useAdminLogsData } from "@/hooks/useAdminLogsData";
import { usersService } from "@/lib/services/users.service";
import { useDateFormat } from "@/hooks/useDateFormat";
import { SecondaryButton, BorderedCard } from "@/components/Common/StyledComponents";
import LogFilterPopover from "./LogFilterPopover";
import LogColumnTogglePopover, { type LogColumnKey } from "./LogColumnTogglePopover";

function truncate(s: string, max = 32) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function StatItem({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) {
  return (
    <Box>
      {loading ? (
        <Skeleton variant="text" width={60} height={36} />
      ) : (
        <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
        {label}
      </Typography>
    </Box>
  );
}

function RowSkeleton({ colCount }: { colCount: number }) {
  return (
    <TableRow>
      {Array.from({ length: colCount }).map((_, i) => (
        <TableCell key={i}><Skeleton variant="text" width={50 + (i % 3) * 40} /></TableCell>
      ))}
    </TableRow>
  );
}

const DEFAULT_COLS = 5;

export default function AdminLogsTab() {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const { formatDateWithSeconds } = useDateFormat();
  const {
    stats, statsLoading,
    logs, logsLoading, total,
    page, setPage, limit, setLimit,
    filters, applyFilters,
    search, setSearch,
    refresh,
  } = useAdminLogsData();

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);
  const [visibleOptional, setVisibleOptional] = useState<Set<LogColumnKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    refresh().finally(() => {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    });
  }, [refresh]);

  const handleToggleColumn = (key: LogColumnKey) => {
    setVisibleOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const hasActiveFilters = !!(filters.action || filters.resource || filters.status !== "all");
  const isLoading = logsLoading || busy;
  const showSkeletons = logsLoading && logs.length === 0;
  const showRefreshSkeletons = isLoading && logs.length > 0;
  const colCount = DEFAULT_COLS + visibleOptional.size;

  const radarData = useMemo(() => {
    if (!stats?.actions_by_type) return [];
    return Object.entries(stats.actions_by_type)
      .sort(([, a], [, b]) => b - a).slice(0, 8)
      .map(([action, count]) => ({ action, count }));
  }, [stats]);

  const resourceData = useMemo(() => {
    if (!stats?.actions_by_resource) return [];
    return Object.entries(stats.actions_by_resource)
      .sort(([, a], [, b]) => b - a).slice(0, 6)
      .map(([key, count]) => ({ key, count }));
  }, [stats]);

  const [allAdminNames, setAllAdminNames] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      usersService.getUsers({ role: "administrator", limit: 100 }),
      usersService.getUsers({ role: "moderator", limit: 100 }),
    ]).then(([admins, mods]) => {
      setAllAdminNames([
        ...admins.data.map((u) => u.username),
        ...mods.data.map((u) => u.username),
      ]);
    }).catch(() => {});
  }, []);

  const adminData = useMemo(() => {
    const byAdmin = stats?.actions_by_admin ?? {};
    const names = new Set([...Object.keys(byAdmin), ...allAdminNames]);
    return Array.from(names)
      .map((key) => ({ key, count: byAdmin[key] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [stats, allAdminNames]);

  const resourceOptions = useMemo(
    () => Object.keys(stats?.actions_by_resource ?? {}).sort(),
    [stats],
  );

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0, mb: 3 }}>
        {[
          { label: t("logs.stats.totalActions"), value: stats?.total_actions ?? 0 },
          { label: t("logs.stats.successRate"), value: stats ? `${Math.round(stats.success_rate)}%` : "—" },
          { label: t("logs.stats.dailyAvg"), value: stats ? Math.round(stats.daily_average) : 0 },
        ].map((s, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "stretch" }}>
            {i > 0 && <Box sx={{ width: "1px", bgcolor: "divider", mx: 3, my: 0.5 }} />}
            <StatItem label={s.label} value={s.value} loading={statsLoading} />
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <BorderedCard sx={{ flex: "1 1 300px", minWidth: 0, p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("logs.charts.byActionType")}
          </Typography>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
          ) : radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                <PolarGrid stroke={theme.palette.divider} />
                <PolarAngleAxis dataKey="action" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="count" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.25} />
                <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" color="text.disabled">{t("analytics.noData")}</Typography>
            </Box>
          )}
        </BorderedCard>

        <BorderedCard sx={{ flex: "1 1 300px", minWidth: 0, p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("logs.charts.byResource")}
          </Typography>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
          ) : resourceData.length > 0 ? (
            <PieChart
              series={[{
                data: resourceData.map((d, i) => ({
                  id: i,
                  value: d.count,
                  label: d.key,
                  color: i === 0
                    ? theme.palette.primary.main
                    : alpha(theme.palette.primary.main, Math.max(0.15, 0.65 - i * 0.12)),
                })),
                innerRadius: 55,
                outerRadius: 82,
                paddingAngle: 2,
                cornerRadius: 4,
                startAngle: -45,
                endAngle: 225,
              }]}
              height={220}
              margin={{ right: 120 }}
              slotProps={{
                legend: {
                  direction: "column",
                  position: { vertical: "middle", horizontal: "right" },
                  padding: 0,
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 6,
                  itemGap: 6,
                },
              }}
              sx={{
                "& .MuiChartsLegend-label": { fontSize: "0.72rem" },
              }}
            />
          ) : (
            <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" color="text.disabled">{t("analytics.noData")}</Typography>
            </Box>
          )}
        </BorderedCard>

        {adminData.length > 0 && (
          <BorderedCard sx={{ flex: "1 1 300px", minWidth: 0, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t("logs.charts.byAdmin")}
            </Typography>
            {statsLoading ? (
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsBar data={adminData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke={theme.palette.divider} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="key" type="category" width={100} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius, fontSize: 12 }} />
                  <Bar dataKey="count" fill={theme.palette.primary.main} radius={[0, 3, 3, 0]} barSize={10} />
                </RechartsBar>
              </ResponsiveContainer>
            )}
          </BorderedCard>
        )}
      </Box>

      {/* Toolbar */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder={t("logs.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 240 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search20Regular style={{ fontSize: 16 }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setSearch("")} tabIndex={-1}>
                    <Dismiss20Regular style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isLoading}>
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
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto !important" }}>
          {total > 0 && t("logs.totalEntries", { count: total })}
        </Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}>
        {isLoading && (
          <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, height: 2, borderRadius: "4px 4px 0 0" }} />
        )}
        <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 130 }}>{t("logs.table.admin")}</TableCell>
              <TableCell sx={{ minWidth: 160 }}>{t("logs.table.action")}</TableCell>
              <TableCell sx={{ minWidth: 110 }}>{t("logs.table.resource")}</TableCell>
              {visibleOptional.has("resourceId") && <TableCell sx={{ minWidth: 110 }}>{t("logs.table.resourceId")}</TableCell>}
              {visibleOptional.has("ip") && <TableCell sx={{ minWidth: 120 }}>{t("logs.table.ip")}</TableCell>}
              {visibleOptional.has("userAgent") && <TableCell sx={{ minWidth: 160 }}>{t("logs.table.userAgent")}</TableCell>}
              <TableCell sx={{ minWidth: 90 }}>{t("logs.table.status")}</TableCell>
              {visibleOptional.has("errorMsg") && <TableCell sx={{ minWidth: 160 }}>{t("logs.table.errorMsg")}</TableCell>}
              <TableCell sx={{ minWidth: 130 }}>{t("logs.table.date")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeletons || showRefreshSkeletons ? (
              Array.from({ length: showSkeletons ? 8 : logs.length }).map((_, i) => (
                <RowSkeleton key={i} colCount={colCount} />
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">{t("logs.noResults")}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.ID} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{log.AdminName}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{log.Action}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{log.Resource}</Typography></TableCell>
                  {visibleOptional.has("resourceId") && (
                    <TableCell>
                      <Tooltip title={log.ResourceID ?? ""} placement="top">
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                          {log.ResourceID ? truncate(log.ResourceID, 16) : "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  {visibleOptional.has("ip") && (
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>{log.IPAddress ?? "—"}</Typography></TableCell>
                  )}
                  {visibleOptional.has("userAgent") && (
                    <TableCell>
                      <Tooltip title={log.UserAgent ?? ""} placement="top">
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                          {log.UserAgent ? truncate(log.UserAgent, 30) : "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>
                    {log.IsSuccess ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main" }}>
                        <CheckmarkCircle20Regular style={{ fontSize: 14 }} />
                        <Typography variant="body2" fontSize="0.75rem">{t("logs.status.success")}</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "error.main" }}>
                        <DismissCircle20Regular style={{ fontSize: 14 }} />
                        <Typography variant="body2" fontSize="0.75rem">{t("logs.status.failure")}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  {visibleOptional.has("errorMsg") && (
                    <TableCell>
                      <Tooltip title={log.ErrorMsg ?? ""} placement="top">
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                          {log.ErrorMsg ? truncate(log.ErrorMsg) : "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                      {formatDateWithSeconds(log.CreatedAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, p) => setPage(p + 1)}
          onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          labelRowsPerPage={t("users.table.rowsPerPage")}
          sx={{ mt: 1 }}
        />
      )}

      <LogFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={filters}
        onApply={applyFilters}
        resourceOptions={resourceOptions}
      />
      <LogColumnTogglePopover
        anchorEl={columnAnchorEl}
        open={Boolean(columnAnchorEl)}
        onClose={() => setColumnAnchorEl(null)}
        visible={visibleOptional}
        onToggle={handleToggleColumn}
      />
    </Box>
  );
}
