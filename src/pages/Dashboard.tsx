import React, { useMemo, useState } from "react";
import {
  Grid2,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { format, parseISO } from "date-fns";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { StyledTab, StyledTabs } from "@/components/Common/StyledComponents";
import { useDashboardChartData } from "@/hooks/useDashboardChartData";
import type { TimeRange } from "@/lib/types/analytics.types";

// --- Section paper wrapper ---

function SectionPaper({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        boxShadow: "none",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

// --- Main ---

export default function Dashboard() {
  const theme = useTheme();

  // Chart data
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange>("30d");
  const { data: chartRaw, loading: chartLoading } = useDashboardChartData(chartTimeRange);

  // Merged chart data (daily games + daily users by date)
  const chartData = useMemo(() => {
    if (!chartRaw) return { dates: [], totalGames: [], completedGames: [], newUsers: [] };
    const userMap = new Map(chartRaw.dailyUserStats.map((u) => [u.date.split("T")[0], u]));
    const rows = chartRaw.dailyGameStats.map((g) => {
      const key = g.date.split("T")[0];
      return {
        label: format(parseISO(key), "MMM dd"),
        totalGames: g.totalGames,
        completedGames: g.completedGames,
        newUsers: userMap.get(key)?.newUsers ?? 0,
      };
    });
    return {
      dates: rows.map((r) => r.label),
      totalGames: rows.map((r) => r.totalGames),
      completedGames: rows.map((r) => r.completedGames),
      newUsers: rows.map((r) => r.newUsers),
    };
  }, [chartRaw]);

  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="Platform overview" />

      {/* Chart + placeholder */}
      <Grid2 container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <SectionPaper>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Activity Overview
              </Typography>
              <StyledTabs
                value={chartTimeRange}
                onChange={(_, v) => setChartTimeRange(v as TimeRange)}
              >
                {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
                  <StyledTab key={r} label={r} value={r} />
                ))}
              </StyledTabs>
            </Stack>

            {chartLoading ? (
              <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 1 }} />
            ) : (
              <LineChart
                height={280}
                xAxis={[{
                  data: chartData.dates,
                  scaleType: "point",
                  tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary },
                }]}
                yAxis={[
                  { id: "games", tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary } },
                  { id: "users", position: "right", tickLabelStyle: { fontSize: 11, fill: theme.palette.text.secondary } },
                ]}
                series={[
                  {
                    data: chartData.totalGames,
                    label: "Games Created",
                    color: theme.palette.primary.main,
                    showMark: false,
                    curve: "monotoneX",
                    yAxisId: "games",
                  },
                  {
                    data: chartData.completedGames,
                    label: "Completed",
                    color: alpha(theme.palette.primary.main, 0.4),
                    showMark: false,
                    curve: "monotoneX",
                    yAxisId: "games",
                  },
                  {
                    data: chartData.newUsers,
                    label: "New Users",
                    color: theme.palette.success.main,
                    showMark: false,
                    curve: "monotoneX",
                    yAxisId: "users",
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "top", horizontal: "end" },
                  },
                }}
                sx={{
                  "& .MuiLineElement-root": { strokeWidth: 2 },
                  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                    stroke: theme.palette.divider,
                  },
                }}
              />
            )}
          </SectionPaper>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 4 }}>
          <SectionPaper>
            <Stack spacing={1.5}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
            </Stack>
          </SectionPaper>
        </Grid2>
      </Grid2>
    </PageContainer>
  );
}
