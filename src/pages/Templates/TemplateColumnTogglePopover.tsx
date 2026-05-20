import { Checkbox, Popover, Stack, Typography } from "@mui/material";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";
import { OPTIONAL_COLUMNS, type TemplateOptionalColumn } from "./TemplateRow";

interface TemplateColumnTogglePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleOptional: Set<TemplateOptionalColumn>;
  onToggle: (key: TemplateOptionalColumn) => void;
}

export default function TemplateColumnTogglePopover({
  anchorEl,
  open,
  onClose,
  visibleOptional,
  onToggle,
}: TemplateColumnTogglePopoverProps) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 200, maxWidth: "100%" } } }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        Columns
      </Typography>
      <Stack spacing={0.25}>
        {OPTIONAL_COLUMNS.map(({ key, label }) => (
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
            label={label}
          />
        ))}
      </Stack>
    </Popover>
  );
}
