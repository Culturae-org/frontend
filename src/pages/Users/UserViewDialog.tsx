import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Checkmark20Regular, Copy20Regular, Dismiss24Regular, Edit24Regular, CalendarLtr24Regular, Open24Regular } from "@fluentui/react-icons";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AdminUser } from "@/lib/types/user.types";
import { StatusChip, RoleChip } from "./UserRow";
import { usersService } from "@/lib/services/users.service";
import UserActivityHeatmap from "./UserActivityHeatmap";

interface UserViewDialogProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (user: AdminUser) => void;
  initialActivity?: boolean;
  onToggleActivity?: (active: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}

function TextValue({ value }: { value: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {value ?? "—"}
    </Typography>
  );
}

function CopyButton({ value }: { value: string }) {
  const { t } = useTranslation("dashboard");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Tooltip title={copied ? t("users.copied") : t("users.copy")} placement="top">
      <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "text.secondary" } }}>
        {copied ? <Checkmark20Regular style={{ fontSize: 14 }} /> : <Copy20Regular style={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  );
}

function IdField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: "monospace", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1, minWidth: 0 }}
        >
          {value}
        </Typography>
        <CopyButton value={value} />
      </Stack>
    </Field>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Grid2 size={12} sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        color="text.disabled"
        fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}
      >
        {children}
      </Typography>
      <Divider sx={{ mt: 0.5 }} />
    </Grid2>
  );
}

