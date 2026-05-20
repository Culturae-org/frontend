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
import { useTranslation } from "react-i18next";
import { DenseSelect } from "@/components/Common/StyledComponents";

export interface ReportFilters {
  status: string;
}

interface ReportFilterPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: ReportFilters;
  onApply: (filters: ReportFilters) => void;
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

export default function ReportFilterPopover({
  anchorEl,
  open,
  onClose,
  filters,
  onApply,
}: ReportFilterPopoverProps) {
  const { t } = useTranslation("dashboard");
  const [local, setLocal] = useState<ReportFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty: ReportFilters = { status: "" };
    setLocal(empty);
    onApply(empty);
    onClose();
  };

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
        <FilterField label={t("reports.filter.status")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.status}
              onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("users.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="pending"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.pending")}</ListItemText></MenuItem>
              <MenuItem value="in_progress"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.in_progress")}</ListItemText></MenuItem>
              <MenuItem value="resolved"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.resolved")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="small" variant="outlined" onClick={handleReset}>
            {t("users.filter.reset")}
          </Button>
          <Button size="small" variant="contained" onClick={handleApply}>
            {t("users.filter.apply")}
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
}
