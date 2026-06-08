import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Chip,
  Container,
  Divider,
  Grid2,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowReset20Regular,
  ArrowSync20Regular,
  Checkmark20Regular,
  CheckmarkCircle20Regular,
  Copy20Regular,
  Delete20Regular,
  DismissCircle20Regular,
  LockClosed20Regular,
} from "@fluentui/react-icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usersService } from "@/lib/services/users.service";
import { gamesService } from "@/lib/services/games.service";
import { logsService } from "@/lib/services/logs.service";
import { friendsService } from "@/lib/services/friends.service";
import type { AdminUser, ConnectionLog, UserProgressionSnapshot } from "@/lib/types/user.types";
import type { UserActionLog } from "@/lib/types/logs.types";
import type { Game, GameInvite, GamePlayer } from "@/lib/types/games.types";
import type { Friendship, FriendRequest } from "@/lib/types/friends.types";
import { enqueueSnackbar } from "notistack";
import PageContainer from "@/components/Common/PageContainer";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import { StyledTabs, StyledTab } from "@/components/Common/ResponsiveTabs";
import { TimeRangeSelector } from "@/pages/Analytics/components/TimeRangeSelector";
import UserActivityHeatmap from "./UserActivityHeatmap";
import { StatusChip, RoleChip } from "./UserRow";

interface GameHistoryEntry {
  game: Game;
  user_score: number;
  is_winner: boolean;
  players: GamePlayer[];
}

function formatPlayTime(s: number) {
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"} placement="top">
      <IconButton size="small" onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "text.secondary" } }}>
        {copied ? <Checkmark20Regular style={{ fontSize: 13 }} /> : <Copy20Regular style={{ fontSize: 13 }} />}
      </IconButton>
    </Tooltip>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
      {children}
    </Typography>
  );
}


function StatCard({ label, value, sub, loading }: { label: string; value: React.ReactNode; sub?: string; loading?: boolean }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {loading ? <Skeleton variant="text" width={48} sx={{ fontSize: "1.1rem" }} /> : <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{value}</Typography>}
      {sub && <Typography variant="caption" color="text.disabled" display="block">{sub}</Typography>}
    </Paper>
  );
}

function PrivacyRow({ label, value }: { label: string; value: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500} color={value ? "primary.main" : "text.disabled"}>{value ? "Yes" : "No"}</Typography>
    </Box>
  );
}

function GameModeChip({ mode }: { mode: string }) {
  const colors: Record<string, "default" | "primary" | "secondary"> = { solo: "default", "1v1": "primary", multi: "secondary" };
  return <Chip label={mode} size="small" color={colors[mode] ?? "default"} variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />;
}

function GameStatusChip({ status }: { status: string }) {
  const colors: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
    completed: "success", cancelled: "error", abandoned: "default", in_progress: "warning", waiting: "default", ready: "info",
  };
  return <Chip label={status} size="small" color={colors[status] ?? "default"} variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />;
}