export default function UserViewDialog({ user, open, onClose, onEdit, initialActivity = false, onToggleActivity }: UserViewDialogProps) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const [showActivity, setShowActivity] = useState(initialActivity);

  useEffect(() => { setShowActivity(initialActivity); }, [open, initialActivity]);
  if (!user) return null;

  const isBanned = user.account_status === "manual_banned" || user.account_status === "sys_banned";
  const winRate =
    user.game_stats && user.game_stats.total_games > 0
      ? `${Math.round((user.game_stats.games_won / user.game_stats.total_games) * 100)}%`
      : "—";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}
      >
        <Typography component="span" variant="subtitle1" fontWeight={600}>{t("users.view.title")}</Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Open full page">
            <IconButton size="small" onClick={() => { onClose(); navigate(`/users/${user.id}`); }}>
              <Open24Regular />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("users.view.activity")}>
            <IconButton size="small" onClick={() => { const next = !showActivity; setShowActivity(next); onToggleActivity?.(next); }} color={showActivity ? "primary" : "default"}>
              <CalendarLtr24Regular />
            </IconButton>
          </Tooltip>
          {onEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => { onClose(); onEdit(user); }}>
                <Edit24Regular />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose}>
            <Dismiss24Regular />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Stack direction={{ xs: "column", md: "row" }}>
          {!showActivity && <Box
            sx={{
              p: 3,
              minWidth: 220,
              width: { md: 220 },
              flexShrink: 0,
              borderRight: { md: "1px solid" },
              borderColor: { md: "divider" },
              borderBottom: { xs: "1px solid", md: "none" },
              borderBottomColor: { xs: "divider" },
            }}
          >
            <Stack spacing={2.5}>
              <Stack spacing={1} alignItems="flex-start">
                <Avatar
                  src={user.has_avatar ? usersService.getAvatarUrl(user.id) : undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: "2rem",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  {user.username[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  <RoleChip role={user.role} />
                  <StatusChip status={user.account_status} />
                </Stack>
                {user.is_online && (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
                    <Typography variant="caption" color="primary.main">Online</Typography>
                  </Stack>
                )}
                {user.current_game_id && (
                  <Chip label="In game" color="info" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <IdField label={t("users.view.fields.privateId")} value={user.id} />
                <IdField label={t("users.view.fields.publicId")} value={user.public_id} />
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Field label={t("users.view.fields.createdAt")}>
                  <TextValue value={new Date(user.created_at).toLocaleString()} />
                </Field>
                <Field label={t("users.view.fields.lastSeen")}>
                  <TextValue value={user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : undefined} />
                </Field>
                <Field label={t("users.view.fields.updatedAt")}>
                  <TextValue value={new Date(user.updated_at).toLocaleString()} />
                </Field>
              </Stack>
            </Stack>
          </Box>}

          <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", maxHeight: { md: "75vh" } }}>
            {showActivity ? (
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center" }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem", mb: 1.5 }}>
                  {t("users.view.sections.activity")}
                </Typography>
                <UserActivityHeatmap userId={user.id} />
              </Box>
            ) : (
              <Grid2 container spacing={2}>

                <SectionHeader>{t("users.view.sections.account")}</SectionHeader>
                <Grid2 size={4}>
                  <Field label={t("users.view.fields.status")}><StatusChip status={user.account_status} /></Field>
                </Grid2>
                <Grid2 size={4}>
                  <Field label={t("users.view.fields.role")}><RoleChip role={user.role} /></Field>
                </Grid2>
                <Grid2 size={4}>
                  <Field label={t("users.view.fields.language")}><TextValue value={user.language.toUpperCase()} /></Field>
                </Grid2>
                {user.bio && (
                  <Grid2 size={12}>
                    <Field label={t("users.view.fields.bio")}><TextValue value={user.bio} /></Field>
                  </Grid2>
                )}

                {isBanned && (
                  <>
                    <SectionHeader>{t("users.view.sections.ban")}</SectionHeader>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <Field label={t("users.view.fields.bannedUntil")}>
                        <TextValue value={user.banned_until ? new Date(user.banned_until).toLocaleString() : t("users.view.fields.permanent")} />
                      </Field>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <Field label={t("users.view.fields.reason")}><TextValue value={user.ban_reason} /></Field>
                    </Grid2>
                  </>
                )}

                <SectionHeader>{t("users.view.sections.progression")}</SectionHeader>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Field label={t("users.view.fields.level")}><TextValue value={user.level} /></Field>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Field label={t("users.view.fields.rank")}><TextValue value={user.rank} /></Field>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Field label={t("users.view.fields.experience")}><TextValue value={user.experience.toLocaleString()} /></Field>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Field label={t("users.view.fields.eloRating")}><TextValue value={user.elo_rating} /></Field>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Field label={t("users.view.fields.eloGames")}><TextValue value={user.elo_games_played} /></Field>
                </Grid2>

                {user.game_stats && (
                  <>
                    <SectionHeader>{t("users.view.sections.gameStats")}</SectionHeader>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.totalGames")}><TextValue value={user.game_stats.total_games} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.winRate")}><TextValue value={winRate} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.won")}><TextValue value={user.game_stats.games_won} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.lost")}><TextValue value={user.game_stats.games_lost} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.drawn")}><TextValue value={user.game_stats.games_drawn} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.dayStreak")}><TextValue value={user.game_stats.day_streak} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.bestStreak")}><TextValue value={user.game_stats.best_day_streak} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.avgScore")}><TextValue value={user.game_stats.average_score.toFixed(1)} /></Field>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 3 }}>
                      <Field label={t("users.view.fields.totalScore")}><TextValue value={user.game_stats.total_score.toLocaleString()} /></Field>
                    </Grid2>
                  </>
                )}

                <SectionHeader>{t("users.view.sections.privacy")}</SectionHeader>
                {([
                  [t("users.view.fields.publicProfile"), user.is_profile_public],
                  [t("users.view.fields.showOnlineStatus"), user.show_online_status],
                  [t("users.view.fields.allowFriendRequests"), user.allow_friend_requests],
                  [t("users.view.fields.allowPartyInvites"), user.allow_party_invites],
                ] as [string, boolean][]).map(([label, val]) => (
                  <Grid2 key={label} size={{ xs: 6, sm: 3 }}>
                    <Field label={label}>
                      <Typography variant="body2" color={val ? "primary.main" : "text.disabled"} fontWeight={500}>
                        {val ? t("users.yes") : t("users.no")}
                      </Typography>
                    </Field>
                  </Grid2>
                ))}

              </Grid2>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
