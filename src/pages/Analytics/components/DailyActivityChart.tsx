import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { format, subDays, addDays, startOfDay } from "date-fns";

interface DailyActivityChartProps {
  data: Array<{
    date: string;
    total_games: number;
    completed_games: number;
    cancelled_games?: number;
    total_players?: number;
  }>;
  days: number;
  height?: number;
  noDataLabel?: string;
}

export function DailyActivityChart({ data, days, height = 300, noDataLabel = "No data available" }: DailyActivityChartProps) {
  const theme = useTheme();

  const filled = useMemo(() => {
    const today = startOfDay(new Date());
    const slots = new Map<string, { total_games: number; completed_games: number; total_players: number }>();
    const count = Math.max(days, 1);
    for (let i = count - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      slots.set(key, { total_games: 0, completed_games: 0, total_players: 0 });
    }
    const todayKey = format(today, "yyyy-MM-dd");
    if (!slots.has(todayKey)) slots.set(todayKey, { total_games: 0, completed_games: 0, total_players: 0 });

    for (const row of data ?? []) {
      const key = row.date.split("T")[0];
      if (slots.has(key)) {
        slots.set(key, {
          total_games: row.total_games,
          completed_games: row.completed_games,
          total_players: row.total_players ?? 0,
        });
      }
    }
    return Array.from(slots.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ label: format(addDays(new Date(key + "T00:00:00"), 0), "MMM dd"), ...v }));
  }, [data, days]);

  if (filled.length === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const dates = filled.map((d) => d.label);
  const totalGames = filled.map((d) => d.total_games);
  const completedGames = filled.map((d) => d.completed_games);
  const totalPlayers = filled.map((d) => d.total_players);

  return (
    <Box sx={{ width: "100%" }}>
<LineChart
      height={height}
      xAxis={[
        {
          data: dates,
          scaleType: "point",
          tickLabelStyle: {
            fontSize: 12,
            fill: theme.palette.text.secondary,
          },
        },
      ]}
      yAxis={[
        {
          tickLabelStyle: {
            fontSize: 12,
            fill: theme.palette.text.secondary,
          },
        },
      ]}
      series={[
        {
          data: totalGames,
          label: "Games Created",
          color: theme.palette.primary.main,
          showMark: false,
          curve: "monotoneX",
        },
        {
          data: completedGames,
          label: "Games Completed",
          color: theme.palette.success.main,
          showMark: false,
          curve: "monotoneX",
        },
        {
          data: totalPlayers,
          label: "Players",
          color: theme.palette.info.main,
          showMark: false,
          curve: "monotoneX",
        },
      ]}
      slotProps={{
        legend: {
          direction: "horizontal",
          position: { vertical: "top", horizontal: "end" },
        },
      }}
      sx={{
        "& .MuiLineElement-root": {
          strokeWidth: 2,
        },
"& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: theme.palette.divider,
        },
      }}
    />
    </Box>
  );
}
