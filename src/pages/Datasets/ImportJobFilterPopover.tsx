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

export interface ImportJobFilters {
  success: "all" | "true" | "false";
}

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: ImportJobFilters;
  onApply: (filters: ImportJobFilters) => void;
}

export const DEFAULT_IMPORT_FILTERS: ImportJobFilters = { success: "all" };

export default function ImportJobFilterPopover({ anchorEl, open, onClose, filters, onApply }: Props) {
  const [local, setLocal] = useState<ImportJobFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    onApply(DEFAULT_IMPORT_FILTERS);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { p: 2, width: 260, maxWidth: "100%" } } }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Status
          </Typography>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.success}
              onChange={(e) => setLocal((p) => ({ ...p, success: e.target.value as ImportJobFilters["success"] }))}
            >
              <MenuItem value="all">
                <ListItemText slotProps={{ primary: { variant: "body2" } }}><em>All</em></ListItemText>
              </MenuItem>
              <MenuItem value="true">
                <ListItemText slotProps={{ primary: { variant: "body2" } }}>Success</ListItemText>
              </MenuItem>
              <MenuItem value="false">
                <ListItemText slotProps={{ primary: { variant: "body2" } }}>Failed</ListItemText>
              </MenuItem>
            </DenseSelect>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="small" variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button size="small" variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
}
