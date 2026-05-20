import { Checkbox, Popover, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export type GameColumnKey =
  | "players"
  | "questions"
  | "category"
  | "language"
  | "flag_variant"
  | "created_at"
  | "started_at"
  | "completed_at"
  | "duration"
  | "public_id";

export const OPTIONAL_GAME_COLUMNS: GameColumnKey[] = [
  "questions",
  "language",
  "flag_variant",
  "started_at",
  "completed_at",
  "duration",
  "public_id",
];

interface GameColumnTogglePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visible: Set<GameColumnKey>;
  onToggle: (key: GameColumnKey) => void;
}

const COLUMN_I18N_KEYS: Record<GameColumnKey, string> = {
  players: "games.columns.players",
  questions: "games.columns.questions",
  category: "games.columns.category",
  language: "games.columns.language",
  flag_variant: "games.columns.flagVariant",
  created_at: "games.columns.createdAt",
  started_at: "games.columns.startedAt",
  completed_at: "games.columns.completedAt",
  duration: "games.columns.duration",
  public_id: "games.columns.publicId",
};

export default function GameColumnTogglePopover({
  anchorEl,
  open,
  onClose,
  visible,
  onToggle,
}: GameColumnTogglePopoverProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 210 } } }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {t("users.columns.title")}
      </Typography>
      <Stack spacing={0.25}>
        {OPTIONAL_GAME_COLUMNS.map((key) => (
          <SmallFormControlLabel
            key={key}
            control={
              <Checkbox
                disableRipple
                size="small"
                checked={visible.has(key)}
                onChange={() => onToggle(key)}
              />
            }
            label={t(COLUMN_I18N_KEYS[key])}
          />
        ))}
      </Stack>
    </Popover>
  );
}
