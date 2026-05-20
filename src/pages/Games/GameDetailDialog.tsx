import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowRight20Regular,
  Dismiss20Regular,
  Trophy20Regular,
  Timer20Regular,
  Target20Regular,
  Star20Regular,
} from "@fluentui/react-icons";
import { useTheme, alpha } from "@mui/material/styles";
import type { GameDetail } from "@/lib/types/games.types";
import { gamesService } from "@/lib/services/games.service";
import { useDateFormat } from "@/hooks/useDateFormat";
import { SquareChip } from "@/components/Common/StyledComponents";

function ModeChip({ mode }: { mode: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "default" | "primary" | "secondary"> = {
    solo: "default", "1v1": "primary", multi: "secondary",
  };
  return (
    <SquareChip
      label={t(`games.mode.${mode}`, { defaultValue: mode })}
      color={colorMap[mode] ?? "default"}
      size="small" variant="outlined"
      sx={{ height: 20, fontSize: "0.75rem" }}
    />
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
    waiting: "default", ready: "info", in_progress: "warning",
    completed: "success", cancelled: "error", abandoned: "default",
  };
  return (
    <SquareChip
      label={t(`games.status.${status}`, { defaultValue: status })}
      color={colorMap[status] ?? "default"}
      size="small"
      sx={{ height: 20, fontSize: "0.75rem" }}
    />
  );
}

function calcDuration(startedAt: string | null | undefined, completedAt: string | null | undefined): string {
  if (!startedAt || !completedAt) return "—";
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (diffMs <= 0) return "—";
  const m = Math.floor(diffMs / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  return `${m}m ${s}s`;
}

interface GameDetailDialogProps {
  gameId: string | null;
  open: boolean;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ px: 2.5, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Typography variant="caption" color="text.disabled" fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem", flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: "right" }}>{value ?? <Typography variant="body2" color="text.disabled">—</Typography>}</Box>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
      <Typography variant="caption" color="text.disabled" fontWeight={700}
        sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.62rem" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function GameDetailDialog({ gameId, open, onClose }: GameDetailDialogProps) {
  const { t } = useTranslation("dashboard");
  const { formatDateOnly } = useDateFormat();
  const theme = useTheme();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || !open) { setGame(null); return; }
    setLoading(true);
    gamesService.getById(gameId)
      .then(setGame)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId, open]);

  const template = useMemo(() => {
    if (!game?.template_snapshot) return null;
    try { return JSON.parse(game.template_snapshot) as Record<string, unknown>; } catch { return null; }
  }, [game?.template_snapshot]);

  const players = game?.players ?? [];
  const correctCount = game?.answers?.filter((a) => a.is_correct).length ?? 0;
  const totalAnswers = game?.answers?.length ?? 0;
  const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : null;

  const openFullPage = () => {
    onClose();
    navigate(`/games/${gameId}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6, py: 1.75 }}>
        {loading || !game ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Skeleton variant="text" width={90} height={28} />
            <Skeleton variant="rounded" width={50} height={20} />
            <Skeleton variant="rounded" width={70} height={20} />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" component="span" fontWeight={700} sx={{ fontFamily: "monospace", fontSize: "0.95rem" }}>
              {game.public_id ?? game.id}
            </Typography>
            <ModeChip mode={game.mode} />
            <StatusChip status={game.status} />
          </>
        )}
        <IconButton size="small" onClick={onClose} sx={{ position: "absolute", right: 12, top: 10 }}>
          <Dismiss20Regular style={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading || !game ? (
          <Stack spacing={0} sx={{ py: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ px: 2.5, py: 1.25 }}>
                <Skeleton variant="rounded" height={28} />
              </Box>
            ))}
          </Stack>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 0, borderBottom: "1px solid", borderColor: "divider" }}>
              {[
                {
                  icon: <Timer20Regular style={{ fontSize: 16 }} />,
                  label: t("games.detail.duration"),
                  value: calcDuration(game.started_at, game.completed_at),
                },
                {
                  icon: <Target20Regular style={{ fontSize: 16 }} />,
                  label: t("games.detail.questions"),
                  value: `${totalAnswers}/${game.question_count ?? "?"}`,
                },
                ...(accuracy !== null ? [{
                  icon: <Star20Regular style={{ fontSize: 16 }} />,
                  label: t("games.detail.accuracy"),
                  value: `${accuracy}%`,
                  color: theme.palette.primary.main,
                }] : []),
              ].map((stat, i, arr) => (
                <Box key={i} sx={{
                  flex: 1, px: 1.5, py: 1.5, textAlign: "center",
                  borderRight: i < arr.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                }}>
                  <Box sx={{ color: stat.color ?? "text.disabled", display: "flex", justifyContent: "center", mb: 0.25 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <SectionLabel>{t("games.detail.info")}</SectionLabel>
            <Stack divider={<Divider />}>
              {!!template?.name && (
                <Field label={t("games.detail.template")} value={
                  <Typography variant="body2" fontWeight={500}>{String(template.name)}</Typography>
                } />
              )}
              {game.category && (
                <Field label={t("games.detail.category")} value={
                  <Typography variant="body2">{game.category}</Typography>
                } />
              )}
              {game.language && (
                <Field label={t("games.detail.language")} value={
                  <SquareChip label={game.language.toUpperCase()} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                } />
              )}
              <Field label={t("games.detail.createdAt")} value={
                <Typography variant="body2" color="text.secondary">{formatDateOnly(game.created_at)}</Typography>
              } />
            </Stack>

            {players.length > 0 && (
              <>
                <Divider />
                <SectionLabel>{t("games.detail.players")}</SectionLabel>
                <Stack spacing={0} sx={{ pb: 1 }}>
                  {players.map((p) => {
                    const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                    const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                    return (
                      <Box
                        key={p.id}
                        sx={{
                          px: 2.5, py: 1,
                          display: "flex", alignItems: "center", gap: 1.5,
                          bgcolor: isWinner ? alpha(theme.palette.warning.main, 0.04) : undefined,
                        }}
                      >
                        <Avatar sx={{ width: 26, height: 26, fontSize: "0.7rem", bgcolor: isWinner ? "warning.main" : "action.selected", color: isWinner ? "warning.contrastText" : "text.primary" }}>
                          {username[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ flexGrow: 1 }} fontWeight={isWinner ? 600 : 400}>
                          {username}
                        </Typography>
                        {isWinner && (
                          <Trophy20Regular style={{ fontSize: 14, color: theme.palette.warning.main }} />
                        )}
                        <Typography variant="body2" fontWeight={isWinner ? 700 : 400} color={isWinner ? "warning.main" : "text.secondary"}>
                          {p.score} pts
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}

            <Divider />

            <Box
              onClick={openFullPage}
              sx={{
                px: 2.5, py: 1.5,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
                color: "primary.main",
                "&:hover": { bgcolor: "action.hover" },
                transition: "background-color 150ms",
              }}
            >
              <Typography variant="body2" fontWeight={500}>{t("games.detail.openFull")}</Typography>
              <ArrowRight20Regular style={{ fontSize: 16 }} />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
