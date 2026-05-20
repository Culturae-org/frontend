import { Checkbox, Popover, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export type ReportColumnKey =
  | "user"
  | "reason"
  | "message"
  | "status"
  | "created_at"
  | "resolution_notes"
  | "updated_at"
  | "question";

export const DEFAULT_REPORT_COLUMNS: ReportColumnKey[] = [
  "user",
  "reason",
  "message",
  "status",
  "created_at",
];

export const OPTIONAL_REPORT_COLUMNS: ReportColumnKey[] = [
  "resolution_notes",
  "updated_at",
  "question",
];

const COLUMN_LABEL_KEYS: Record<ReportColumnKey, string> = {
  user: "reports.table.user",
  reason: "reports.table.reason",
  message: "reports.table.message",
  status: "reports.table.status",
  created_at: "reports.table.created_at",
  resolution_notes: "reports.table.resolution_notes",
  updated_at: "reports.table.updated_at",
  question: "reports.table.question",
};

interface ReportColumnTogglePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleOptional: Set<ReportColumnKey>;
  onToggle: (key: ReportColumnKey) => void;
}

export default function ReportColumnTogglePopover({
  anchorEl,
  open,
  onClose,
  visibleOptional,
  onToggle,
}: ReportColumnTogglePopoverProps) {
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
        {OPTIONAL_REPORT_COLUMNS.map((key) => (
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
