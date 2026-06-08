import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowSync20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  People20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { gamesService } from "@/lib/services/games.service";
import type { MatchmakingQueueStats } from "@/lib/types/games.types";
import { SecondaryButton, SquareChip } from "@/components/Common/StyledComponents";
import { useConfirm } from "@/components/Common/ConfirmDialog";

export default function MatchmakingPanel() {
  const { t } = useTranslation("dashboard");
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MatchmakingQueueStats | null>(null);
  const [clearingMode, setClearingMode] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gamesService.getMatchmakingStats();
      setStats(data);
    } catch {
      enqueueSnackbar(t("games.matchmaking.loadError"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleToggle = () => setOpen((v) => !v);

  const handleRefresh = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      loadStats();
    },
    [loadStats],
  );

  const handleClearQueue = async (mode: string) => {
    const modeLabel = t(`games.mode.${mode}`, { defaultValue: mode });
    const ok = await confirm({
      title: t("games.matchmaking.clearTitle", { mode: modeLabel }),
      description: t("games.matchmaking.clearConfirm", { mode: modeLabel }),
      confirmText: t("games.matchmaking.clearQueue"),
      danger: true,
    });
    if (!ok) return;
    setClearingMode(mode);
    try {
      await gamesService.clearMatchmakingQueue(mode);
      enqueueSnackbar(t("games.matchmaking.clearSuccess"), { variant: "success" });
      loadStats();
    } catch {
      enqueueSnackbar(t("games.matchmaking.clearError"), { variant: "error" });
    } finally {
      setClearingMode(null);
    }
  };

  const queues = stats ?? {};
  const modes = Object.keys(queues);
  const totalPlayers = modes.reduce((sum, m) => sum + (queues[m] ?? 0), 0);

  return (
    <Paper sx={{ boxShadow: "none", border: 1, borderColor: "divider", mb: 2 }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={handleToggle}
      >
        <People20Regular style={{ fontSize: 18 }} />
        <Typography variant="body2" fontWeight={600}>
          {t("games.matchmaking.title")}
        </Typography>
        {stats !== null && totalPlayers > 0 && (
          <SquareChip
            label={t("games.matchmaking.totalPlayers", { count: totalPlayers })}
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: "0.72rem" }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={loading}
          sx={{ color: "text.secondary" }}
        >
          <ArrowSync20Regular style={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" sx={{ color: "text.secondary" }}>
          {open ? (
            <ChevronUp20Regular style={{ fontSize: 16 }} />
          ) : (
            <ChevronDown20Regular style={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          {loading ? (
            <Stack spacing={1}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="text" width={180 + i * 20} />
              ))}
            </Stack>
          ) : modes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("games.matchmaking.noPlayers")}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {modes.map((mode) => (
                <Box key={mode} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SquareChip
                    label={t(`games.mode.${mode}`, { defaultValue: mode })}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.75rem", minWidth: 44 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {t("games.matchmaking.players", { count: queues[mode] })}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <SecondaryButton
                    variant="contained"
                    size="small"
                    startIcon={<Delete20Regular style={{ fontSize: 14 }} />}
                    onClick={() => handleClearQueue(mode)}
                    disabled={clearingMode === mode || queues[mode] === 0}
                    sx={{ fontSize: "0.75rem", height: 26, minWidth: 0 }}
                  >
                    {t("games.matchmaking.clearQueue")}
                  </SecondaryButton>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
