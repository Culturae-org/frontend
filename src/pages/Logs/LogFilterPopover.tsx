import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface LogFilters {
  action: string;
  resource: string;
  status: string;
}

interface LogFilterPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: LogFilters;
  onApply: (f: LogFilters) => void;
  actionOptions?: string[];
  resourceOptions?: string[];
}

export default function LogFilterPopover({ anchorEl, open, onClose, filters, onApply, actionOptions = [], resourceOptions = [] }: LogFilterPopoverProps) {
  const { t } = useTranslation("dashboard");
  const [local, setLocal] = useState<LogFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty = { action: "", resource: "", status: "all" };
    setLocal(empty);
    onApply(empty);
    onClose();
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { width: 280, p: 2 } } }}
    >
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
        {t("users.filter.title")}
      </Typography>
      <Stack spacing={2}>
        {actionOptions.length > 0 ? (
          <FormControl size="small">
            <InputLabel>{t("logs.filter.action")}</InputLabel>
            <Select
              value={local.action}
              label={t("logs.filter.action")}
              onChange={(e) => setLocal((p) => ({ ...p, action: e.target.value }))}
            >
              <MenuItem value="">{t("users.filter.all")}</MenuItem>
              {actionOptions.map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            size="small"
            label={t("logs.filter.action")}
            value={local.action}
            onChange={(e) => setLocal((p) => ({ ...p, action: e.target.value }))}
            placeholder="e.g. create_user"
          />
        )}
        {resourceOptions.length > 0 ? (
          <FormControl size="small">
            <InputLabel>{t("logs.filter.resource")}</InputLabel>
            <Select
              value={local.resource}
              label={t("logs.filter.resource")}
              onChange={(e) => setLocal((p) => ({ ...p, resource: e.target.value }))}
            >
              <MenuItem value="">{t("users.filter.all")}</MenuItem>
              {resourceOptions.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            size="small"
            label={t("logs.filter.resource")}
            value={local.resource}
            onChange={(e) => setLocal((p) => ({ ...p, resource: e.target.value }))}
            placeholder="e.g. user, game"
          />
        )}
        <FormControl size="small">
          <InputLabel>{t("logs.filter.status")}</InputLabel>
          <Select
            value={local.status}
            label={t("logs.filter.status")}
            onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value }))}
          >
            <MenuItem value="all">{t("users.filter.all")}</MenuItem>
            <MenuItem value="success">{t("logs.filter.success")}</MenuItem>
            <MenuItem value="failure">{t("logs.filter.failure")}</MenuItem>
          </Select>
        </FormControl>
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
