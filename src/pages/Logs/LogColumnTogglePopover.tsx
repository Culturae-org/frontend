import { Checkbox, Popover, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export type LogColumnKey = "resourceId" | "ip" | "userAgent" | "errorMsg";

export const OPTIONAL_LOG_COLUMNS: LogColumnKey[] = ["resourceId", "ip", "userAgent", "errorMsg"];

interface LogColumnTogglePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visible: Set<LogColumnKey>;
  onToggle: (key: LogColumnKey) => void;
}

export default function LogColumnTogglePopover({ anchorEl, open, onClose, visible, onToggle }: LogColumnTogglePopoverProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 200 } } }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {t("users.columns.title")}
      </Typography>
      <Stack spacing={0.25}>
        {OPTIONAL_LOG_COLUMNS.map((key) => (
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
            label={t(`logs.columns.${key}`)}
          />
        ))}
      </Stack>
    </Popover>
  );
}
