import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Grid2,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  ArrowLeft20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
} from "@fluentui/react-icons";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Dot, ReferenceLine, ZAxis } from "recharts";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { gamesService } from "@/lib/services/games.service";
import { usersService } from "@/lib/services/users.service";
import { DATASETS_ENDPOINTS } from "@/lib/api/endpoints";
import type { GameDetail, GameAnswer, GameQuestion, GamePlayer, GeoQuestionData } from "@/lib/types/games.types";
import { useDateFormat } from "@/hooks/useDateFormat";
import PageContainer from "@/components/Common/PageContainer";
import { SecondaryButton, SquareChip } from "@/components/Common/StyledComponents";

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
    />
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "default" | "primary" | "info" | "warning" | "success" | "error"> = {
    waiting: "default", ready: "info", in_progress: "warning",
    completed: "primary", cancelled: "error", abandoned: "default",
  };
  return (
    <SquareChip
      label={t(`games.status.${status}`, { defaultValue: status })}
      color={colorMap[status] ?? "default"}
      size="small"
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.disabled" fontWeight={700}
      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem", display: "block", mb: 1 }}>
      {children}
    </Typography>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
      <Typography variant="caption" color="text.disabled" fontWeight={500}>{label}</Typography>
      <Typography variant="body2" component="div">{value ?? "—"}</Typography>
    </Box>
  );
}

function isImgUrl(s: string): boolean {
  return s.startsWith("http") || s.startsWith("/");
}

function isIso2(s: string): boolean {
  return /^[a-zA-Z]{2}$/.test(s);
}

function resolveFlagSrc(flag: string): string | null {
  if (isImgUrl(flag)) return flag;
  if (isIso2(flag)) return DATASETS_ENDPOINTS.GET_FLAG(flag.toLowerCase());
  return null;
}