function WLDPieChart({ won, lost, drawn }: { won: number; lost: number; drawn: number }) {
  const theme = useTheme();
  const total = won + lost + drawn;
  if (total === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No games yet</Typography></Box>;

  const data = [
    { name: "Won", value: won },
    { name: "Lost", value: lost },
    { name: "Drawn", value: drawn },
  ].filter((d) => d.value > 0);

  const colors = [theme.palette.primary.main, theme.palette.error.main, theme.palette.text.disabled];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
        </Pie>
        <RechartsTooltip
          contentStyle={{ fontSize: 12, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.primary }}
          itemStyle={{ color: theme.palette.text.primary }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: theme.palette.text.secondary }} iconType="circle" iconSize={7} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScoreTrendChart({ history }: { history: GameHistoryEntry[] }) {
  const theme = useTheme();
  const data = [...history]
    .filter((h) => h.game.completed_at)
    .sort((a, b) => new Date(a.game.completed_at!).getTime() - new Date(b.game.completed_at!).getTime())
    .map((h, i) => ({
      i: i + 1,
      score: h.user_score,
      label: formatDate(h.game.completed_at!),
    }));

  if (data.length === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No data</Typography></Box>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="i" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} tickFormatter={(v) => `G${v}`} />
        <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <RechartsTooltip
          contentStyle={{ fontSize: 12, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.primary }}
          itemStyle={{ color: theme.palette.text.primary }}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          formatter={(v: number) => [v, "Score"]}
        />
        <Line type="monotone" dataKey="score" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3, fill: theme.palette.primary.main }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ActionTypesChart({ logs }: { logs: UserActionLog[] }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) counts[log.Action] = (counts[log.Action] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [logs]);

  if (data.length === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No data</Typography></Box>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} width={90} axisLine={false} tickLine={false} />
        <RechartsTooltip
          contentStyle={{ fontSize: 12, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.primary }}
          itemStyle={{ color: theme.palette.text.primary }}
          cursor={{ fill: theme.palette.action.hover }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((_, i) => (
            <Cell key={i} fill={alpha(primary, 1 - (i / data.length) * 0.75)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ActionRadarChart({ logs }: { logs: UserActionLog[] }) {
  const theme = useTheme();
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) counts[log.Action] = (counts[log.Action] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([action, count]) => ({ action, count }));
  }, [logs]);

  if (data.length === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No data</Typography></Box>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
        <PolarGrid stroke={theme.palette.divider} />
        <PolarAngleAxis dataKey="action" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar dataKey="count" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.25} />
        <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius, fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function EloProgressionChart({ snapshots }: { snapshots: UserProgressionSnapshot[] }) {
  const theme = useTheme();
  const data = useMemo(() => {
    if (snapshots.length === 0) return [];
    const first = snapshots[0];
    const startElo = first.elo - first.elo_delta;
    return [
      { i: 0, elo: startElo, label: "Start", delta: null, result: "" },
      ...snapshots.map((s, idx) => ({
        i: idx + 1,
        elo: s.elo,
        delta: s.elo_delta,
        label: formatDate(s.recorded_at),
        result: s.is_drawn ? "Draw" : s.is_winner ? "Win" : "Loss",
        mode: s.game_mode,
      })),
    ];
  }, [snapshots]);

  if (data.length === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No ranked games yet</Typography></Box>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="i" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "Start" : `G${v}`} />
        <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
        <RechartsTooltip
          contentStyle={{ fontSize: 12, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.primary }}
          itemStyle={{ color: theme.palette.text.primary }}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload;
            if (!p) return "";
            const delta = p.delta != null ? (p.delta >= 0 ? ` (+${p.delta})` : ` (${p.delta})`) : "";
            return `${p.label}${p.result ? ` — ${p.result}` : ""}${delta}`;
          }}
          formatter={(v: number) => [v, "ELO"]}
        />
        <Line type="monotone" dataKey="elo" stroke={theme.palette.warning.main} strokeWidth={2} dot={{ r: 3, fill: theme.palette.warning.main }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function XpProgressionChart({ snapshots }: { snapshots: UserProgressionSnapshot[] }) {
  const theme = useTheme();
  const data = useMemo(() => {
    if (snapshots.length === 0) return [];
    const startXp = snapshots[0].experience - snapshots[0].experience_delta;
    return [
      { i: 0, xp: startXp, label: "Start", delta: null },
      ...snapshots.map((s, idx) => ({
        i: idx + 1,
        xp: s.experience,
        delta: s.experience_delta,
        level: s.level,
        rank: s.rank,
        label: formatDate(s.recorded_at),
      })),
    ];
  }, [snapshots]);

  if (data.length === 0) return <Box sx={{ py: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No games yet</Typography></Box>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="i" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "Start" : `G${v}`} />
        <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
        <RechartsTooltip
          contentStyle={{ fontSize: 12, borderRadius: "8px", border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.primary }}
          itemStyle={{ color: theme.palette.text.primary }}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload;
            if (!p) return "";
            const delta = p.delta != null ? (p.delta >= 0 ? ` (+${p.delta} XP)` : ` (${p.delta} XP)`) : "";
            return `${p.label}${delta}${p.rank ? ` · ${p.rank}` : ""}`;
          }}
          formatter={(v: number) => [v.toLocaleString(), "XP"]}
        />
        <Line type="monotone" dataKey="xp" stroke={theme.palette.secondary.main} strokeWidth={2} dot={{ r: 3, fill: theme.palette.secondary.main }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function rangeToStartDate(range: string): string | null {
  if (range === "all") return null;
  const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const d = days[range];
  if (!d) return null;
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString().slice(0, 10);
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const confirm = useConfirm();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const [snapshots, setSnapshots] = useState<UserProgressionSnapshot[]>([]);
  const [progressionLoading, setProgressionLoading] = useState(true);
  const [progressionRange, setProgressionRange] = useState("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const [tableGames, setTableGames] = useState<GameHistoryEntry[]>([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [gamePage, setGamePage] = useState(0);
  const [gameRowsPerPage, setGameRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  const [actionLogs, setActionLogs] = useState<UserActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [tableLogs, setTableLogs] = useState<UserActionLog[]>([]);
  const [tableLogsTotal, setTableLogsTotal] = useState(0);
  const [tableLogsLoading, setTableLogsLoading] = useState(true);
  const [logPage, setLogPage] = useState(0);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);
  const [logActionFilter, setLogActionFilter] = useState("");

  const [tableConns, setTableConns] = useState<ConnectionLog[]>([]);
  const [tableConnsTotal, setTableConnsTotal] = useState(0);
  const [connLoading, setConnLoading] = useState(true);
  const [connPage, setConnPage] = useState(0);
  const [connRowsPerPage, setConnRowsPerPage] = useState(10);
  const [connSuccessFilter, setConnSuccessFilter] = useState("");

  const [logsTab, setLogsTab] = useState(0);
  const [gamesTab, setGamesTab] = useState(0);

  const [allInvites, setAllInvites] = useState<GameInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const invites = useMemo(
    () => allInvites.filter((inv) => user && (inv.from_user_public_id === user.public_id || inv.to_user_public_id === user.public_id)),
    [allInvites, user],
  );

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsPage, setFriendsPage] = useState(0);
  const [friendsRowsPerPage, setFriendsRowsPerPage] = useState(10);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(true);
  const [friendsTab, setFriendsTab] = useState(0);

  const fetchProgression = useCallback((userId: string, range: string) => {
    const startDate = rangeToStartDate(range);
    setProgressionLoading(true);
    usersService.getUserProgression(userId, {
      limit: 500,
      ...(startDate && { start_date: startDate }),
    }).then((res) => setSnapshots(res.data)).catch(() => {}).finally(() => setProgressionLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProgression(id, progressionRange);
  }, [id, progressionRange, fetchProgression, refreshKey]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    usersService.getUserById(id).then(setUser).catch(() => setError("Failed to load user")).finally(() => setLoading(false));

    setGamesLoading(true);
    gamesService.getUserGameHistory(id, { limit: 500 }).then((res) => setGameHistory(res.data)).catch(() => {}).finally(() => setGamesLoading(false));

    setLogsLoading(true);
    logsService.getUserActionLogs(id, { limit: 500 }).then((res) => setActionLogs(res.data)).catch(() => {}).finally(() => setLogsLoading(false));

    setInvitesLoading(true);
    gamesService.listInvites({ limit: 500 }).then((res) => {
      setAllInvites(res.data);
    }).catch(() => {}).finally(() => setInvitesLoading(false));

    setFriendsLoading(true);
    friendsService.getFriendsForUser(id, 1, 200).then((res) => setFriends(res.data)).catch(() => {}).finally(() => setFriendsLoading(false));

    setFriendRequestsLoading(true);
    friendsService.getFriendRequestsForUser(id, { limit: 200 }).then((res) => setFriendRequests(res.data)).catch(() => {}).finally(() => setFriendRequestsLoading(false));
  }, [id, refreshKey]);

  useEffect(() => {
    if (!id) return;
    setTableLoading(true);
    gamesService.getUserGameHistory(id, {
      page: gamePage + 1,
      limit: gameRowsPerPage,
      status: statusFilter || undefined,
      mode: modeFilter || undefined,
    }).then((res) => {
      setTableGames(res.data);
      setTableTotal(res.total_count ?? 0);
    }).catch(() => {}).finally(() => setTableLoading(false));
  }, [id, gamePage, gameRowsPerPage, statusFilter, modeFilter]);

  useEffect(() => {
    if (!id) return;
    setTableLogsLoading(true);
    logsService.getUserActionLogs(id, {
      page: logPage + 1,
      limit: logRowsPerPage,
      action: logActionFilter || undefined,
    }).then((res) => {
      setTableLogs(res.data);
      setTableLogsTotal(res.total_count ?? 0);
    }).catch(() => {}).finally(() => setTableLogsLoading(false));
  }, [id, logPage, logRowsPerPage, logActionFilter]);

  useEffect(() => {
    if (!id) return;
    setConnLoading(true);
    logsService.getUserConnectionLogs(id, {
      page: connPage + 1,
      limit: connRowsPerPage,
      success: connSuccessFilter || undefined,
    }).then((res) => {
      setTableConns(res.data);
      setTableConnsTotal(res.total_count ?? 0);
    }).catch(() => {}).finally(() => setConnLoading(false));
  }, [id, connPage, connRowsPerPage, connSuccessFilter]);

  const stats = user?.game_stats;
  const winRate = stats && stats.total_games > 0 ? Math.round((stats.games_won / stats.total_games) * 100) : 0;

  const cardSx = isMobile ? {} : {
    backgroundColor: "background.paper",
    borderRadius: `${theme.shape.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
  };

  const pagedFriends = friends.slice(friendsPage * friendsRowsPerPage, friendsPage * friendsRowsPerPage + friendsRowsPerPage);
  const receivedRequests = friendRequests.filter((r) => r.to_user_id === id);
  const sentRequests = friendRequests.filter((r) => r.from_user_id === id);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minHeight: 0 }}>

      <Box sx={{ display: "flex", alignItems: "stretch", gap: 1 }}>
        <Box sx={{ ...cardSx, flexGrow: 1 }}>
          <Container maxWidth="xl">
            <Box sx={{ py: 1.25 }}>
              <Breadcrumbs>
                <Link underline="hover" color="text.secondary" variant="body2" onClick={() => navigate("/users")} sx={{ cursor: "pointer" }}>
                  Users
                </Link>
                <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ fontFamily: "monospace" }}>
                  {id}
                </Typography>
              </Breadcrumbs>
            </Box>
          </Container>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={() => setRefreshKey((k) => k + 1)}
            sx={{ ...cardSx, px: 2, flexShrink: 0 }}
          >
            <ArrowSync20Regular style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <PageContainer>
        {error ? (
          <Box sx={{ py: 8, textAlign: "center" }}><Typography color="error">{error}</Typography></Box>
        ) : (
          <Stack spacing={3}>

            <Grid2 container spacing={3}>

              <Grid2 size={{ xs: 12, md: 3 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, height: "100%" }}>
                  <Stack spacing={2.5}>
                    <Stack spacing={1.5} alignItems="flex-start">
                      {loading ? <Skeleton variant="circular" width={72} height={72} /> : (
                        <Avatar src={user?.has_avatar ? usersService.getAvatarUrl(user.id) : undefined} sx={{ width: 72, height: 72, fontSize: "1.8rem", bgcolor: "primary.main", color: "primary.contrastText" }}>
                          {user?.username[0]?.toUpperCase()}
                        </Avatar>
                      )}
                      <Box>
                        {loading ? (
                          <><Skeleton variant="text" width={120} sx={{ fontSize: "1rem" }} /><Skeleton variant="text" width={160} sx={{ fontSize: "0.85rem" }} /></>
                        ) : (
                          <>
                            <Typography variant="subtitle1" fontWeight={700}>{user?.username}</Typography>
                            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                            <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }} flexWrap="wrap">
                              <StatusChip status={user!.account_status} />
                              <RoleChip role={user!.role} />
                            </Stack>
                          </>
                        )}
                      </Box>
                      {user && !loading && (
                        <>
                          {user.is_online && (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
                              <Typography variant="caption" color="primary.main" fontWeight={500}>Online</Typography>
                            </Stack>
                          )}
                          {user.current_game_id && <Chip label="In game" color="primary" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />}
                          {user.bio && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: "0.8rem" }}>"{user.bio}"</Typography>}
                        </>
                      )}
                    </Stack>

                    <Divider />

                    <Stack spacing={1.5}>
                      <SectionLabel>Identifiers</SectionLabel>
                      <Box>
                        <Typography variant="caption" color="text.disabled">Public ID</Typography>
                        {loading ? <Skeleton variant="text" width="100%" sx={{ fontSize: "0.78rem" }} /> : (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", wordBreak: "break-all", flexGrow: 1 }}>{user?.public_id}</Typography>
                            {user?.public_id && <CopyButton value={user.public_id} />}
                            <Tooltip title="Regenerate Public ID" placement="top">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: "Regenerate Public ID",
                                    description: `Generate a new Public ID for ${user?.username ?? "this user"}. The current Public ID will no longer be valid.`,
                                    confirmText: "Regenerate",
                                    danger: true,
                                  });
                                  if (!ok) return;
                                  try {
                                    const updated = await usersService.regeneratePublicId(id!);
                                    setUser(updated);
                                    enqueueSnackbar("Public ID regenerated successfully", { variant: "success" });
                                  } catch (err) {
                                    enqueueSnackbar(err instanceof Error ? err.message : "Failed to regenerate Public ID", { variant: "error" });
                                  }
                                }}
                                sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "warning.main" } }}
                              >
                                <ArrowReset20Regular style={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled">Private ID</Typography>
                        {loading ? <Skeleton variant="text" width="100%" sx={{ fontSize: "0.78rem" }} /> : (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary", wordBreak: "break-all", flexGrow: 1 }}>{user?.id}</Typography>
                            {user?.id && <CopyButton value={user.id} />}
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack spacing={1.5}>
                      <SectionLabel>Dates</SectionLabel>
                      {[
                        { label: "Joined", value: user?.created_at ? formatDate(user.created_at) : undefined },
                        { label: "Last seen", value: user?.last_seen_at ? formatDateTime(user.last_seen_at) : "—" },
                        { label: "Updated", value: user?.updated_at ? formatDate(user.updated_at) : undefined },
                      ].map(({ label, value }) => (
                        <Box key={label}>
                          <Typography variant="caption" color="text.disabled">{label}</Typography>
                          {loading ? <Skeleton variant="text" width={90} sx={{ fontSize: "0.85rem" }} /> : <Typography variant="body2" color="text.secondary">{value}</Typography>}
                        </Box>
                      ))}
                    </Stack>

                    <Divider />

                    <Box>
                      <SectionLabel>Language</SectionLabel>
                      <Box sx={{ mt: 0.75 }}>
                        {loading ? <Skeleton variant="rounded" width={36} height={22} /> : <Chip label={user?.language?.toUpperCase()} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.72rem" }} />}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 9 }}>
                <Stack spacing={3}>
                  <Grid2 container spacing={2}>
                    {[
                      { label: "Total games", value: loading ? null : (stats?.total_games ?? 0) },
                      { label: "Win rate", value: loading ? null : `${winRate}%`, sub: stats ? `${stats.games_won}W · ${stats.games_lost}L · ${stats.games_drawn}D` : undefined },
                      { label: "Avg score", value: loading ? null : (stats?.average_score != null ? stats.average_score.toFixed(0) : "—"), sub: stats?.total_score != null ? `${stats.total_score.toLocaleString()} total` : undefined },
                      { label: "Play time", value: loading ? null : (stats?.play_time != null ? formatPlayTime(stats.play_time) : "—") },
                      { label: "Day streak", value: loading ? null : (stats?.day_streak ?? 0), sub: stats ? `Best: ${stats.best_day_streak}` : undefined },
                      { label: "ELO", value: loading ? null : (user?.elo_rating ?? 1000), sub: user ? `${user.elo_games_played} ranked games` : undefined },
                    ].map(({ label, value, sub }) => (
                      <Grid2 key={label} size={{ xs: 6, sm: 4 }}>
                        <StatCard label={label} value={value ?? ""} sub={sub} loading={loading} />
                      </Grid2>
                    ))}
                  </Grid2>

                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                    <SectionLabel>Progression</SectionLabel>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                      {[
                        { label: "Level", value: user?.level },
                        { label: "Rank", value: user?.rank },
                        { label: "Experience", value: user?.experience != null ? `${user.experience.toLocaleString()} XP` : "—" },
                      ].map(({ label, value }) => (
                        <Grid2 key={label} size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.disabled">{label}</Typography>
                          {loading ? <Skeleton variant="text" width={60} /> : <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 0.25 }}>{value ?? "—"}</Typography>}
                        </Grid2>
                      ))}
                    </Grid2>
                  </Paper>

                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Box sx={{ color: "text.disabled", fontSize: 16, display: "flex" }}><LockClosed20Regular /></Box>
                      <SectionLabel>Privacy settings</SectionLabel>
                    </Stack>
                    {loading ? (
                      <Stack spacing={1}>{[1,2,3,4].map((i) => <Skeleton key={i} variant="text" width="100%" sx={{ fontSize: "1rem" }} />)}</Stack>
                    ) : user && (
                      <Box>
                        {[
                          { label: "Public profile", value: user.is_profile_public },
                          { label: "Show online status", value: user.show_online_status },
                          { label: "Allow friend requests", value: user.allow_friend_requests },
                          { label: "Allow party invites", value: user.allow_party_invites },
                        ].map(({ label, value }, i, arr) => (
                          <Box key={label}>
                            <PrivacyRow label={label} value={value} />
                            {i < arr.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Stack>
              </Grid2>
            </Grid2>

            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                  <SectionLabel>Win / Loss / Draw</SectionLabel>
                  <Box sx={{ mt: 1 }}>
                    {loading ? <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} /> : (
                      <WLDPieChart won={stats?.games_won ?? 0} lost={stats?.games_lost ?? 0} drawn={stats?.games_drawn ?? 0} />
                    )}
                  </Box>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                  <SectionLabel>Score trend</SectionLabel>
                  <Box sx={{ mt: 1 }}>
                    {gamesLoading ? <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} /> : <ScoreTrendChart history={gameHistory} />}
                  </Box>
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                  <SectionLabel>Top actions</SectionLabel>
                  <Box sx={{ mt: 1 }}>
                    {logsLoading ? <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} /> : <ActionTypesChart logs={actionLogs} />}
                  </Box>
                </Paper>
              </Grid2>
            </Grid2>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <SectionLabel>Progression</SectionLabel>
              <TimeRangeSelector
                value={progressionRange}
                onChange={setProgressionRange}
                options={["7d", "30d", "90d", "1y", "all"]}
              />
            </Stack>

            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                    <SectionLabel>ELO progression</SectionLabel>
                    {!loading && user && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                        current: {user.elo_rating}
                      </Typography>
                    )}
                  </Stack>
                  {progressionLoading ? (
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                  ) : (
                    <EloProgressionChart snapshots={snapshots} />
                  )}
                </Paper>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                    <SectionLabel>XP progression</SectionLabel>
                    {!loading && user && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                        total: {user.experience.toLocaleString()} XP
                      </Typography>
                    )}
                  </Stack>
                  {progressionLoading ? (
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                  ) : (
                    <XpProgressionChart snapshots={snapshots} />
                  )}
                </Paper>
              </Grid2>
            </Grid2>

            {id && (
              <Grid2 container spacing={3} alignItems="stretch">
                <Grid2 size={{ xs: 12, md: 8 }}>
                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, height: "100%" }}>
                    <SectionLabel>Activity</SectionLabel>
                    <Box sx={{ mt: 2, overflowX: "auto", display: "flex", justifyContent: "center" }}>
                      <UserActivityHeatmap userId={id} />
                    </Box>
                  </Paper>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, height: "100%" }}>
                    <SectionLabel>Action radar</SectionLabel>
                    <Box sx={{ mt: 1 }}>
                      {logsLoading
                        ? <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
                        : <ActionRadarChart logs={actionLogs} />
                      }
                    </Box>
                  </Paper>
                </Grid2>
              </Grid2>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 2.5, pt: 1 }}>
                <StyledTabs value={gamesTab} onChange={(_, v) => setGamesTab(v)}>
                  <StyledTab label={`History${tableTotal > 0 ? ` (${tableTotal})` : ""}`} />
                  <StyledTab label={`Invites${invites.length > 0 ? ` (${invites.length})` : ""}`} />
                </StyledTabs>
              </Box>
              <Divider />

              {gamesTab === 0 && (
                <>
                  <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ flexGrow: 1 }} />
                    <Select size="small" displayEmpty value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setGamePage(0); }} sx={{ fontSize: "0.8rem", height: 28, minWidth: 90 }}>
                      <MenuItem value=""><em>All modes</em></MenuItem>
                      <MenuItem value="solo">Solo</MenuItem>
                      <MenuItem value="1v1">1v1</MenuItem>
                      <MenuItem value="multi">Multi</MenuItem>
                    </Select>
                    <Select size="small" displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setGamePage(0); }} sx={{ fontSize: "0.8rem", height: 28, minWidth: 110 }}>
                      <MenuItem value=""><em>All statuses</em></MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="in_progress">In progress</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="abandoned">Abandoned</MenuItem>
                      <MenuItem value="waiting">Waiting</MenuItem>
                    </Select>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Game</TableCell>
                          <TableCell>Mode</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Score</TableCell>
                          <TableCell align="center">Result</TableCell>
                          <TableCell>Players</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableLoading ? (
                          Array.from({ length: gameRowsPerPage }).map((_, i) => (
                            <TableRow key={i} sx={{ height: 43 }}>
                              {Array.from({ length: 7 }).map((_, j) => (
                                <TableCell key={j}><Skeleton variant="text" width={j === 0 ? 100 : 60} /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : tableGames.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ py: 5, textAlign: "center" }}>
                              <Typography variant="body2" color="text.secondary">No games found</Typography>
                            </TableCell>
                          </TableRow>
                        ) : tableGames.map(({ game, user_score, is_winner, players }) => (
                          <TableRow key={game.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/games/${game.id}`)}>
                            <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{(game.public_id ?? game.id).substring(0, 12)}</Typography></TableCell>
                            <TableCell><GameModeChip mode={game.mode} /></TableCell>
                            <TableCell><GameStatusChip status={game.status} /></TableCell>
                            <TableCell align="right"><Typography variant="body2" fontWeight={600}>{user_score.toLocaleString()}</Typography></TableCell>
                            <TableCell align="center">
                              {game.status === "completed" ? (
                                is_winner
                                  ? <CheckmarkCircle20Regular style={{ fontSize: 18, color: theme.palette.primary.main }} />
                                  : <DismissCircle20Regular style={{ fontSize: 18, color: theme.palette.error.main }} />
                              ) : "—"}
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary">{players.length} player{players.length !== 1 ? "s" : ""}</Typography></TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(game.created_at)}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {tableTotal > gameRowsPerPage && (
                    <TablePagination
                      component="div"
                      count={tableTotal}
                      page={gamePage}
                      rowsPerPage={gameRowsPerPage}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                      onPageChange={(_, p) => setGamePage(p)}
                      onRowsPerPageChange={(e) => { setGameRowsPerPage(Number(e.target.value)); setGamePage(0); }}
                      labelRowsPerPage="Rows:"
                    />
                  )}
                </>
              )}

              {gamesTab === 1 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invite ID</TableCell>
                        <TableCell>Game</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right" sx={{ pr: 2.5 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invitesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} sx={{ height: 43 }}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <TableCell key={j}><Skeleton variant="text" width={j === 0 ? 100 : 70} /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : invites.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 5, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">No invites found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : invites.map((invite) => (
                        <TableRow key={invite.id} hover>
                          <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{invite.id.substring(0, 12)}</Typography></TableCell>
                          <TableCell>
                            {invite.game ? (
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer", color: "primary.main" }}
                                onClick={() => navigate(`/games/${invite.game!.id}`)}
                              >
                                {(invite.game.public_id ?? invite.game.id).substring(0, 12)}
                              </Typography>
                            ) : "—"}
                          </TableCell>
                          <TableCell><Typography variant="body2">{invite.from_user?.username ?? "—"}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{invite.to_user?.username ?? "—"}</Typography></TableCell>
                          <TableCell>
                            <Chip
                              label={invite.status}
                              size="small"
                              color={invite.status === "pending" ? "primary" : invite.status === "accepted" ? "success" : "default"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(invite.created_at)}</Typography></TableCell>
                          <TableCell align="right" sx={{ pr: 2 }}>
                            <Tooltip title="Delete invite">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={async () => {
                                  const ok = await confirm({ title: "Delete invite", description: "This invite will be permanently deleted.", confirmText: "Delete", danger: true });
                                  if (!ok) return;
                                  try {
                                    await gamesService.deleteInvite(invite.id);
                                    setAllInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
                                    enqueueSnackbar("Invite deleted", { variant: "success" });
                                  } catch {
                                    enqueueSnackbar("Failed to delete invite", { variant: "error" });
                                  }
                                }}
                              >
                                <Delete20Regular style={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 2.5, pt: 1 }}>
                <StyledTabs value={friendsTab} onChange={(_, v) => { setFriendsTab(v); setFriendsPage(0); }}>
                  <StyledTab label={`Friends${friends.length ? ` (${friends.length})` : ""}`} />
                  <StyledTab label={`Received${receivedRequests.length ? ` (${receivedRequests.length})` : ""}`} />
                  <StyledTab label={`Sent${sentRequests.length ? ` (${sentRequests.length})` : ""}`} />
                </StyledTabs>
              </Box>
              <Divider />

              {friendsTab === 0 && (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Username</TableCell>
                          <TableCell>Private ID</TableCell>
                          <TableCell>Friends since</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {friendsLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} sx={{ height: 43 }}>
                              <TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Skeleton variant="circular" width={28} height={28} /><Skeleton variant="text" width={120} /></Box></TableCell>
                              <TableCell><Skeleton variant="text" width={100} /></TableCell>
                              <TableCell><Skeleton variant="text" width={80} /></TableCell>
                            </TableRow>
                          ))
                        ) : pagedFriends.length === 0 ? (
                          <TableRow><TableCell colSpan={3} sx={{ py: 5, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No friends yet</Typography></TableCell></TableRow>
                        ) : pagedFriends.map((f) => {
                          const friendId = f.user1_id === id ? f.user2_id : f.user1_id;
                          const friendName = f.user1_id === id ? f.user2_username : f.user1_username;
                          return (
                            <TableRow key={f.id} hover sx={{ cursor: "pointer", height: 43 }} onClick={() => navigate(`/users/${friendId}`)}>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                  <Avatar src={usersService.getAvatarUrl(friendId)} sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main", color: "primary.contrastText" }}>
                                    {friendName[0]?.toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={500}>{friendName}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary" }}>{friendId}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" noWrap>{formatDate(f.created_at)}</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {friends.length > friendsRowsPerPage && (
                    <TablePagination component="div" count={friends.length} page={friendsPage} rowsPerPage={friendsRowsPerPage} rowsPerPageOptions={[10, 20, 50]} onPageChange={(_, p) => setFriendsPage(p)} onRowsPerPageChange={(e) => { setFriendsRowsPerPage(Number(e.target.value)); setFriendsPage(0); }} labelRowsPerPage="Rows:" />
                  )}
                </>
              )}

              {friendsTab === 1 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>From</TableCell>
                        <TableCell>From ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Received</TableCell>
                        <TableCell>Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {friendRequestsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i} sx={{ height: 43 }}>
                            {[120, 200, 60, 80, 80].map((w, j) => <TableCell key={j}><Skeleton variant="text" width={w} /></TableCell>)}
                          </TableRow>
                        ))
                      ) : receivedRequests.length === 0 ? (
                        <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No received requests</Typography></TableCell></TableRow>
                      ) : receivedRequests.map((r) => (
                        <TableRow key={r.id} hover sx={{ cursor: "pointer", height: 43 }} onClick={() => navigate(`/users/${r.from_user_id}`)}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar src={usersService.getAvatarUrl(r.from_user_id)} sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main", color: "primary.contrastText" }}>
                                {r.from_username[0]?.toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>{r.from_username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary" }}>{r.from_user_id}</Typography></TableCell>
                          <TableCell><Chip label={r.status} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} /></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(r.created_at)}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(r.updated_at)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {friendsTab === 2 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>To</TableCell>
                        <TableCell>To ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sent</TableCell>
                        <TableCell>Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {friendRequestsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i} sx={{ height: 43 }}>
                            {[120, 200, 60, 80, 80].map((w, j) => <TableCell key={j}><Skeleton variant="text" width={w} /></TableCell>)}
                          </TableRow>
                        ))
                      ) : sentRequests.length === 0 ? (
                        <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No sent requests</Typography></TableCell></TableRow>
                      ) : sentRequests.map((r) => (
                        <TableRow key={r.id} hover sx={{ cursor: "pointer", height: 43 }} onClick={() => navigate(`/users/${r.to_user_id}`)}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar src={usersService.getAvatarUrl(r.to_user_id)} sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main", color: "primary.contrastText" }}>
                                {r.to_username[0]?.toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>{r.to_username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "text.secondary" }}>{r.to_user_id}</Typography></TableCell>
                          <TableCell><Chip label={r.status} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} /></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(r.created_at)}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDate(r.updated_at)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 2.5, pt: 1, display: "flex", alignItems: "center" }}>
                <StyledTabs value={logsTab} onChange={(_, v) => setLogsTab(v)} sx={{ flexGrow: 1 }}>
                  <StyledTab label={`Action logs${tableLogsTotal ? ` (${tableLogsTotal})` : ""}`} />
                  <StyledTab label={`Connection logs${tableConnsTotal ? ` (${tableConnsTotal})` : ""}`} />
                </StyledTabs>
                {logsTab === 0 && (
                  <Select size="small" displayEmpty value={logActionFilter} onChange={(e) => { setLogActionFilter(e.target.value); setLogPage(0); }} sx={{ minWidth: 150, fontSize: "0.8rem", mb: 0.5 }}>
                    <MenuItem value="" sx={{ fontSize: "0.8rem" }}>All actions</MenuItem>
                    {Array.from(new Set(actionLogs.map((l) => l.Action))).sort().map((a) => (
                      <MenuItem key={a} value={a} sx={{ fontSize: "0.8rem" }}>{a}</MenuItem>
                    ))}
                  </Select>
                )}
                {logsTab === 1 && (
                  <Select size="small" displayEmpty value={connSuccessFilter} onChange={(e) => { setConnSuccessFilter(e.target.value); setConnPage(0); }} sx={{ minWidth: 150, fontSize: "0.8rem", mb: 0.5 }}>
                    <MenuItem value="" sx={{ fontSize: "0.8rem" }}>All</MenuItem>
                    <MenuItem value="true" sx={{ fontSize: "0.8rem" }}>Success only</MenuItem>
                    <MenuItem value="false" sx={{ fontSize: "0.8rem" }}>Failed only</MenuItem>
                  </Select>
                )}
              </Box>
              <Divider />

              {logsTab === 0 && (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Action</TableCell>
                          <TableCell>Resource</TableCell>
                          <TableCell>IP</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableLogsLoading ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} sx={{ height: 43 }}>
                            {[120, 90, 100, 40, 80].map((w, j) => <TableCell key={j}><Skeleton variant="text" width={w} /></TableCell>)}
                          </TableRow>
                        )) : tableLogs.length === 0 ? (
                          <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No logs</Typography></TableCell></TableRow>
                        ) : tableLogs.map((log) => (
                          <TableRow key={log.ID} sx={{ height: 43 }}>
                            <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{log.Action}</Typography></TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary">{log.Resource}{log.ResourceID ? ` / ${log.ResourceID.substring(0, 8)}` : ""}</Typography></TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{log.IPAddress ?? "—"}</Typography></TableCell>
                            <TableCell align="center">
                              {log.IsSuccess
                                ? <CheckmarkCircle20Regular style={{ fontSize: 16, color: theme.palette.primary.main }} />
                                : <DismissCircle20Regular style={{ fontSize: 16, color: theme.palette.error.main }} />}
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDateTime(log.CreatedAt)}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination component="div" count={tableLogsTotal} page={logPage} rowsPerPage={logRowsPerPage} rowsPerPageOptions={[10, 20, 50]} onPageChange={(_, p) => setLogPage(p)} onRowsPerPageChange={(e) => { setLogRowsPerPage(Number(e.target.value)); setLogPage(0); }} labelRowsPerPage="Rows:" />
                </>
              )}

              {logsTab === 1 && (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>IP Address</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>User Agent</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {connLoading ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i} sx={{ height: 43 }}>
                            {[100, 40, 80, 160, 80].map((w, j) => <TableCell key={j}><Skeleton variant="text" width={w} /></TableCell>)}
                          </TableRow>
                        )) : tableConns.length === 0 ? (
                          <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: "center" }}><Typography variant="body2" color="text.secondary">No connection logs</Typography></TableCell></TableRow>
                        ) : tableConns.map((log) => (
                          <TableRow key={log.id} sx={{ height: 43 }}>
                            <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{log.ip_address}</Typography></TableCell>
                            <TableCell align="center">
                              {log.is_success
                                ? <CheckmarkCircle20Regular style={{ fontSize: 16, color: theme.palette.primary.main }} />
                                : <DismissCircle20Regular style={{ fontSize: 16, color: theme.palette.error.main }} />}
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary">{log.failure_reason ?? "—"}</Typography></TableCell>
                            <TableCell>
                              <Tooltip title={log.user_agent ?? ""}>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{log.user_agent ?? "—"}</Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" noWrap>{formatDateTime(log.created_at)}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination component="div" count={tableConnsTotal} page={connPage} rowsPerPage={connRowsPerPage} rowsPerPageOptions={[10, 20, 50]} onPageChange={(_, p) => setConnPage(p)} onRowsPerPageChange={(e) => { setConnRowsPerPage(Number(e.target.value)); setConnPage(0); }} labelRowsPerPage="Rows:" />
                </>
              )}
            </Paper>

          </Stack>
        )}
      </PageContainer>
    </Box>
  );
}
