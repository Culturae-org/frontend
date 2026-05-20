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
import { DenseSelect } from "@/components/Common/StyledComponents";

export interface DatasetFilters {
  type: "all" | "questions" | "geography";
  status: "all" | "default";
}

const EMPTY: DatasetFilters = { type: "all", status: "all" };

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: DatasetFilters;
  onApply: (f: DatasetFilters) => void;
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

export default function DatasetFilterPopover({ anchorEl, open, onClose, filters, onApply }: Props) {
  const [local, setLocal] = useState<DatasetFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => { onApply(EMPTY); setLocal(EMPTY); onClose(); };

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
        <FilterField label="Type">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.type}
              onChange={(e) => setLocal((p) => ({ ...p, type: e.target.value as DatasetFilters["type"] }))}
            >
              <MenuItem value="all"><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="questions"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Knowledge</ListItemText></MenuItem>
              <MenuItem value="geography"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Geography</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label="Status">
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.status}
              onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as DatasetFilters["status"] }))}
            >
              <MenuItem value="all"><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText></MenuItem>
              <MenuItem value="default"><ListItemText slotProps={{ primary: { variant: "body2" } }}>Default only</ListItemText></MenuItem>
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
