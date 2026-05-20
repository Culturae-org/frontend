import { Box, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { format, parseISO } from "date-fns";

interface UserActivityChartProps {
  data: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
  }>;
  height?: number;
  noDataLabel?: string;
}

/**
 * Chart montrant l'activité quotidienne des utilisateurs
 * - Barres : utilisateurs actifs
 * - Barres : sessions
 */
export function UserActivityChart({ data, height = 250, noDataLabel = "No data available" }: UserActivityChartProps) {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const dates = data.map((d) => format(parseISO(d.date), "MMM dd"));
  const activeUsers = data.map((d) => d.activeUsers);
  const sessions = data.map((d) => d.sessions);

  return (
    <Box sx={{ width: "100%" }}>
    <BarChart
      height={height}
      xAxis={[
        {
          data: dates,
          scaleType: "band",
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
          data: activeUsers,
          label: "Active Users",
          color: theme.palette.primary.main,
          valueFormatter: (value) => `${value} users`,
        },
        {
          data: sessions,
          label: "Sessions",
          color: theme.palette.info.main,
          valueFormatter: (value) => `${value} sessions`,
        },
      ]}
      slotProps={{
        legend: {
          direction: "horizontal",
          position: { vertical: "top", horizontal: "end" },

        },
      }}
      sx={{
        "& .MuiBarElement-root": {
          rx: 4,
          ry: 4,
        },
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: theme.palette.divider,
        },
      }}
    />
    </Box>
  );
}
