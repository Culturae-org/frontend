import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import type { ScatterValueType } from "@mui/x-charts";
import { format } from "date-fns";
import type { AdminGame } from "@/lib/types/games.types";

interface GameScatterChartProps {
  games: AdminGame[];
  hours: number;
  height?: number;
  noDataLabel?: string;
}

export function GameScatterChart({ games, hours, height = 300, noDataLabel = "No data available" }: GameScatterChartProps) {
  const theme = useTheme();

  const { completed, active, other, windowStart, maxPlayers } = useMemo(() => {
    const windowStart = Date.now() - hours * 3_600_000;
    const toPoint = (g: AdminGame) => ({
      x: Math.round((new Date(g.created_at).getTime() - windowStart) / 60_000),
      y: g.current_players ?? 1,
      id: g.id,
    });
    const completed = games.filter((g) => g.status === "completed").map(toPoint);
    const active = games.filter((g) => g.status === "active" || g.status === "waiting").map(toPoint);
    const other = games
      .filter((g) => g.status !== "completed" && g.status !== "active" && g.status !== "waiting")
      .map(toPoint);
    const maxPlayers = Math.max(2, ...games.map((g) => g.current_players ?? 1));
    return { completed, active, other, windowStart, maxPlayers };
  }, [games, hours]);

  const totalPoints = completed.length + active.length + other.length;

  if (games.length === 0 || totalPoints === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <ScatterChart
        height={height}
        xAxis={[{
          min: 0,
          max: hours * 60,
          valueFormatter: (minutes: number) => format(new Date(windowStart + minutes * 60_000), "HH:mm"),
          tickInterval: (value: number) => value % 60 === 0,
          tickLabelStyle: { fontSize: 12, fill: theme.palette.text.secondary },
          label: "",
        }]}
        yAxis={[{
          min: 0,
          max: maxPlayers + 1,
          tickMinStep: 1,
          tickLabelStyle: { fontSize: 12, fill: theme.palette.text.secondary },
          label: "Players",
        }]}
        series={[
          ...(completed.length > 0 ? [{
            data: completed,
            label: "Completed",
            color: theme.palette.primary.main,
            markerSize: 6,
            valueFormatter: (v: ScatterValueType | null) => v ? `${format(new Date(windowStart + v.x * 60_000), "HH:mm")} · ${v.y} player${v.y !== 1 ? "s" : ""}` : "",
          }] : []),
          ...(active.length > 0 ? [{
            data: active,
            label: "Active",
            color: theme.palette.success.main,
            markerSize: 6,
            valueFormatter: (v: ScatterValueType | null) => v ? `${format(new Date(windowStart + v.x * 60_000), "HH:mm")} · ${v.y} player${v.y !== 1 ? "s" : ""}` : "",
          }] : []),
          ...(other.length > 0 ? [{
            data: other,
            label: "Other",
            color: theme.palette.text.disabled,
            markerSize: 5,
            valueFormatter: (v: ScatterValueType | null) => v ? `${format(new Date(windowStart + v.x * 60_000), "HH:mm")} · ${v.y} player${v.y !== 1 ? "s" : ""}` : "",
          }] : []),
        ]}
        slotProps={{
          legend: {
            direction: "horizontal",
            position: { vertical: "top", horizontal: "end" },

          },
        }}
        sx={{
          "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: theme.palette.divider,
          },
        }}
      />
    </Box>
  );
}
