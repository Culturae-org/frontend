import { Box, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

interface UserDistributionChartProps {
  data: Array<{
    rank: string;
    count: number;
  }>;
  height?: number;
  noDataLabel?: string;
}

/**
 * Chart en barres pour la distribution des utilisateurs par rank
 */
export function UserDistributionChart({ data, height = 250, noDataLabel = "No data available" }: UserDistributionChartProps) {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const ranks = data.map((d) => d.rank);
  const counts = data.map((d) => d.count);

  return (
    <Box sx={{ width: "100%" }}>
    <BarChart
      height={height}
      xAxis={[
        {
          data: ranks,
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
          data: counts,
          label: "Users",
          color: theme.palette.primary.main,
          valueFormatter: (value) => `${value} users`,
        },
      ]}
      slotProps={{
        legend: {
          hidden: true,
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
