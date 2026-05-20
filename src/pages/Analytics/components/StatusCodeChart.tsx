import { useMemo } from "react";
import { alpha, Box, Stack, Typography, useTheme } from "@mui/material";

interface StatusCodeChartProps {
  data: Record<string, number> | null;
  loading?: boolean;
  emptyLabel: string;
}

function getCategory(code: number): "2xx" | "3xx" | "4xx" | "5xx" | "1xx" {
  if (code < 200) return "1xx";
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}

const CATEGORY_ORDER = ["2xx", "3xx", "4xx", "5xx", "1xx"] as const;

export function StatusCodeChart({ data, loading, emptyLabel }: StatusCodeChartProps) {
  const theme = useTheme();

  const primary = theme.palette.primary.main;

  const categories = useMemo(() => {
    if (!data) return [];

    const grouped: Record<string, { total: number; codes: { code: string; count: number }[] }> = {};

    for (const [code, count] of Object.entries(data)) {
      const cat = getCategory(parseInt(code));
      if (!grouped[cat]) grouped[cat] = { total: 0, codes: [] };
      grouped[cat].total += count;
      grouped[cat].codes.push({ code, count });
    }

    const total = Object.values(grouped).reduce((s, c) => s + c.total, 0);

    const visible = CATEGORY_ORDER.filter((cat) => grouped[cat]);
    return visible.map((cat, i) => ({
      cat,
      total: grouped[cat].total,
      codes: grouped[cat].codes.sort((a, b) => parseInt(a.code) - parseInt(b.code)),
      pct: total > 0 ? (grouped[cat].total / total) * 100 : 0,
      opacity: 1 - (i / Math.max(visible.length - 1, 1)) * 0.65,
    }));
  }, [data]);

  if (loading) {
    return (
      <Stack spacing={2} sx={{ py: 1 }}>
        {[80, 10, 6].map((w, i) => (
          <Box key={i}>
            <Box sx={{ height: 12, bgcolor: "action.hover", borderRadius: 1, mb: 0.5, width: "60%" }} />
            <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 1, width: `${w}%` }} />
          </Box>
        ))}
      </Stack>
    );
  }

  if (!categories.length) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ py: 1 }}>
      {categories.map(({ cat, total, codes, pct, opacity }) => {
        const color = alpha(primary, opacity);
        return (
          <Box key={cat}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={600}>{cat}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {codes.map((c) => c.code).join(", ")}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={0.75}>
                <Typography variant="body2" fontWeight={700} sx={{ color }}>{total.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">{pct.toFixed(1)}%</Typography>
              </Stack>
            </Stack>
            <Box sx={{ width: "100%", height: 6, bgcolor: "action.hover", borderRadius: 1, overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  background: `linear-gradient(to right, ${alpha(primary, opacity * 0.4)}, ${color})`,
                  borderRadius: 1,
                  minWidth: pct > 0 ? 4 : 0,
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
