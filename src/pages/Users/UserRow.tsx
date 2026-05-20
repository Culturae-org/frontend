import {
  Avatar,
  Box,
  Skeleton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  Delete20Regular,
  Edit20Regular,
  Open20Regular,
  ProhibitedMultiple20Regular,
  CheckmarkCircle20Regular,
  Sleep20Regular,
  ArrowReset20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AdminUser } from "@/lib/types/user.types";
import { usersService } from "@/lib/services/users.service";
import { SquareChip, NoWrapTypography } from "@/components/Common/StyledComponents";
import { RowActionMenu } from "@/components/Common/RowActionMenu";

export type ColumnKey =
  | "email"
  | "role"
  | "status"
  | "elo"
  | "created_at"
  | "level"
  | "rank"
  | "experience"
  | "elo_games"
  | "is_online"
  | "last_seen"
  | "language"
  | "total_games"
  | "win_rate"
  | "day_streak"
  | "current_game"
  | "updated_at"
  | "private_id"
  | "public_id";

interface UserRowProps {
  user?: AdminUser;
  loading?: boolean;
  visibleColumns: Set<ColumnKey>;
  onView?: (user: AdminUser) => void;
  onEdit?: (user: AdminUser) => void;
  onDelete?: (id: string) => void;
  onBan?: (user: AdminUser) => void;
  onUnban?: (user: AdminUser) => void;
  onDeactivate?: (user: AdminUser) => void;
  onReactivate?: (user: AdminUser) => void;
}

export function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "primary" | "error" | "warning" | "default"> = {
    active: "primary",
    banned: "error",
    suspended: "error",
    inactive: "warning",
    deleted: "default",
  };
  const labelKeyMap: Record<string, string> = {
    active: "users.status.active",
    banned: "users.status.banned",
    suspended: "users.status.suspended",
    inactive: "users.status.inactive",
    deleted: "users.status.deleted",
  };
  const color = colorMap[status] ?? "default";
  const label = labelKeyMap[status] ? t(labelKeyMap[status]) : status;
  return (
    <SquareChip 
      label={label} 
      color={color} 
      size="small" 
      sx={{ height: 20, fontSize: "0.75rem" }} 
    />
  );
}

export function RoleChip({ role }: { role: string }) {
  const { t } = useTranslation("dashboard");
  const colorMap: Record<string, "primary" | "secondary" | "default"> = {
    administrator: "primary",
    moderator: "secondary",
    user: "default",
  };
  const labelKeyMap: Record<string, string> = {
    administrator: "users.role.administrator",
    moderator: "users.role.moderator",
    user: "users.role.user",
  };
  const label = labelKeyMap[role] ? t(labelKeyMap[role]) : role;
  return (
    <SquareChip
      label={label}
      color={colorMap[role] ?? "default"}
      size="small"
      variant="outlined"
      sx={{ height: 20, fontSize: "0.75rem" }}
    />
  );
}

function cellFor(col: ColumnKey, user: AdminUser, t: (key: string) => string, formatDateOnly: (d: string | Date | null | undefined) => string) {
  const sx = { fontSize: "0.875rem", whiteSpace: "nowrap" as const };
  const sxSecondary = { fontSize: "0.875rem", color: "text.secondary", whiteSpace: "nowrap" as const };

  switch (col) {
    case "email":
      return (
        <TableCell key={col} sx={sxSecondary}>
          <NoWrapTypography variant="inherit">{user.email}</NoWrapTypography>
        </TableCell>
      );
    case "role":
      return (
        <TableCell key={col}>
          <RoleChip role={user.role} />
        </TableCell>
      );
    case "status":
      return (
        <TableCell key={col}>
          <StatusChip status={user.account_status} />
        </TableCell>
      );
    case "elo":
      return <TableCell key={col} sx={sx}>{user.elo_rating}</TableCell>;
    case "created_at":
      return (
        <TableCell key={col} sx={sxSecondary}>
          {formatDateOnly(user.created_at)}
        </TableCell>
      );
    case "level":
      return <TableCell key={col} sx={sx}>{user.level}</TableCell>;
    case "rank":
      return (
        <TableCell key={col} sx={sx}>
          <NoWrapTypography variant="inherit">{user.rank}</NoWrapTypography>
        </TableCell>
      );
    case "experience":
      return <TableCell key={col} sx={sx}>{user.experience.toLocaleString()}</TableCell>;
    case "elo_games":
      return <TableCell key={col} sx={sx}>{user.elo_games_played}</TableCell>;
    case "is_online":
      return (
        <TableCell key={col}>
          <Tooltip title={user.is_online ? t("users.online") : t("users.offline")}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: "50%", 
                bgcolor: user.is_online ? "success.main" : "text.disabled" 
              }} 
            />
          </Tooltip>
        </TableCell>
      );
    case "last_seen":
      return (
        <TableCell key={col} sx={sxSecondary}>
          {formatDateOnly(user.last_seen_at)}
        </TableCell>
      );
    case "language":
      return (
        <TableCell key={col} sx={sx}>
          <SquareChip 
            label={user.language.toUpperCase()} 
            size="small" 
            variant="outlined"
            sx={{ height: 20, fontSize: "0.75rem" }}
          />
        </TableCell>
      );
    case "total_games":
      return <TableCell key={col} sx={sx}>{user.game_stats?.total_games ?? "—"}</TableCell>;
    case "win_rate":
      return (
        <TableCell key={col} sx={sx}>
          {user.game_stats && user.game_stats.total_games > 0
            ? `${Math.round((user.game_stats.games_won / user.game_stats.total_games) * 100)}%`
            : "—"}
        </TableCell>
      );
    case "day_streak":
      return <TableCell key={col} sx={sx}>{user.game_stats?.day_streak ?? "—"}</TableCell>;
    case "current_game":
      return (
        <TableCell key={col} sx={sx}>
          {user.current_game_id ? (
            <SquareChip 
              label={t("users.inGame")} 
              color="info" 
              size="small" 
              sx={{ height: 20, fontSize: "0.75rem" }} 
            />
          ) : "—"}
        </TableCell>
      );
    case "updated_at":
      return (
        <TableCell key={col} sx={sxSecondary}>
          {formatDateOnly(user.updated_at)}
        </TableCell>
      );
    case "private_id":
      return (
        <TableCell key={col} sx={{ fontSize: "0.78rem", fontFamily: "monospace", color: "text.secondary" }}>
          <NoWrapTypography variant="inherit">{user.id.substring(0, 8)}…</NoWrapTypography>
        </TableCell>
      );
    case "public_id":
      return (
        <TableCell key={col} sx={{ fontSize: "0.78rem", fontFamily: "monospace", color: "text.secondary" }}>
          <NoWrapTypography variant="inherit">{user.public_id.substring(0, 8)}…</NoWrapTypography>
        </TableCell>
      );
    default:
      return <TableCell key={col} />;
  }
}

