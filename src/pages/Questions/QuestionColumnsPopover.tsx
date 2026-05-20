import { Checkbox, Popover, Stack, Typography } from "@mui/material";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export const ALWAYS_COLUMNS = [
  { key: "qtype",      label: "Type" },
  { key: "difficulty", label: "Difficulty" },
  { key: "theme",      label: "Theme" },
] as const;

export const OPTIONAL_COLUMNS = [
  { key: "kind",         label: "Kind" },
  { key: "tags",         label: "Tags" },
  { key: "est_time",     label: "Est. time" },
  { key: "success_rate", label: "Success rate" },
  { key: "times_played", label: "Times played" },
  { key: "avg_time",     label: "Avg time" },
  { key: "version",      label: "Version" },
  { key: "created_at",   label: "Created at" },
] as const;

export const ALL_COLUMNS = [...ALWAYS_COLUMNS, ...OPTIONAL_COLUMNS];
export type QuestionColumnKey = (typeof ALL_COLUMNS)[number]["key"];

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleOptional: Set<QuestionColumnKey>;
  onToggle: (key: QuestionColumnKey) => void;
}

export default function QuestionColumnsPopover({ anchorEl, open, onClose, visibleOptional, onToggle }: Props) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { p: 2, width: 220, maxWidth: "100%" } } }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Columns</Typography>
      <Stack spacing={0.25}>
        {OPTIONAL_COLUMNS.map((col) => (
          <SmallFormControlLabel
            key={col.key}
            control={
              <Checkbox
                disableRipple
                size="small"
                checked={visibleOptional.has(col.key)}
                onChange={() => onToggle(col.key)}
              />
            }
            label={col.label}
          />
        ))}
      </Stack>
    </Popover>
  );
}
