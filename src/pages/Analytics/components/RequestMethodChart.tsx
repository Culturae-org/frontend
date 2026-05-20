import { useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Box, Typography, useTheme } from "@mui/material";

interface RequestMethodChartProps {
  data: Record<string, number> | null;
  loading?: boolean;
  emptyLabel: string;
}

export function RequestMethodChart({ data, loading, emptyLabel }: RequestMethodChartProps) {
  const theme = useTheme();

  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ];

  const entries = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .map(([label, value], i) => ({ id: i, label, value, color: palette[i % palette.length] }));
  }, [data, theme]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
        <Box sx={{ width: 140, height: 140, borderRadius: "50%", bgcolor: "action.hover" }} />
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <PieChart
        series={[
          {
            data: entries,
            highlightScope: { fade: "global", highlight: "item" },
            faded: { innerRadius: 30, additionalRadius: -30, color: theme.palette.action.disabled },
            valueFormatter: (item) => item.value.toLocaleString(),
            innerRadius: 50,
            outerRadius: 90,
            paddingAngle: 0.5,
            cornerRadius: 3,
          },
        ]}
        height={220}
        width={300}
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
