import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowSync20Regular,
  Database20Regular,
  Flash20Regular,
  Cloud20Regular,
} from "@fluentui/react-icons";
import { BorderedCard } from "@/components/Common/StyledComponents";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useGamesCharts } from "@/hooks/useGamesCharts";
import { useRecentGames } from "@/hooks/useRecentGames";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useApiAnalytics } from "@/hooks/useApiAnalytics";
import type { ApiTimeRange, TimeRange } from "@/lib/types/analytics.types";
import { usersService } from "@/lib/services/users.service";

const API_TIME_RANGE_OPTIONS: ApiTimeRange[] = ["1h", "6h", "12h", "1d", "7d", "30d"];
import {
  ApiTimelineChart,
  DailyActivityChart,
  GameModeChart,
  GameScatterChart,
  RequestMethodChart,
  StatusCodeChart,
  TimeRangeSelector,
  TopPlayersChart,
  UserActivityChart,
  UserDistributionChart,
  UserGrowthChart,
} from "./components";

const SERVICES = [
  { key: "database", name: "PostgreSQL", icon: <Database20Regular /> },
  { key: "redis",    name: "Redis",      icon: <Flash20Regular /> },
  { key: "minio",    name: "MinIO",      icon: <Cloud20Regular /> },
] as const;

const DAYS_MAP: Record<TimeRange, number> = { "12h": 1, "1d": 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
const GAME_TIME_RANGE_OPTIONS: TimeRange[] = ["12h", "1d", "7d", "30d", "90d", "1y"];
const SCATTER_HOURS: Partial<Record<TimeRange, number>> = { "12h": 12, "1d": 24 };

function SectionHeader({ label, timeRange, onTimeRangeChange, onRefresh, loading, timeRangeOptions }: {
  label: string;
  timeRange: string;
  onTimeRangeChange: (r: string) => void;
  onRefresh: () => void;
  loading: boolean;
  timeRangeOptions?: string[];
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
      <Typography variant="overline" fontWeight={700} letterSpacing={1.5} color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} options={timeRangeOptions} />
        <IconButton size="small" onClick={onRefresh} disabled={loading} sx={{ color: "text.secondary" }}>
          <ArrowSync20Regular style={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

interface StatItem {
  label: string;
  value: string | number;
  loading?: boolean;
}

function StatsStrip({ stats }: { stats: StatItem[] }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0, mb: 3 }}>
      {stats.map((stat, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "stretch" }}>
          {i > 0 && (
            <Box sx={{ width: "1px", bgcolor: "divider", mx: 3, my: 0.5 }} />
          )}
          <Box>
            {stat.loading ? (
              <Skeleton variant="text" width={60} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
              {stat.label}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();

  const handlePlayerClick = useCallback(async (username: string) => {
    try {
      const res = await usersService.getUsers({ q: username, limit: 1 });
      const user = res.data?.[0];
      if (user?.id) navigate(`/users/${user.id}`);
    } catch { /* ignore */ }
  }, [navigate]);

  const [gTimeRange, setGTimeRange] = useState<TimeRange>("7d");
  const [apiTimeRange, setApiTimeRange] = useState<ApiTimeRange>("1h");

  const { data, loading: aLoading, error: aError, timeRange, setTimeRange, refresh: aRefresh } = useAnalytics();
  const scatterHours = SCATTER_HOURS[gTimeRange] ?? 0;
  const isScatterMode = scatterHours > 0;
  const { data: gData, loading: gLoading, refresh: gRefresh } = useGamesCharts(DAYS_MAP[gTimeRange]);
  const { games: recentGames, loading: scatterLoading, refresh: scatterRefresh } = useRecentGames(scatterHours);
  const { metrics, services, loading: sLoading } = useSystemMetrics();
  const { stats: apiStats, timestamps, loading: apiLoading, refresh: apiRefresh } = useApiAnalytics(apiTimeRange);

  return (
    <PageContainer plain>
      <Container maxWidth="xl">
        {/* Header */}
        <PageHeader
          title={t("analytics.title")}
          subtitle={t("analytics.subtitle")}
        />

        {aError && !aLoading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t("analytics.error")}: {aError.message}
          </Alert>
        )}

        {/* ── System Health strip ── */}
        <BorderedCard sx={{ px: 3, py: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={1} sx={{ textTransform: "uppercase", flexShrink: 0 }}>
              {t("analytics.charts.systemHealth")}
            </Typography>
            {sLoading && !services ? (
              [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" width={130} height={28} />)
            ) : (
              SERVICES.map((svc) => {
                const s = services?.[svc.key as keyof typeof services];
                const healthy = s?.status !== "unhealthy";
                return (
                  <Box key={svc.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      bgcolor: healthy ? "success.main" : "error.main",
                    }} />
                    <Typography variant="body2" fontWeight={500}>{svc.name}</Typography>
                    {s?.response_time_ms != null && (
                      <Typography variant="caption" color="text.secondary">
                        {s.response_time_ms} ms
                      </Typography>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </BorderedCard>

        {/* ── Section : Utilisateurs ── */}
        <BorderedCard sx={{ p: 3, mb: 3 }}>
          <SectionHeader
            label={t("analytics.sections.users")}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onRefresh={aRefresh}
            loading={aLoading}
          />
          <Stack spacing={3}>
            <StatsStrip stats={[
              { label: t("analytics.kpi.totalUsers"), value: data?.userStats.totalUsers ?? 0, loading: aLoading },
              { label: t("analytics.kpi.onlineNow"), value: data?.userStats.onlineUsers ?? 0, loading: aLoading },
              { label: t("analytics.kpi.weeklyActive"), value: data?.userStats.weeklyActiveUsers ?? 0, loading: aLoading },
              { label: t("analytics.kpi.newThisWeek"), value: data?.userStats.newUsersThisWeek ?? 0, loading: aLoading },
            ]} />
            <BorderedCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.charts.userGrowth")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("analytics.charts.userGrowthDesc")}</Typography>
              {aLoading ? <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /> : data ? <UserGrowthChart data={data.dailyUserStats} noDataLabel={t("analytics.noData")} /> : null}
            </BorderedCard>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <BorderedCard sx={{ p: 3, flex: "1 1 280px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.charts.userActivity")}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("analytics.charts.userActivityDesc")}</Typography>
                {aLoading ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /> : data ? <UserActivityChart data={data.userActivityStats} noDataLabel={t("analytics.noData")} /> : null}
              </BorderedCard>
              <BorderedCard sx={{ p: 3, flex: "1 1 280px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.charts.usersByRank")}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("analytics.charts.usersByRankDesc")}</Typography>
                {aLoading ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /> : data ? <UserDistributionChart data={data.userDistribution.byRank} noDataLabel={t("analytics.noData")} /> : null}
              </BorderedCard>
            </Box>
            <BorderedCard sx={{ p: 3 }}>
              {aLoading ? <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /> : data ? <TopPlayersChart data={data.topPlayers} noDataLabel={t("analytics.noData")} onPlayerClick={handlePlayerClick} titleDesc={t("analytics.charts.topPlayersDesc")} /> : null}
            </BorderedCard>
          </Stack>
        </BorderedCard>

        {/* ── Section 3: Jeux ── */}
        <BorderedCard sx={{ p: 3, mb: 3 }}>
          <SectionHeader
            label={t("analytics.sections.games")}
            timeRange={gTimeRange}
            onTimeRangeChange={(r) => setGTimeRange(r as TimeRange)}
            onRefresh={isScatterMode ? scatterRefresh : gRefresh}
            loading={isScatterMode ? scatterLoading : gLoading}
            timeRangeOptions={GAME_TIME_RANGE_OPTIONS}
          />
          <Stack spacing={3}>
            <StatsStrip stats={[
              { label: t("analytics.kpi.totalGames"), value: gData?.stats.total_games ?? 0, loading: gLoading },
              { label: t("analytics.kpi.activeGames"), value: gData?.stats.active_games ?? 0, loading: gLoading },
              { label: t("analytics.kpi.completedGames"), value: gData?.stats.completed_games ?? 0, loading: gLoading },
              { label: t("analytics.kpi.abandonedGames"), value: gData?.stats.abandoned_games ?? 0, loading: gLoading },
            ]} />
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <BorderedCard sx={{ p: 3, flex: "2 1 380px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {isScatterMode ? t("analytics.charts.gameActivity") : t("analytics.charts.dailyActivity")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isScatterMode ? t("analytics.charts.gameActivityDesc") : t("analytics.charts.dailyActivityDesc")}
                </Typography>
                {isScatterMode
                  ? scatterLoading
                    ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                    : <GameScatterChart games={recentGames} hours={scatterHours} noDataLabel={t("analytics.noData")} />
                  : gLoading
                    ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                    : gData
                      ? <DailyActivityChart data={gData.daily} days={DAYS_MAP[gTimeRange]} noDataLabel={t("analytics.noData")} />
                      : null
                }
              </BorderedCard>
              <BorderedCard sx={{ p: 3, flex: "1 1 220px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.charts.gamesByMode")}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("analytics.charts.gamesByModeDesc")}</Typography>
                {gLoading ? <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /> : gData ? <GameModeChart data={gData.modes} noDataLabel={t("analytics.noData")} /> : null}
              </BorderedCard>
            </Box>
          </Stack>
        </BorderedCard>

        {/* ── Section 4: API ── */}
        <BorderedCard sx={{ p: 3, mb: 3 }}>
          <SectionHeader
            label={t("analytics.sections.api")}
            timeRange={apiTimeRange}
            onTimeRangeChange={(r) => setApiTimeRange(r as ApiTimeRange)}
            onRefresh={apiRefresh}
            loading={apiLoading}
            timeRangeOptions={API_TIME_RANGE_OPTIONS}
          />
          <Stack spacing={3}>
            <StatsStrip stats={[
              { label: t("analytics.apiLogs.totalRequests"), value: apiStats?.total_requests ?? 0, loading: apiLoading },
              { label: t("analytics.apiLogs.successRate"), value: apiStats?.error_rate != null ? `${(100 - apiStats.error_rate).toFixed(1)}%` : "—", loading: apiLoading },
              { label: t("analytics.apiLogs.avgResponseTime"), value: apiStats?.avg_response_time != null ? `${apiStats.avg_response_time.toFixed(1)} ms` : "—", loading: apiLoading },
              { label: t("analytics.apiLogs.dailyAverage"), value: apiStats?.daily_average ?? 0, loading: apiLoading },
            ]} />
            <BorderedCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.apiLogs.timeline")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("analytics.apiLogs.timelineDesc")}</Typography>
              <ApiTimelineChart timestamps={timestamps} loading={apiLoading} noDataLabel={t("analytics.noData")} timeRange={apiTimeRange} />
            </BorderedCard>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <BorderedCard sx={{ p: 3, flex: "2 1 340px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.apiLogs.statusCodes")}</Typography>
                <StatusCodeChart data={apiStats?.requests_by_status ?? null} loading={apiLoading} emptyLabel={t("analytics.noData")} />
              </BorderedCard>
              <BorderedCard sx={{ p: 3, flex: "1 1 200px", minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t("analytics.apiLogs.methods")}</Typography>
                <RequestMethodChart data={apiStats?.requests_by_method ?? null} loading={apiLoading} emptyLabel={t("analytics.noData")} />
              </BorderedCard>
            </Box>
          </Stack>
        </BorderedCard>

      </Container>
    </PageContainer>
  );
}