export default function UserRow({
  user,
  loading,
  visibleColumns,
  onView,
  onEdit,
  onDelete,
  onBan,
  onUnban,
  onDeactivate,
  onReactivate,
}: UserRowProps) {
  const { t } = useTranslation("dashboard");
  const { formatDateOnly } = useDateFormat();
  const navigate = useNavigate();

  if (loading) {
    return (
      <TableRow sx={{ height: 43 }}>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={120} />
          </Box>
        </TableCell>
        {Array.from(visibleColumns).map((col) => (
          <TableCell key={col}>
            {col === "is_online"
              ? <Skeleton variant="circular" width={8} height={8} />
              : col === "role" || col === "status" || col === "current_game"
              ? <Skeleton variant="rounded" width={60} height={20} />
              : <Skeleton variant="text" width={80} />}
          </TableCell>
        ))}
        <TableCell />
      </TableRow>
    );
  }

  if (!user) return null;

  return (
    <TableRow
      hover
      sx={{ cursor: "pointer", height: 43 }}
      onClick={() => onView?.(user)}
    >
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={user.has_avatar ? usersService.getAvatarUrl(user.id) : undefined}
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.75rem",
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              {user.username[0]?.toUpperCase()}
            </Avatar>
            {user.is_online && (
              <Box sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "success.main",
                border: "1.5px solid",
                borderColor: "background.paper",
              }} />
            )}
          </Box>
          <NoWrapTypography variant="body2" sx={{ fontWeight: 500 }}>
            {user.username}
          </NoWrapTypography>
          {user.account_status !== "active" && <StatusChip status={user.account_status} />}
        </Box>
      </TableCell>

      {Array.from(visibleColumns).map((col) => cellFor(col, user, t, formatDateOnly))}

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <RowActionMenu
          actions={[
            {
              label: t("users.actions.viewDetails"),
              icon: <Open20Regular />,
              onClick: () => navigate(`/users/${user.id}`),
            },
            {
              label: t("users.actions.edit"),
              icon: <Edit20Regular />,
              onClick: () => onEdit?.(user),
            },
            ...(user.account_status === "active" ? [
              {
                label: t("users.actions.deactivate"),
                icon: <Sleep20Regular />,
                onClick: () => onDeactivate?.(user),
                danger: true,
              },
              {
                label: t("users.actions.ban"),
                icon: <ProhibitedMultiple20Regular />,
                onClick: () => onBan?.(user),
                danger: true,
              },
            ] : []),
            ...(user.account_status === "inactive" ? [
              {
                label: t("users.actions.reactivate"),
                icon: <ArrowReset20Regular />,
                onClick: () => onReactivate?.(user),
              },
              {
                label: t("users.actions.ban"),
                icon: <ProhibitedMultiple20Regular />,
                onClick: () => onBan?.(user),
                danger: true,
              },
            ] : []),
            ...(user.account_status === "banned" || user.account_status === "suspended" ? [
              {
                label: t("users.actions.unban"),
                icon: <CheckmarkCircle20Regular />,
                onClick: () => onUnban?.(user),
              },
            ] : []),
            {
              label: t("users.actions.delete"),
              icon: <Delete20Regular />,
              onClick: () => onDelete?.(user.id),
              danger: true,
            },
          ]}
        />
      </TableCell>
    </TableRow>
  );
}
