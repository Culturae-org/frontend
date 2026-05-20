import { Box, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { format, parseISO } from "date-fns";

interface UserGrowthChartProps {
  data: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  height?: number;
  noDataLabel?: string;
}

/**
 * Chart montrant la croissance des utilisateurs
 * - Ligne : nouveaux utilisateurs par jour
 * - Ligne : total cumulé d'utilisateurs
 */
export function UserGrowthChart({ data, height = 300, noDataLabel = "No data available" }: UserGrowthChartProps) {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const dates = data.map((d) => format(parseISO(d.date), "MMM dd"));
  const newUsers = data.map((d) => d.newUsers);
  const totalUsers = data.map((d) => d.totalUsers);

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
          id: "newUsers",
          tickLabelStyle: {
            fontSize: 12,
            fill: theme.palette.text.secondary,
          },
        },
        {
          id: "totalUsers",
          position: "right",
          tickLabelStyle: {
            fontSize: 12,
            fill: theme.palette.text.secondary,
          },
        },
      ]}
      series={[
        {
          data: newUsers,
          label: "New Users",
          color: theme.palette.primary.main,
          showMark: false,
          curve: "monotoneX",
          yAxisId: "newUsers",
          valueFormatter: (value) => `${value} new users`,
        },
        {
          data: totalUsers,
          label: "Total Users",
          color: theme.palette.success.main,
          showMark: false,
          curve: "monotoneX",
          yAxisId: "totalUsers",
          valueFormatter: (value) => `${value?.toLocaleString()} total`,
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
