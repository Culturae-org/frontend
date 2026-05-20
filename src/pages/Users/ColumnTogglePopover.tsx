import {
  Checkbox,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ColumnKey } from "./UserRow";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export const OPTIONAL_COLUMN_KEYS: ColumnKey[] = [
  "private_id",
  "public_id",
  "level",
  "rank",
  "experience",
  "elo_games",
  "is_online",
  "last_seen",
  "language",
  "total_games",
  "win_rate",
  "day_streak",
  "current_game",
  "updated_at",
];

interface ColumnTogglePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleOptional: Set<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
}

const COLUMN_LABEL_KEYS: Record<ColumnKey, string> = {
  private_id: "users.table.headers.privateId",
  public_id: "users.table.headers.publicId",
  level: "users.table.headers.level",
  rank: "users.table.headers.rank",
  experience: "users.table.headers.xp",
  elo_games: "users.table.headers.eloGames",
  is_online: "users.table.headers.online",
  last_seen: "users.table.headers.lastSeen",
  language: "users.table.headers.language",
  total_games: "users.table.headers.games",
  win_rate: "users.table.headers.winRate",
  day_streak: "users.table.headers.streak",
  current_game: "users.table.headers.currentGame",
  updated_at: "users.table.headers.updated",
  email: "users.table.headers.email",
  role: "users.table.headers.role",
  status: "users.table.headers.status",
  elo: "users.table.headers.elo",
  created_at: "users.table.headers.created",
};

export default function ColumnTogglePopover({
  anchorEl,
  open,
  onClose,
  visibleOptional,
  onToggle,
}: ColumnTogglePopoverProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 220, maxWidth: "100%" } } }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {t("users.columns.title")}
      </Typography>
      <Stack spacing={0.25}>
        {OPTIONAL_COLUMN_KEYS.map((key) => (
          <SmallFormControlLabel
            key={key}
            control={
              <Checkbox
                disableRipple
                size="small"
                checked={visibleOptional.has(key)}
                onChange={() => onToggle(key)}
              />
            }
            label={t(COLUMN_LABEL_KEYS[key])}
          />
        ))}
      </Stack>
    </Popover>
  );
}
