import { useId, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Box, Skeleton, Typography, useTheme } from "@mui/material";
import type { ApiTimeRange } from "@/lib/types/analytics.types";

interface ApiTimelineChartProps {
  timestamps: string[];
  loading: boolean;
  noDataLabel: string;
  timeRange?: ApiTimeRange;
}

// bucket size in minutes + label formatter per range
const BUCKET_CONFIG: Record<ApiTimeRange, { minutes: number; label: (d: Date) => string }> = {
  "1h":  { minutes: 5,    label: (d) => `${String(d.getHours()).padStart(2,"0")}:${String(Math.floor(d.getMinutes()/5)*5).padStart(2,"0")}` },
  "6h":  { minutes: 15,   label: (d) => `${String(d.getHours()).padStart(2,"0")}:${String(Math.floor(d.getMinutes()/15)*15).padStart(2,"0")}` },
  "12h": { minutes: 30,   label: (d) => `${String(d.getHours()).padStart(2,"0")}:${d.getMinutes() < 30 ? "00" : "30"}` },
  "1d":  { minutes: 60,   label: (d) => `${String(d.getHours()).padStart(2,"0")}h` },
  "7d":  { minutes: 360,  label: (d) => `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}h` },
  "30d": { minutes: 1440, label: (d) => `${d.getMonth()+1}/${d.getDate()}` },
};

const RANGE_MINUTES: Record<ApiTimeRange, number> = {
  "1h": 60, "6h": 360, "12h": 720, "1d": 1440, "7d": 10080, "30d": 43200,
};

function bucket(timestamps: string[], timeRange: ApiTimeRange) {
  const { minutes: bucketMinutes, label: labelFn } = BUCKET_CONFIG[timeRange];
  const ms = bucketMinutes * 60 * 1000;

  const now = Date.now();
  const startMs = now - RANGE_MINUTES[timeRange] * 60 * 1000;

  // Pre-fill all slots from startMs to now with count 0
  const slots = new Map<number, { label: string; count: number }>();
  const firstSlot = Math.floor(startMs / ms) * ms;
  const lastSlot = Math.floor(now / ms) * ms;
  for (let t = firstSlot; t <= lastSlot; t += ms) {
    slots.set(t, { label: labelFn(new Date(t)), count: 0 });
  }

  // Count actual timestamps into slots (ignore anything outside the window)
  for (const ts of timestamps) {
    const t = new Date(ts).getTime();
    if (t < startMs || t > now) continue;
    const key = Math.floor(t / ms) * ms;
    const slot = slots.get(key);
    if (slot) slot.count += 1;
  }

  return Array.from(slots.entries())
    .sort(([a], [b]) => a - b)
    .map(([, v]) => v);
}

export function ApiTimelineChart({ timestamps, loading, noDataLabel, timeRange = "1d" }: ApiTimelineChartProps) {
  const theme = useTheme();
  const gradientId = useId().replace(/:/g, "");
  const data = useMemo(() => bucket(timestamps, timeRange), [timestamps, timeRange]);

  if (loading) return <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />;
  if (data.length === 0) return (
    <Box sx={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body2" color="text.secondary">{noDataLabel}</Typography>
    </Box>
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15} />
            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={theme.palette.text.disabled} />
        <YAxis tick={{ fontSize: 11 }} stroke={theme.palette.text.disabled} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={theme.palette.primary.main}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