function FlagImg({ flag, size = 24 }: { flag: string; size?: number }) {
  const src = resolveFlagSrc(flag);
  if (src) {
    return (
      <Box
        component="img" src={src} alt={flag}
        sx={{
          height: size, width: "auto", maxWidth: size * 1.6,
          objectFit: "contain", borderRadius: 0.5,
          display: "inline-block", verticalAlign: "middle", flexShrink: 0,
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <Box component="span" sx={{ fontSize: size * 0.9, lineHeight: 1, display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      {flag}
    </Box>
  );
}

type QKind = "flag" | "geo" | "knowledge" | "unknown";

function detectQKind(q: GameQuestion, game: GameDetail): QKind {
  const rawType = ((q.question?.qtype ?? q.type) ?? "").toLowerCase();
  const data = q.data as GeoQuestionData | undefined;
  if (rawType.includes("flag") || game.category?.includes("flag") || data?.flag || (data?.variant && data.variant !== "")) return "flag";
  if (rawType.includes("geo") || rawType.includes("country") || rawType.includes("capital") || data?.target_name || data?.target_slug) return "geo";
  if (q.question?.i18n) return "knowledge";
  return "unknown";
}

interface NormOption {
  slug: string;
  displayName: string;
  flag?: string;
  isCorrect: boolean;
}

function normalizeOptions(q: GameQuestion): NormOption[] {
  const data = q.data as GeoQuestionData | undefined;
  const correctSlug = data?.correct_answer?.slug ?? "";
  const geoOpts = data?.options ?? [];
  if (geoOpts.length > 0) {
    return geoOpts.map((o) => ({
      slug: o.slug ?? "",
      displayName: o.name?.en ?? o.name?.fr ?? o.slug ?? "?",
      flag: o.flag,
      isCorrect: o.is_correct ?? (!!o.slug && o.slug === correctSlug),
    }));
  }
  return (q.question?.answers ?? []).map((a) => ({
    slug: a.slug,
    displayName: a.slug,
    isCorrect: a.is_correct,
  }));
}

function resolveCorrectSlug(q: GameQuestion): string {
  const data = q.data as GeoQuestionData | undefined;
  return (
    data?.correct_answer?.slug ??
    data?.options?.find((o) => o.is_correct)?.slug ??
    q.question?.answers?.find((a) => a.is_correct)?.slug ??
    ""
  );
}

function resolveCorrectName(q: GameQuestion, options: NormOption[]): string {
  const slug = resolveCorrectSlug(q);
  const opt = options.find((o) => o.slug === slug);
  if (opt) return opt.displayName;
  const data = q.data as GeoQuestionData | undefined;
  return data?.correct_answer?.name?.en ?? data?.correct_answer?.name?.fr ?? slug ?? "?";
}

function resolveCorrectFlag(q: GameQuestion, options: NormOption[]): string | undefined {
  const slug = resolveCorrectSlug(q);
  const opt = options.find((o) => o.slug === slug);
  const data = q.data as GeoQuestionData | undefined;
  return opt?.flag ?? data?.correct_answer?.flag;
}

function resolveAnswerInfo(answer: GameAnswer, options: NormOption[]): { name: string; flag?: string } {
  const data = answer.data as Record<string, unknown> | undefined;
  const userAnswer = data?.user_answer;
  const userAnswerText = typeof userAnswer === "string" ? userAnswer : null;
  const submittedSlug = userAnswer && typeof userAnswer === "object"
    ? (userAnswer as { submitted_slug?: string }).submitted_slug
    : undefined;
  const slug = submittedSlug ?? (answer.answer_slug || undefined);
  const opt = slug ? options.find((o) => o.slug === slug) : undefined;
  return {
    name: opt?.displayName ?? userAnswerText ?? answer.answer_label ?? slug ?? "?",
    flag: opt?.flag,
  };
}

function PlayerAnswerRow({
  answer, player, correctSlug, correctName, correctFlag, options, showPlayer,
}: {
  answer: GameAnswer;
  player?: GamePlayer;
  correctSlug: string;
  correctName: string;
  correctFlag?: string;
  options: NormOption[];
  showPlayer: boolean;
}) {
  const theme = useTheme();
  const { name: answerName, flag: answerFlag } = resolveAnswerInfo(answer, options);
  const timeMs = (answer.data as { server_time_spent_ms?: number } | undefined)?.server_time_spent_ms;
  const username = player?.user?.username ?? player?.username ?? answer.player_id.substring(0, 8);

  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.35, flexWrap: "wrap" }}>
      {answer.is_correct
        ? <CheckmarkCircle20Regular style={{ fontSize: 15, color: theme.palette.primary.main, flexShrink: 0 }} />
        : <DismissCircle20Regular style={{ fontSize: 15, color: alpha(theme.palette.primary.main, 0.35), flexShrink: 0 }} />}
      {showPlayer && (
        <Typography variant="caption" fontWeight={500} color="text.secondary"
          sx={{ minWidth: 72, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {username}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} alignItems="center"
        sx={{ bgcolor: "action.hover", px: 0.75, py: 0.2, borderRadius: 1 }}>
        {answerFlag && <FlagImg flag={answerFlag} size={15} />}
        <Typography variant="caption" sx={{ fontFamily: answerFlag ? undefined : "monospace", fontSize: "0.75rem" }}>
          {answerName}
        </Typography>
      </Stack>
      <Typography variant="caption" fontWeight={700}
        color={answer.is_correct ? "primary.main" : "text.disabled"} sx={{ fontSize: "0.72rem" }}>
        +{answer.points}pts
      </Typography>
      {timeMs != null && (
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
          {timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`}
        </Typography>
      )}
      {!answer.is_correct && correctSlug && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.disabled">→</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center"
            sx={{ px: 0.75, py: 0.2, borderRadius: 1 }}>
            {correctFlag && <FlagImg flag={correctFlag} size={15} />}
            <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontFamily: correctFlag ? undefined : "monospace", fontSize: "0.72rem" }}>
              {correctName}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

function FlagQuestionDisplay({
  q, options, cSlug, cName, cFlag, questionFlag, targetName, questionAnswers, showPlayer,
}: {
  q: GameQuestion;
  options: NormOption[];
  cSlug: string; cName: string; cFlag?: string;
  questionFlag?: string;
  targetName: string | null;
  questionAnswers: Array<{ player?: GamePlayer; answer: GameAnswer }>;
  showPlayer: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");
  const data = q.data as GeoQuestionData | undefined;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          p: 0.5,
        }}>
          {questionFlag
            ? <FlagImg flag={questionFlag} size={56} />
            : <Box sx={{ width: 84, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">?</Typography>
              </Box>}
        </Box>
        <Box>
          {targetName && (
            <Typography variant="body2" fontWeight={600}>{targetName}</Typography>
          )}
          {(data?.target_iso2 || data?.target_iso3) && (
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", display: "block" }}>
              {[data?.target_iso2, data?.target_iso3].filter(Boolean).join(" · ")}
            </Typography>
          )}
          {(data?.target_slug) && (
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", display: "block" }}>
              {data.target_slug}
            </Typography>
          )}
        </Box>
      </Stack>

      {options.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem", display: "block", mb: 0.75 }}>
            Options
          </Typography>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75 }}>
            {options.map((opt) => (
              <Stack
                key={opt.slug}
                direction="row" spacing={0.75} alignItems="center"
                sx={{
                  px: 0.75, py: 0.35, borderRadius: 1.5,
                  border: opt.isCorrect ? "1px solid" : "1px solid transparent",
                  borderColor: opt.isCorrect ? "primary.main" : "transparent",
                  transition: "none",
                }}
              >
                {opt.flag
                  ? <FlagImg flag={opt.flag} size={20} />
                  : null}
                <Typography variant="caption" fontWeight={opt.isCorrect ? 700 : 400}
                  color={opt.isCorrect ? "primary.main" : "text.primary"} sx={{ fontSize: "0.72rem" }}>
                  {opt.displayName}
                </Typography>
                {opt.isCorrect && (
                  <CheckmarkCircle20Regular style={{ fontSize: 11, color: theme.palette.primary.main }} />
                )}
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {options.length === 0 && cSlug && (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.25 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={600}>Correct:</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center"
            sx={{ px: 0.5, py: 0.25 }}>
            {cFlag
              ? <FlagImg flag={cFlag} size={20} />
              : <Box sx={{ width: 30, height: 20, bgcolor: "action.selected", borderRadius: 0.5 }} />}
            <Typography variant="caption" fontWeight={700} color="primary.main">{cName}</Typography>
          </Stack>
        </Stack>
      )}

      <Typography variant="caption" color="text.disabled" fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem", display: "block", mb: 0.75 }}>
        {showPlayer ? "Player answers" : "Answer"}
      </Typography>
      {questionAnswers.length === 0 ? (
        <Typography variant="caption" color="text.disabled">{t("games.detail.noAnswer")}</Typography>
      ) : (
        <Stack spacing={0.75}>
          {questionAnswers.map(({ player, answer }) => {
            const { name: ansName, flag: ansFlag } = resolveAnswerInfo(answer, options);
            const timeMs = (answer.data as { server_time_spent_ms?: number } | undefined)?.server_time_spent_ms;
            const username = player?.user?.username ?? player?.username ?? answer.player_id.substring(0, 8);
            return (
              <Stack key={answer.id} direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5 }}>
                {answer.is_correct
                  ? <CheckmarkCircle20Regular style={{ fontSize: 16, color: theme.palette.primary.main, flexShrink: 0 }} />
                  : <DismissCircle20Regular style={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.35), flexShrink: 0 }} />}
                {showPlayer && (
                  <Typography variant="caption" fontWeight={500} color="text.secondary"
                    sx={{ minWidth: 72, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {username}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.75} alignItems="center"
                  sx={{ px: 0.25, py: 0.25 }}>
                  {ansFlag && <FlagImg flag={ansFlag} size={22} />}
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.72rem" }}
                    color={answer.is_correct ? "primary.main" : "text.secondary"}>
                    {ansName}
                  </Typography>
                </Stack>
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.72rem" }}
                  color={answer.is_correct ? "primary.main" : "text.disabled"}>
                  +{answer.points}pts
                </Typography>
                {timeMs != null && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
                    {timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`}
                  </Typography>
                )}
                {!answer.is_correct && cSlug && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="caption" color="text.disabled">→</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center"
                      sx={{ px: 0.25, py: 0.25 }}>
                      {cFlag
                        ? <FlagImg flag={cFlag} size={22} />
                        : null}
                      <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: "0.72rem" }}>
                        {cName}
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <PageContainer>
      <Stack spacing={3}>
        <Skeleton variant="text" width={220} height={36} />
        <Skeleton variant="rounded" width="100%" height={180} />
        <Skeleton variant="rounded" width="100%" height={200} />
        <Skeleton variant="rounded" width="100%" height={300} />
      </Stack>
    </PageContainer>
  );
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("dashboard");
  const { formatDateOnly } = useDateFormat();
  const theme = useTheme();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([
      gamesService.getById(id),
      gamesService.getQuestions(id).catch(() => [] as GameQuestion[]),
      gamesService.getAnswers(id).catch(() => [] as GameAnswer[]),
    ])
      .then(([gameData, questionsData, answersData]) => {
        setGame(gameData);
        setQuestions(
          questionsData.length > 0
            ? [...questionsData].sort((a, b) => a.order_number - b.order_number)
            : [...(gameData.questions ?? [])].sort((a, b) => a.order_number - b.order_number)
        );
        setAnswers(answersData.length > 0 ? answersData : (gameData.answers ?? []));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const template = useMemo(() => {
    if (!game?.template_snapshot) return null;
    try { return JSON.parse(game.template_snapshot) as Record<string, unknown>; } catch { return null; }
  }, [game?.template_snapshot]);

  const players = game?.players ?? [];
  const isMultiplayer = players.length > 1;

  const correctCount = answers.filter((a) => a.is_correct).length;
  const uniqueAnsweredCount = new Set(answers.map((a) => a.question_id).filter(Boolean)).size;
  const questionCount = game?.question_count ?? questions.length;
  const accuracy = !isMultiplayer && answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : null;
  const winner = game?.winner_id ? players.find((p) => p.user_id === game.winner_id) : null;
  const winnerName = winner?.user?.username ?? winner?.username ?? winner?.user_public_id?.substring(0, 8);

  const maxScore = useMemo(() => {
    if (game?.question_count != null && game?.points_per_correct != null && game.points_per_correct > 0) {
      return game.question_count * game.points_per_correct;
    }
    if (players.length > 0) {
      const max = Math.max(...players.map((p) => p.score ?? 0));
      return max > 0 ? max : 100;
    }
    return 100;
  }, [game, players]);

  const [scoreHover, setScoreHover] = useState<"correct" | "incorrect" | null>(null);
  const [timeHover, setTimeHover] = useState<"correct" | "incorrect" | "avg" | null>(null);
  const [scorePlayerHover, setScorePlayerHover] = useState<string | null>(null);
  const [timePlayerHover, setTimePlayerHover] = useState<string | null>(null);

  const chartData = useMemo((): Record<string, number | boolean | null>[] => {
    if (isMultiplayer) {
      const perPlayer: Record<string, GameAnswer[]> = {};
      for (const p of players) perPlayer[p.id] = [];
      for (const a of answers) {
        if (perPlayer[a.player_id]) perPlayer[a.player_id].push(a);
      }
      for (const pid of Object.keys(perPlayer)) {
        perPlayer[pid].sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime());
      }
      const maxLen = Math.max(...Object.values(perPlayer).map((arr) => arr.length));
      const cumByPlayer: Record<string, number> = {};
      for (const pid of Object.keys(perPlayer)) cumByPlayer[pid] = 0;
      const data: Record<string, number | null>[] = [{ index: 0, ...Object.fromEntries(players.map((p) => [p.id, 0])) }];
      for (let i = 0; i < maxLen; i++) {
        const row: Record<string, number | null> = { index: i + 1 };
        for (const [pid, arr] of Object.entries(perPlayer)) {
          if (arr[i]) { cumByPlayer[pid] += arr[i].points; row[pid] = cumByPlayer[pid]; }
          else row[pid] = null;
        }
        data.push(row);
      }
      return data;
    }
    const sorted = [...answers].sort((a, b) =>
      new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime()
    );
    let cumulative = 0;
    return [
      { index: 0, cumulative: 0, is_correct: null },
      ...sorted.map((a, i) => {
        cumulative += a.points;
        return { index: i + 1, cumulative, is_correct: a.is_correct };
      }),
    ];
  }, [answers, players, isMultiplayer]);

  const timelineEvents = useMemo(() => {
    if (!game) return [];
    type MetaEv = { kind: "created" | "started" | "completed" | "cancelled"; label: string; timestamp: string; color: string };
    type JoinEv = { kind: "player_joined"; username: string; finalScore: number; timestamp: string; color: string };
    type AnswerEv = {
      kind: "answer"; qNum: number; timestamp: string; color: string;
      answerSlug: string; answeredName: string; isCorrect: boolean;
      correctSlug: string; correctName: string; targetName: string;
      points: number; cumulativeScore: number; timeMs: number | null;
      playerName: string | null;
    };
    type TLEvent = MetaEv | JoinEv | AnswerEv;
    const events: TLEvent[] = [];

    const p0 = theme.palette.primary.main;
    events.push({ kind: "created", label: "Game Created", timestamp: game.created_at, color: alpha(p0, 0.3) });

    const sortedPlayers = [...players].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
    for (const p of sortedPlayers) {
      events.push({ kind: "player_joined", username: p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8), finalScore: p.score, timestamp: p.joined_at, color: alpha(p0, 0.55) });
    }

    if (game.started_at) events.push({ kind: "started", label: "Game Started", timestamp: game.started_at, color: alpha(p0, 0.75) });

    const sortedAnswers = [...answers].sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime());
    const sortedQuestions = [...questions].sort((a, b) => a.order_number - b.order_number);
    let cumul = 0;
    sortedAnswers.forEach((a, i) => {
      cumul += a.points;
      const q = sortedQuestions[i];
      const qData = (q?.data ?? {}) as Record<string, unknown>;
      const correctAnswer = qData.correct_answer as { name?: Record<string, string>; slug?: string } | undefined;
      const options = qData.options as Array<{ slug: string; name?: Record<string, string> }> | undefined;
      const targetName = correctAnswer?.name?.en ?? correctAnswer?.slug ?? `Q${i + 1}`;
      const correctSlug = correctAnswer?.slug ?? "";
      const correctName = correctAnswer?.name?.en ?? correctSlug;
      const answeredOpt = options?.find((o) => o.slug === a.answer_slug);
      const answeredName = answeredOpt?.name?.en ?? a.answer_slug;
      const ms = (a.data as Record<string, unknown>)?.server_time_spent_ms as number | undefined;
      const player = players.find((p) => p.id === a.player_id);
      events.push({
        kind: "answer", qNum: i + 1, timestamp: a.answered_at,
        color: a.is_correct ? p0 : alpha(p0, 0.3),
        answerSlug: a.answer_slug, answeredName, isCorrect: a.is_correct,
        correctSlug, correctName, targetName,
        points: a.points, cumulativeScore: cumul, timeMs: ms ?? null,
        playerName: players.length > 1 ? (player?.user?.username ?? player?.username ?? null) : null,
      });
    });

    if (game.completed_at) {
      const done = game.status === "completed";
      events.push({ kind: done ? "completed" : "cancelled", label: done ? "Completed" : "Cancelled", timestamp: game.completed_at, color: done ? p0 : alpha(p0, 0.4) });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [game, answers, players, questions, theme]);

  const answersByPlayer = useMemo(() => {
    const map = new Map<string, GameAnswer[]>();
    for (const a of answers) {
      const key = a.player_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [answers]);

  const scoreByPlayer = useMemo(() => {
    const map = new Map<string, number>();
    for (const [pid, panswers] of answersByPlayer.entries()) {
      map.set(pid, panswers.reduce((s, a) => s + a.points, 0));
    }
    return map;
  }, [answersByPlayer]);

  const timeChartData = useMemo(() => {
    if (isMultiplayer) {
      const result: Array<{ q: number; time: number; player_id: string; is_correct: boolean }> = [];
      for (const p of players) {
        const panswers = answers.filter((a) => a.player_id === p.id)
          .sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime());
        panswers.forEach((a, i) => {
          const ms = (a.data as Record<string, unknown>)?.server_time_spent_ms as number | undefined;
          if (ms != null) result.push({ q: i + 1, time: +(ms / 1000).toFixed(2), player_id: p.id, is_correct: a.is_correct });
        });
      }
      return result;
    }
    const sorted = [...answers].sort((a, b) =>
      new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime()
    );
    return sorted.map((a, i) => {
      const ms = (a.data as Record<string, unknown>)?.server_time_spent_ms as number | undefined;
      return {
        q: i + 1,
        time: ms != null ? +(ms / 1000).toFixed(2) : null,
        is_correct: a.is_correct,
        player_id: a.player_id,
      };
    }).filter((d) => d.time != null);
  }, [answers, players, isMultiplayer]);

  const openUserView = useCallback((p: typeof players[number]) => {
    if (p.user_id) navigate(`/users?view=${p.user_id}`);
  }, [navigate]);

  if (loading) return <LoadingSkeleton />;

  if (error || !game) {
    return (
      <PageContainer>
        <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary">{t("games.detail.notFound")}</Typography>
          <SecondaryButton variant="contained" startIcon={<ArrowLeft20Regular />} onClick={() => navigate("/games")}>
            {t("games.detail.backToGames")}
          </SecondaryButton>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Tooltip title={t("games.detail.backToGames")}>
          <Box
            onClick={() => navigate("/games")}
            sx={{ cursor: "pointer", color: "text.disabled", display: "flex", alignItems: "center", "&:hover": { color: "text.primary" } }}
          >
            <ArrowLeft20Regular style={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
        <Typography variant="h6" component="h1" fontWeight={700} sx={{ fontFamily: "monospace", fontSize: "1.1rem" }}>
          {(game.public_id ?? game.id).substring(0, 12)}
        </Typography>
        <ModeChip mode={game.mode} />
        <StatusChip status={game.status} />
      </Stack>
      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 3, ml: 3.5 }}>
        {t("games.detail.createdAt")}: {formatDateOnly(game.created_at)}
        {game.started_at && ` · ${t("games.detail.startedAt")}: ${formatDateOnly(game.started_at)}`}
        {game.completed_at && ` · ${t("games.detail.completedAt")}: ${formatDateOnly(game.completed_at)}`}
      </Typography>

      <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
        {[
          { label: t("games.detail.duration"), value: calcDuration(game.started_at, game.completed_at) },
          { label: t("games.detail.questions"), value: `${uniqueAnsweredCount} / ${questionCount || "?"}` },
          ...(accuracy !== null ? [{ label: t("games.detail.accuracy"), value: `${accuracy}%`, color: "primary.main" }] : []),
          ...(players.length > 0 ? [{ label: t("games.detail.players"), value: String(players.length) }] : []),
          ...(winnerName ? [{ label: t("games.detail.winner"), value: winnerName, color: "primary.main" }] : []),
        ].map((stat, i, arr) => (
          <React.Fragment key={i}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography variant="body2" color="text.disabled" fontWeight={500}>
                {stat.label}
              </Typography>
              <Typography variant="body2" fontWeight={700} color={(stat as { color?: string }).color ?? "text.primary"}>
                {stat.value}
              </Typography>
            </Box>
            {i < arr.length - 1 && (
              <Typography variant="caption" color="text.disabled" sx={{ userSelect: "none" }}>·</Typography>
            )}
          </React.Fragment>
        ))}
      </Stack>

      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        <Grid2 size={{ xs: 12, md: 7 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              {t("games.detail.players")} ({players.length})
            </Typography>
            {players.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>—</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("users.table.headers.username")}</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Accuracy</TableCell>
                    <TableCell>{t("games.columns.status")}</TableCell>
                    <TableCell>{t("games.columns.createdAt")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((p, pi) => {
                    const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                    const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                    const playerColor = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                    const pAnswers = answersByPlayer.get(p.id) ?? [];
                    const pCorrect = pAnswers.filter((a) => a.is_correct).length;
                    const pAccuracy = pAnswers.length > 0 ? Math.round((pCorrect / pAnswers.length) * 100) : null;
                    return (
                      <TableRow
                        key={p.id}
                        onClick={() => openUserView(p)}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar
                              src={p.user?.has_avatar ? usersService.getAvatarUrl(p.user_id) : undefined}
                              sx={{ width: 24, height: 24, fontSize: "0.7rem", bgcolor: playerColor }}
                            >
                              {username[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={isWinner ? 600 : 400}>
                                {username}
                              </Typography>
                              {p.user?.email && (
                                <Typography variant="caption" color="text.disabled">{p.user.email}</Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={isWinner ? 700 : 400} sx={{ color: playerColor }}>
                            {scoreByPlayer.size > 0 ? (scoreByPlayer.get(p.id) ?? p.score) : p.score}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="primary.main" fontWeight={500}>
                            {pAccuracy !== null ? `${pAccuracy}%` : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <SquareChip label={p.status} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {formatDateOnly(p.joined_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, px: 2.5, py: 1.5 }}>
            <SectionTitle>{t("games.detail.config")}</SectionTitle>
            <Stack divider={<Divider />}>
              {!!template?.name && <InfoRow label={t("games.detail.template")} value={
                game.template_id ? (
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    component="a"
                    href={`/console/templates/${game.template_id}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/templates/${game.template_id}`); }}
                    sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" }, cursor: "pointer" }}
                  >
                    {template.name as string}
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight={500} color="text.disabled">
                    {template.name as string}
                  </Typography>
                )
              } />}
              {game.category && <InfoRow label={t("games.detail.category")} value={game.category} />}
              {game.flag_variant && <InfoRow label={t("games.detail.flagVariant")} value={<Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{game.flag_variant}</Typography>} />}
              {game.points_per_correct != null && <InfoRow label={t("games.detail.pointsPerCorrect")} value={`${game.points_per_correct} pts`} />}
              {game.time_bonus != null && <InfoRow label={t("games.detail.timeBonus")} value={
                <Chip label={game.time_bonus ? t("users.yes") : t("users.no")} size="small" color={game.time_bonus ? "primary" : "default"} sx={{ height: 20, fontSize: "0.7rem" }} />
              } />}
              {game.max_players != null && <InfoRow label={t("games.detail.maxPlayers")} value={`${game.min_players ?? 1}–${game.max_players}`} />}
              <InfoRow label="ID" value={<Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "text.secondary" }}>{game.id}</Typography>} />
            </Stack>
          </Paper>
        </Grid2>
      </Grid2>

      {chartData.length > 0 && (
        <Grid2 container spacing={3} sx={{ mb: 3 }}>
          {players.length > 0 && (
            <Grid2 size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <SectionTitle>Score</SectionTitle>
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                  {players.map((p, pi) => {
                    const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                    const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                    const playerColor = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                    return (
                      <Box key={p.id} sx={{ textAlign: "center" }}>
                        <Gauge
                          value={scoreByPlayer.size > 0 ? (scoreByPlayer.get(p.id) ?? 0) : (p.score ?? 0)}
                          valueMax={maxScore}
                          startAngle={-110}
                          endAngle={110}
                          width={160}
                          height={110}
                          sx={{
                            [`& .${gaugeClasses.valueText}`]: {
                              fontSize: 22,
                              fontWeight: 700,
                              fill: theme.palette.text.primary,
                              transform: "translate(0px, 0px)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                              fill: playerColor,
                            },
                          }}
                          text={({ value, valueMax }) => {
                            const ppc = game.points_per_correct;
                            const v = value ?? 0;
                            const vm = valueMax ?? 0;
                            if (ppc && ppc > 1) return `${Math.round(v / ppc)} / ${Math.round(vm / ppc)}`;
                            return `${v} / ${vm}`;
                          }}
                        />
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <Typography variant="caption" fontWeight={isWinner ? 700 : 400} sx={{ color: playerColor }}>
                            {username}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid2>
          )}

          <Grid2 size={{ xs: 12, md: players.length > 0 ? 8 : 12 }}>
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, height: "100%" }}>
              <SectionTitle>{t("games.detail.scoreChart")}</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="index"
                    tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                    axisLine={false} tickLine={false}
                    label={{ value: "Q", position: "insideBottomRight", offset: 0, fontSize: 10, fill: theme.palette.text.disabled }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      game.points_per_correct && game.points_per_correct > 1
                        ? String(Math.round(v / game.points_per_correct))
                        : String(v)
                    }
                  />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
                    formatter={(value: number) => {
                      const ppc = game.points_per_correct;
                      const display = ppc && ppc > 1 ? Math.round(value / ppc) : value;
                      return [`${display} / ${game.question_count ?? "?"}`, "Score"];
                    }}
                    labelFormatter={(label) => label === 0 ? "Start" : `Q${label}`}
                  />
                  {isMultiplayer ? (
                    players.map((p, pi) => {
                      const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                      const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                      const color = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                      const dimmed = scorePlayerHover !== null && scorePlayerHover !== p.id;
                      return (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.id}
                          name={username}
                          stroke={color}
                          strokeWidth={dimmed ? 1.5 : 2.5}
                          strokeOpacity={dimmed ? 0.15 : 1}
                          dot={{ r: dimmed ? 3 : 5, fill: color, stroke: theme.palette.background.paper, strokeWidth: 1.5, opacity: dimmed ? 0.15 : 1 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                          style={{ transition: "stroke-opacity 0.15s" }}
                        />
                      );
                    })
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (payload.is_correct === null) return <Dot key={props.key} cx={cx} cy={cy} r={0} />;
                        const dimmed = scoreHover !== null && (payload.is_correct ? scoreHover !== "correct" : scoreHover !== "incorrect");
                        const fill = payload.is_correct
                          ? theme.palette.primary.main
                          : scoreHover === "incorrect"
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.3);
                        return (
                          <Dot
                            key={props.key}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={fill}
                            stroke={theme.palette.background.paper}
                            strokeWidth={1.5}
                            opacity={dimmed ? 0.12 : 1}
                            style={{ transition: "opacity 0.15s, fill 0.15s" }}
                          />
                        );
                      }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              {isMultiplayer ? (
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                  {players.map((p, pi) => {
                    const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                    const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                    const color = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                    const dimmed = scorePlayerHover !== null && scorePlayerHover !== p.id;
                    return (
                      <Stack key={p.id} direction="row" spacing={0.5} alignItems="center"
                        onMouseEnter={() => setScorePlayerHover(p.id)} onMouseLeave={() => setScorePlayerHover(null)}
                        sx={{ cursor: "default", transition: "opacity 0.15s", opacity: dimmed ? 0.3 : 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                        <Typography variant="caption" color="text.disabled">{username}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setScoreHover("correct")} onMouseLeave={() => setScoreHover(null)}
                    sx={{ cursor: "default", transition: "opacity 0.15s", opacity: scoreHover === "incorrect" ? 0.3 : 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
                    <Typography variant="caption" color="text.disabled">{t("games.detail.correct")}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setScoreHover("incorrect")} onMouseLeave={() => setScoreHover(null)}
                    sx={{ cursor: "default", transition: "opacity 0.15s", opacity: scoreHover === "correct" ? 0.3 : 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.3) }} />
                    <Typography variant="caption" color="text.disabled">{t("games.detail.incorrect")}</Typography>
                  </Stack>
                </Stack>
              )}
            </Paper>
          </Grid2>
        </Grid2>
      )}

      {timeChartData.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
          <SectionTitle>Response time per question</SectionTitle>
          {(() => {
            const avgTime = +(timeChartData.reduce((s, d) => s + (d.time ?? 0), 0) / timeChartData.length).toFixed(2);
            const maxQ = Math.max(...timeChartData.map((d) => d.q));
            const uniqueQs = Array.from(new Set(timeChartData.map((d) => d.q))).sort((a, b) => a - b);
            return (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      type="number"
                      dataKey="q"
                      domain={[0.5, maxQ + 0.5]}
                      ticks={uniqueQs}
                      tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `Q${v}`}
                    />
                    <YAxis
                      type="number"
                      dataKey="time"
                      tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                      axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}s`}
                    />
                    <ZAxis range={[80, 80]} />
                    <ReferenceLine
                      y={avgTime}
                      stroke={timeHover === "avg" ? theme.palette.primary.main : theme.palette.text.disabled}
                      strokeWidth={timeHover === "avg" ? 2 : 1}
                      strokeDasharray="4 3"
                      opacity={timeHover !== null && timeHover !== "avg" ? 0.2 : 1}
                      label={{ value: `avg ${avgTime}s`, position: "insideTopRight", fontSize: 10, fill: timeHover === "avg" ? theme.palette.primary.main : theme.palette.text.disabled }}
                    />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ payload }) => {
                        const d = payload?.[0]?.payload;
                        if (!d) return null;
                        const player = isMultiplayer ? players.find((p) => p.id === d.player_id) : null;
                        const playerName = player ? (player.user?.username ?? player.username ?? player.user_public_id.substring(0, 8)) : null;
                        return (
                          <Box sx={{ px: 1.5, py: 1, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, fontSize: 12 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Q{d.q}{playerName ? ` · ${playerName}` : ""} — {d.is_correct ? "Correct" : "Incorrect"}
                            </Typography>
                            <Typography variant="caption" fontWeight={600} display="block">
                              {d.time}s
                            </Typography>
                          </Box>
                        );
                      }}
                    />
                    {isMultiplayer ? (
                      players.map((p, pi) => {
                        const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                        const color = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                        const playerData = (timeChartData as Array<{ q: number; time: number; player_id: string; is_correct: boolean }>).filter((d) => d.player_id === p.id);
                        const dimmed = (timePlayerHover !== null && timePlayerHover !== p.id) || timeHover === "avg";
                        return (
                          <Scatter
                            key={p.id}
                            data={playerData}
                            shape={(props: { cx?: number; cy?: number }) => {
                              const { cx = 0, cy = 0 } = props;
                              return (
                                <circle cx={cx} cy={cy} r={7} fill={color}
                                  stroke={theme.palette.background.paper} strokeWidth={2}
                                  opacity={dimmed ? 0.12 : 1}
                                  style={{ transition: "opacity 0.15s" }}
                                />
                              );
                            }}
                          />
                        );
                      })
                    ) : (
                      <Scatter
                        data={timeChartData}
                        shape={(props: { cx?: number; cy?: number; payload?: { is_correct: boolean } }) => {
                          const { cx = 0, cy = 0, payload } = props;
                          const isCorrect = payload?.is_correct;
                          const dimmed = timeHover === "avg" || (timeHover !== null && (isCorrect ? timeHover !== "correct" : timeHover !== "incorrect"));
                          const fill = isCorrect
                            ? theme.palette.primary.main
                            : timeHover === "incorrect"
                              ? theme.palette.primary.main
                              : alpha(theme.palette.primary.main, 0.3);
                          return (
                            <circle
                              cx={cx} cy={cy} r={7}
                              fill={fill}
                              stroke={theme.palette.background.paper}
                              strokeWidth={2}
                              opacity={dimmed ? 0.12 : 1}
                              style={{ transition: "opacity 0.15s, fill 0.15s" }}
                            />
                          );
                        }}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
                {isMultiplayer ? (
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                    {players.map((p, pi) => {
                      const username = p.user?.username ?? p.username ?? p.user_public_id.substring(0, 8);
                      const isWinner = !!(game.winner_id && p.user_id === game.winner_id);
                      const color = pi === 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4);
                      const dimmed = timePlayerHover !== null && timePlayerHover !== p.id;
                      return (
                        <Stack key={p.id} direction="row" spacing={0.5} alignItems="center"
                          onMouseEnter={() => setTimePlayerHover(p.id)} onMouseLeave={() => setTimePlayerHover(null)}
                          sx={{ cursor: "default", transition: "opacity 0.15s", opacity: dimmed ? 0.3 : 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                          <Typography variant="caption" color="text.disabled">{username}</Typography>
                        </Stack>
                      );
                    })}
                    <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setTimeHover("avg")} onMouseLeave={() => setTimeHover(null)}
                      sx={{ cursor: "default", transition: "opacity 0.15s", opacity: timeHover !== null && timeHover !== "avg" ? 0.3 : 1 }}>
                      <Box sx={{ width: 14, height: 1.5, bgcolor: timeHover === "avg" ? "primary.main" : "text.disabled", borderRadius: 1, transition: "background-color 0.15s", opacity: timeHover === "avg" ? 1 : 0.6 }} />
                      <Typography variant="caption" color={timeHover === "avg" ? "primary.main" : "text.disabled"} sx={{ transition: "color 0.15s" }}>avg</Typography>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setTimeHover("correct")} onMouseLeave={() => setTimeHover(null)}
                      sx={{ cursor: "default", transition: "opacity 0.15s", opacity: timeHover === "incorrect" ? 0.3 : 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
                      <Typography variant="caption" color="text.disabled">{t("games.detail.correct")}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setTimeHover("incorrect")} onMouseLeave={() => setTimeHover(null)}
                      sx={{ cursor: "default", transition: "opacity 0.15s", opacity: timeHover === "correct" ? 0.3 : 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.3) }} />
                      <Typography variant="caption" color="text.disabled">{t("games.detail.incorrect")}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" onMouseEnter={() => setTimeHover("avg")} onMouseLeave={() => setTimeHover(null)}
                      sx={{ cursor: "default", transition: "opacity 0.15s", opacity: timeHover !== null && timeHover !== "avg" ? 0.3 : 1 }}>
                      <Box sx={{ width: 14, height: 1.5, bgcolor: timeHover === "avg" ? "primary.main" : "text.disabled", borderRadius: 1, transition: "background-color 0.15s", opacity: timeHover === "avg" ? 1 : 0.6 }} />
                      <Typography variant="caption" color={timeHover === "avg" ? "primary.main" : "text.disabled"} sx={{ transition: "color 0.15s" }}>avg</Typography>
                    </Stack>
                  </Stack>
                )}
              </>
            );
          })()}
        </Paper>
      )}

      {timelineEvents.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3, overflow: "hidden" }}>
          <SectionTitle>{t("games.detail.timeline")}</SectionTitle>
          {(() => {
            const ITEM_W = 164;
            const shortTime = (iso: string) =>
              new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

            const H = 320;
            const DOT = 12;
            const HALF = H / 2;

            return (
              <Box sx={{ overflowX: "auto", mx: -1, px: 1 }}>
                <Box sx={{ display: "flex", minWidth: timelineEvents.length * ITEM_W, height: H, position: "relative" }}>
                  <Box sx={{
                    position: "absolute", top: HALF - 1, left: 0, right: 0,
                    height: 2, bgcolor: "divider", zIndex: 0,
                  }} />

                  {timelineEvents.map((ev, i) => {
                    const above = i % 2 === 0;
                    const dotSize = DOT;

                    const renderCard = () => {
                      if (ev.kind === "answer") {
                        return (
                          <Paper
                            variant="outlined"
                            sx={{ p: "5px 7px", borderRadius: 1.5, borderColor: ev.color, width: ITEM_W - 20 }}
                          >
                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.3 }}>
                              {ev.isCorrect
                                ? <CheckmarkCircle20Regular style={{ fontSize: 10, color: ev.color, flexShrink: 0 }} />
                                : <DismissCircle20Regular style={{ fontSize: 10, color: ev.color, flexShrink: 0 }} />}
                              <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.67rem", color: ev.color }}>
                                Q{ev.qNum}
                              </Typography>
                              {ev.playerName && (
                                <Typography variant="caption" sx={{ fontSize: "0.57rem", color: "text.disabled", ml: "auto !important", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 64 }}>
                                  {ev.playerName}
                                </Typography>
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ fontSize: "0.64rem", display: "block", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.targetName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: "0.62rem", display: "block", color: ev.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              → {ev.answeredName}
                            </Typography>
                            {!ev.isCorrect && ev.correctName && (
                              <Typography variant="caption" sx={{ fontSize: "0.60rem", display: "block", color: "primary.main", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                ✓ {ev.correctName}
                              </Typography>
                            )}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" sx={{ fontSize: "0.59rem", color: "text.disabled" }}>
                                {ev.timeMs != null ? `${(ev.timeMs / 1000).toFixed(1)}s` : "—"}
                              </Typography>
                              <Stack direction="row" spacing={0.4} alignItems="center">
                                <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.60rem", color: ev.color }}>
                                  +{ev.points}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
                                  ({game.points_per_correct && game.points_per_correct > 1
                                    ? `${Math.round(ev.cumulativeScore / game.points_per_correct)}/${game.question_count ?? "?"}`
                                    : ev.cumulativeScore})
                                </Typography>
                              </Stack>
                            </Stack>
                          </Paper>
                        );
                      }

                      if (ev.kind === "player_joined") {
                        return (
                          <Paper
                            variant="outlined"
                            sx={{ p: "5px 7px", borderRadius: 1.5, borderColor: ev.color, width: ITEM_W - 20 }}
                          >
                            <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.67rem", color: ev.color, display: "block" }}>
                              Joined
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: "0.64rem", display: "block", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.username}
                            </Typography>
                            {ev.finalScore > 0 && (
                              <Typography variant="caption" sx={{ fontSize: "0.59rem", color: "text.disabled", display: "block" }}>
                                Final: {game.points_per_correct && game.points_per_correct > 1
                                  ? `${Math.round(ev.finalScore / game.points_per_correct)}/${game.question_count ?? "?"}`
                                  : ev.finalScore}
                              </Typography>
                            )}
                          </Paper>
                        );
                      }

                      return (
                        <Box sx={{ textAlign: "center", px: 0.5, maxWidth: ITEM_W - 16 }}>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.70rem", color: ev.color, display: "block" }}>
                            {ev.label}
                          </Typography>
                        </Box>
                      );
                    };

                    const timeLabel = (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.61rem", whiteSpace: "nowrap" }}>
                        {shortTime(ev.timestamp)}
                      </Typography>
                    );

                    return (
                      <Box key={i} sx={{ flex: `0 0 ${ITEM_W}px`, width: ITEM_W, height: H, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                        <Box sx={{
                          height: HALF - DOT / 2, flexShrink: 0,
                          display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
                          justifyContent: above ? "flex-end" : "flex-start",
                          pb: above ? 0.75 : 0, pt: above ? 0 : 0.75,
                          overflow: "hidden",
                        }}>
                          {above ? renderCard() : timeLabel}
                        </Box>

                        <Box sx={{
                          width: dotSize, height: dotSize, flexShrink: 0,
                          borderRadius: "50%", bgcolor: ev.color,
                          border: `2px solid ${theme.palette.background.paper}`,
                          boxShadow: `0 0 0 1.5px ${ev.color}`,
                          zIndex: 2,
                        }} />

                        <Box sx={{
                          height: HALF - DOT / 2, flexShrink: 0,
                          display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
                          justifyContent: above ? "flex-start" : "flex-end",
                          pt: above ? 0.75 : 0, pb: above ? 0 : 0.75,
                          overflow: "hidden",
                        }}>
                          {above ? timeLabel : renderCard()}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })()}
        </Paper>
      )}

      {questions.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <SectionTitle>{t("games.detail.questionsAnswers")} ({questions.length})</SectionTitle>
          </Box>
          <Stack divider={<Divider />}>
            {questions.map((q, idx) => {
              const kind = detectQKind(q, game);
              const options = normalizeOptions(q);
              const cSlug = resolveCorrectSlug(q);
              const cName = resolveCorrectName(q, options);
              const cFlag = resolveCorrectFlag(q, options);
              const anyAnswer = answers.find((a) => a.question_id === q.id);
              const effectiveCName = cName || anyAnswer?.correct_answer_label || cSlug || "?";
              const effectiveCSlug = cSlug || anyAnswer?.correct_answer_slug || "";
              const data = q.data as GeoQuestionData | undefined;

              const targetName = data?.target_name?.en ?? data?.target_name?.fr ?? data?.target_slug ?? null;
              const stem = (
                q.question?.i18n?.en?.stem ?? q.question?.i18n?.en?.Stem ??
                q.question?.i18n?.fr?.stem ?? q.question?.i18n?.fr?.Stem ?? null
              );
              const questionFlag =
                data?.target_iso2 ??
                (data?.flag && isIso2(data.flag) ? data.flag : undefined) ??
                (kind === "flag" ? cFlag : undefined);

              const questionAnswers: Array<{ player?: GamePlayer; answer: GameAnswer }> = [];
              for (const [playerId, playerAnswers] of answersByPlayer.entries()) {
                const byId = q.id ? playerAnswers.find((a) => a.question_id === q.id) : undefined;
                const sorted = [...playerAnswers].sort((a, b) =>
                  new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime()
                );
                const answer = byId ?? sorted[idx];
                if (answer) {
                  questionAnswers.push({ player: players.find((p) => p.id === playerId), answer });
                }
              }

              const showPlayer = players.length > 1;

              const kindLabel =
                kind === "flag" ? "Flag"
                : kind === "geo" ? "Geography"
                : kind === "knowledge" ? "Knowledge"
                : q.type || "?";
              const kindColor: "info" | "secondary" | "default" =
                kind === "flag" ? "info" : kind === "geo" ? "secondary" : "default";

              return (
                <Box key={q.id} sx={{ px: 2.5, py: 1.75 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">

                    <Box sx={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0, mt: 0.15,
                      bgcolor: "action.selected", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.72rem" }}>{q.order_number}</Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>

                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                        <SquareChip
                          label={kindLabel} size="small" variant="outlined" color={kindColor}
                          sx={{ height: 18, fontSize: "0.62rem" }}
                        />
                        {q.type && q.type !== kindLabel.toLowerCase() && (
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontFamily: "monospace" }}>
                            {q.type}
                          </Typography>
                        )}
                        {q.question?.qtype && q.question.qtype !== q.type && (
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontFamily: "monospace" }}>
                            {q.question.qtype}
                          </Typography>
                        )}
                      </Stack>

                      {kind === "flag" ? (
                        <FlagQuestionDisplay
                          q={q}
                          options={options}
                          cSlug={effectiveCSlug} cName={effectiveCName} cFlag={cFlag}
                          questionFlag={questionFlag}
                          targetName={targetName}
                          questionAnswers={questionAnswers}
                          showPlayer={showPlayer}
                        />
                      ) : (
                        <>
                          {kind === "geo" && (
                            <Box sx={{ mb: 1 }}>
                              {targetName ? (
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  {cFlag && options.length === 0 && <FlagImg flag={cFlag} size={20} />}
                                  <Typography variant="body2" fontWeight={600}>{targetName}</Typography>
                                </Stack>
                              ) : stem ? (
                                <Typography variant="body2" fontWeight={600}>{stem}</Typography>
                              ) : null}
                            </Box>
                          )}

                          {(kind === "knowledge" || kind === "unknown") && stem && (
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{stem}</Typography>
                          )}

                          {options.length > 0 && (
                            <Stack direction="row" spacing={0.75} sx={{ mb: 1.25, flexWrap: "wrap", rowGap: 0.75 }}>
                              {options.map((opt) => (
                                <Chip
                                  key={opt.slug}
                                  label={
                                    <Box component="span" sx={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: 0.5 }}>
                                      {opt.flag && <FlagImg flag={opt.flag} size={14} />}
                                      <span>{opt.displayName}</span>
                                    </Box>
                                  }
                                  size="small"
                                  variant={opt.isCorrect ? "filled" : "outlined"}
                                  color={opt.isCorrect ? "primary" : "default"}
                                  sx={{ height: 24, fontSize: "0.72rem" }}
                                />
                              ))}
                            </Stack>
                          )}

                          {options.length === 0 && effectiveCSlug && (
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.disabled">Correct:</Typography>
                              <Stack direction="row" spacing={0.5} alignItems="center"
                                sx={{ px: 0.75, py: 0.25, borderRadius: 1 }}>
                                {cFlag && <FlagImg flag={cFlag} size={16} />}
                                <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontFamily: cFlag ? undefined : "monospace" }}>
                                  {effectiveCName}
                                </Typography>
                              </Stack>
                            </Stack>
                          )}

                          {questionAnswers.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">{t("games.detail.noAnswer")}</Typography>
                          ) : (
                            <Stack spacing={0.15}>
                              {questionAnswers.map(({ player, answer }) => (
                                <PlayerAnswerRow
                                  key={answer.id}
                                  answer={answer}
                                  player={player}
                                  correctSlug={effectiveCSlug}
                                  correctName={effectiveCName}
                                  correctFlag={cFlag}
                                  options={options}
                                  showPlayer={showPlayer}
                                />
                              ))}
                            </Stack>
                          )}
                        </>
                      )}

                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}
    </PageContainer>
  );
}
