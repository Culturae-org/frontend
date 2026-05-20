import { alpha, Box, MenuItem, Select, Stack, Typography, useTheme } from "@mui/material";
import { useState } from "react";

interface TopPlayersChartProps {
  data: Array<{
    username: string;
    score: number;
  }>;
  height?: number;
  noDataLabel?: string;
  onPlayerClick?: (username: string) => void;
  titleDesc?: string;
}

const LIMITS = [10, 25, 50];

export function TopPlayersChart({ data, noDataLabel = "No data available", onPlayerClick, titleDesc }: TopPlayersChartProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const [limit, setLimit] = useState(10);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.disabled">{noDataLabel}</Typography>
      </Box>
    );
  }

  const sliced = data.slice(0, limit);
  const maxScore = Math.max(...sliced.map((d) => d.score), 1);
  const total = sliced.length;

  return (
    <Stack spacing={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>Top {limit} Players</Typography>
          {titleDesc && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{titleDesc}</Typography>}
        </Box>
        <Select
          size="small"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          sx={{ fontSize: "0.8rem", height: 28 }}
        >
          {LIMITS.filter((l) => l <= data.length || l === LIMITS[0]).map((l) => (
            <MenuItem key={l} value={l} sx={{ fontSize: "0.8rem" }}>Top {l}</MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack spacing={0.5}>
      {sliced.map((player, i) => {
        const rank = i + 1;
        const pct = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
        // Dégradé : #1 = primary à 100%, dernier = primary à 25%
        const opacity = 1 - (i / total) * 0.75;
        const rowColor = alpha(primary, opacity);

        return (
          <Box
            key={player.username}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "action.hover" },
              transition: "background-color 0.15s",
            }}
          >
            {/* Rank badge */}
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                bgcolor: rowColor,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: theme.palette.primary.contrastText,
                  fontSize: "0.7rem",
                  lineHeight: 1,
                }}
              >
                {rank}
              </Typography>
            </Box>

            {/* Username */}
            <Typography
              variant="body2"
              fontWeight={rank === 1 ? 600 : 400}
              noWrap
              onClick={onPlayerClick ? () => onPlayerClick(player.username) : undefined}
              sx={{
                flex: "0 0 140px",
                minWidth: 0,
                color: "text.secondary",
                ...(onPlayerClick && {
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }),
              }}
            >
              {player.username}
            </Typography>

            {/* Progress bar */}
            <Box sx={{ flex: 1, height: 5, bgcolor: "action.hover", borderRadius: 1, overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  background: `linear-gradient(to right, ${alpha(primary, 0.4)}, ${rowColor})`,
                  borderRadius: 1,
                  transition: "width 0.4s ease",
                  minWidth: player.score > 0 ? 4 : 0,
                }}
              />
            </Box>

            {/* Score */}
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                flex: "0 0 60px",
                textAlign: "right",
                color: rowColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {player.score.toLocaleString()}
            </Typography>
          </Box>
        );
      })}
      </Stack>
    </Stack>
  );
}
