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

export interface GameFilters {
  mode: string;
  status: string;
  archived: string;
}

interface GameFilterPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: GameFilters;
  onApply: (filters: GameFilters) => void;
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

export default function GameFilterPopover({
  anchorEl,
  open,
  onClose,
  filters,
  onApply,
}: GameFilterPopoverProps) {
  const { t } = useTranslation("dashboard");
  const [local, setLocal] = useState<GameFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty: GameFilters = { mode: "", status: "", archived: "all" };
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
      slotProps={{ paper: { sx: { p: 2, width: 280, maxWidth: "100%" } } }}
    >
      <Stack spacing={2}>
        <FilterField label={t("games.filter.mode")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.mode}
              onChange={(e) => setLocal((p) => ({ ...p, mode: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("games.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="solo"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.mode.solo")}</ListItemText></MenuItem>
              <MenuItem value="1v1"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.mode.1v1")}</ListItemText></MenuItem>
              <MenuItem value="multi"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.mode.multi")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label={t("games.filter.status")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.status}
              onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("games.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="waiting"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.waiting")}</ListItemText></MenuItem>
              <MenuItem value="ready"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.ready")}</ListItemText></MenuItem>
              <MenuItem value="in_progress"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.in_progress")}</ListItemText></MenuItem>
              <MenuItem value="completed"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.completed")}</ListItemText></MenuItem>
              <MenuItem value="cancelled"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.cancelled")}</ListItemText></MenuItem>
              <MenuItem value="abandoned"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.status.abandoned")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label={t("games.filter.archived")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.archived}
              onChange={(e) => setLocal((p) => ({ ...p, archived: e.target.value as string }))}
            >
              <MenuItem value="all"><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("games.filter.archivedAll")}</em></ListItemText></MenuItem>
              <MenuItem value="true"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.filter.archivedOnly")}</ListItemText></MenuItem>
              <MenuItem value="false"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("games.filter.archivedExclude")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="small" variant="outlined" onClick={handleReset}>
            {t("games.filter.reset")}
          </Button>
          <Button size="small" variant="contained" onClick={handleApply}>
            {t("games.filter.apply")}
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
}
