import {
  Checkbox,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { SmallFormControlLabel } from "@/components/Common/StyledComponents";

export const ALWAYS_COLUMNS = [
  { key: "iso_alpha2", label: "ISO α2" },
  { key: "continent", label: "Continent" },
  { key: "region", label: "Region" },
  { key: "capital", label: "Capital" },
  { key: "population", label: "Population" },
] as const;

export const OPTIONAL_COLUMNS = [
  { key: "iso_alpha3", label: "ISO α3" },
  { key: "area", label: "Area (km²)" },
  { key: "independent", label: "Independent" },
  { key: "currency", label: "Currency" },
  { key: "languages", label: "Languages" },
  { key: "tld", label: "TLD" },
  { key: "phone_code", label: "Phone code" },
  { key: "driving_side", label: "Driving side" },
] as const;

export const ALL_COLUMNS = [...ALWAYS_COLUMNS, ...OPTIONAL_COLUMNS];

export type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  visibleOptional: Set<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
}

export default function CountryColumnsPopover({ anchorEl, open, onClose, visibleOptional, onToggle }: Props) {
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
