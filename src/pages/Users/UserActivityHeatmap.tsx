import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Skeleton, Tooltip, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { logsService } from "@/lib/services/logs.service";

interface Props {
  userId: string;
}

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL = 11;
const GAP = 2;

function getCellColor(count: number, primaryMain: string, mode: "light" | "dark"): string {
  if (count === 0) return mode === "light" ? "#ebedf0" : "#2a2a2a";
  if (count <= 2) return alpha(primaryMain, 0.25);
  if (count <= 5) return alpha(primaryMain, 0.5);
  if (count <= 10) return alpha(primaryMain, 0.75);
  return primaryMain;
}

export default function UserActivityHeatmap({ userId }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [countByDate, setCountByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = oneYearAgo.toISOString().substring(0, 10);
    logsService
      .getUserActionLogs(userId, { limit: 10000, start_date: startDate })
      .then((res) => {
        const map: Record<string, number> = {};
        for (const log of res.data ?? []) {
          const day = log.CreatedAt.substring(0, 10);
          map[day] = (map[day] ?? 0) + 1;
        }
        setCountByDate(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 52 * 7);

    const totalWeeks = 53;

    const weeks: Array<Array<Date | null>> = [];
    const monthLabels: Array<{ col: number; label: string }> = [];
    let current = new Date(start);
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const week: Array<Date | null> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(current);
        if (date > today) {
          week.push(null);
        } else {
          week.push(date);
          if (date.getMonth() !== lastMonth) {
            lastMonth = date.getMonth();
            monthLabels.push({
              col: w,
              label: date.toLocaleString("en-US", { month: "short" }),
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, []);

  const totalActivity = useMemo(
    () => Object.values(countByDate).reduce((s, v) => s + v, 0),
    [countByDate],
  );

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: "flex", gap: `${GAP}px`, alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, mr: 0.5 }}>
            {DAYS.map((_, i) => (
              <Box key={i} sx={{ width: 24, height: CELL }} />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: `${GAP}px` }}>
            {Array.from({ length: 53 }).map((_, wi) => (
              <Box key={wi} sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
                {Array.from({ length: 7 }).map((_, di) => (
                  <Skeleton key={di} variant="rectangular" width={CELL} height={CELL} sx={{ borderRadius: "2px" }} />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  const primary = theme.palette.primary.main;
  const mode = theme.palette.mode;

  return (
    <Box>
      <Box sx={{ display: "flex", mb: 0.5, ml: `${CELL + GAP + 4}px` }}>
        {monthLabels.map(({ col, label }) => (
          <Typography
            key={`${col}-${label}`}
            variant="caption"
            color="text.disabled"
            sx={{
              position: "absolute",
              ml: `${col * (CELL + GAP)}px`,
              fontSize: "0.65rem",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {label}
          </Typography>
        ))}
        <Box sx={{ height: 12 }} />
      </Box>

      <Box sx={{ display: "flex", gap: `${GAP}px`, alignItems: "flex-start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, mr: 0.5 }}>
          {DAYS.map((d, i) => (
            <Typography
              key={i}
              variant="caption"
              color="text.disabled"
              sx={{ fontSize: "0.62rem", height: CELL, lineHeight: `${CELL}px`, width: 24, textAlign: "right", userSelect: "none" }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: `${GAP}px`, overflowX: "auto" }}>
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
              {week.map((date, di) => {
                if (!date) {
                  return (
                    <Box
                      key={di}
                      sx={{ width: CELL, height: CELL, borderRadius: "2px", bgcolor: "transparent" }}
                    />
                  );
                }
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const count = countByDate[dateStr] ?? 0;
                const color = getCellColor(count, primary, mode);
                const label = date.toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                });
                return (
                  <Tooltip
                    key={di}
                    title={
                      <Typography variant="caption">
                        {count} action{count !== 1 ? "s" : ""} — {label}
                      </Typography>
                    }
                    placement="top"
                    arrow
                  >
                    <Box
                      sx={{
                        width: CELL,
                        height: CELL,
                        borderRadius: "2px",
                        bgcolor: color,
                        cursor: "default",
                        transition: "opacity 0.1s",
                        "&:hover": { opacity: 0.75 },
                        flexShrink: 0,
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1, justifyContent: "center" }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
          Less
        </Typography>
        {[0, 2, 5, 10, 15].map((v) => (
          <Box
            key={v}
            sx={{ width: CELL, height: CELL, borderRadius: "2px", bgcolor: getCellColor(v, primary, mode), flexShrink: 0 }}
          />
        ))}
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
          More
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ ml: 1.5, fontSize: "0.65rem" }}>
          {totalActivity.toLocaleString()} total actions
        </Typography>
      </Box>
    </Box>
  );
}
