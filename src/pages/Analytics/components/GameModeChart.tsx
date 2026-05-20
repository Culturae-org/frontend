import { Box, Typography, useTheme } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

interface GameModeChartProps {
  data: Array<{
    mode: string;
    count: number;
    percentage: number;
  }>;
  height?: number;
  noDataLabel?: string;
}

/**
 * Chart en camembert pour la distribution des modes de jeu
 */
export function GameModeChart({ data, height = 250, noDataLabel = "No data available" }: GameModeChartProps) {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const pieData = sorted.map((item, index) => ({
    id: index,
    value: item.count,
    label: item.mode,
    color: [
      theme.palette.primary.main,
      theme.palette.text.disabled,
      theme.palette.action.selected,
    ][index % 3],
  }));

  return (
    <Box sx={{ width: "100%" }}>
    <PieChart
      height={height}
      series={[
        {
          data: pieData,
          innerRadius: 60,
          outerRadius: 100,
          paddingAngle: 2,
          cornerRadius: 4,
          highlightScope: { faded: "global", highlighted: "item" },
          faded: { innerRadius: 60, additionalRadius: -10, color: "gray" },
          valueFormatter: (value) => `${value.value} games`,
        },
      ]}
      slotProps={{
        legend: {
          direction: "vertical",
          position: { vertical: "middle", horizontal: "end" },

        },
      }}
    />
    </Box>
  );
}
