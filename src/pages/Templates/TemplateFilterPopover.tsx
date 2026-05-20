import {
  Box,
  Button,
  FormControl,
  ListItemText,
  MenuItem,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MODE_LABELS, CATEGORY_LABELS } from "@/lib/constants/game-template.constants";
import { DenseSelect } from "@/components/Common/StyledComponents";

export interface TemplateFilters {
  mode: string;
  category: string;
  active_only: string;
}

const EMPTY: TemplateFilters = { mode: "", category: "", active_only: "" };

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: TemplateFilters;
  onApply: (f: TemplateFilters) => void;
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default function TemplateFilterPopover({ anchorEl, open, onClose, filters, onApply }: Props) {
  const [local, setLocal] = useState<TemplateFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => { const e = EMPTY; setLocal(e); onApply(e); onClose(); };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { p: 2, width: 300, maxWidth: "100%" } } }}
    >
      <Stack spacing={2}>
        <FilterField label="Mode">
          <FormControl fullWidth>
            <DenseSelect displayEmpty value={local.mode} onChange={(e) => setLocal((p) => ({ ...p, mode: e.target.value as string }))}>
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              {Object.entries(MODE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}><ListItemText slotProps={{ primary: { variant: "body2" } }}>{l}</ListItemText></MenuItem>)}
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Category">
          <FormControl fullWidth>
            <DenseSelect displayEmpty value={local.category} onChange={(e) => setLocal((p) => ({ ...p, category: e.target.value as string }))}>
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <MenuItem key={v} value={v}><ListItemText slotProps={{ primary: { variant: "body2" } }}>{l}</ListItemText></MenuItem>)}
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Status">
          <FormControl fullWidth>
            <DenseSelect displayEmpty value={local.active_only} onChange={(e) => setLocal((p) => ({ ...p, active_only: e.target.value as string }))}>
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="true"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Active</ListItemText></MenuItem>
              <MenuItem value="false"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Inactive</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="small" variant="outlined" onClick={handleReset}>Reset</Button>
          <Button size="small" variant="contained" onClick={handleApply}>Apply</Button>
        </Box>
      </Stack>
    </Popover>
  );
}
