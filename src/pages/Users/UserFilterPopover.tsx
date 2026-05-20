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

export interface UserFilters {
  role: string;
  account_status: string;
  status: string;
  rank: string;
}

interface UserFilterPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  filters: UserFilters;
  onApply: (filters: UserFilters) => void;
  ranks?: string[];
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

export default function UserFilterPopover({
  anchorEl,
  open,
  onClose,
  filters,
  onApply,
  ranks = [],
}: UserFilterPopoverProps) {
  const { t } = useTranslation("dashboard");
  const [local, setLocal] = useState<UserFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty: UserFilters = { role: "", account_status: "", status: "", rank: "" };
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
        <FilterField label={t("users.filter.role")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.role}
              onChange={(e) => setLocal((p) => ({ ...p, role: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("users.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="user"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.role.user")}</ListItemText></MenuItem>
              <MenuItem value="moderator"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.role.moderator")}</ListItemText></MenuItem>
              <MenuItem value="administrator"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.role.administrator")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label={t("users.filter.status")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.account_status}
              onChange={(e) => setLocal((p) => ({ ...p, account_status: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("users.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="active"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.status.active")}</ListItemText></MenuItem>
              <MenuItem value="inactive"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.status.inactive")}</ListItemText></MenuItem>
              <MenuItem value="banned"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.status.banned")}</ListItemText></MenuItem>
              <MenuItem value="suspended"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.status.suspended")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        <FilterField label={t("users.filter.online")}>
          <FormControl fullWidth>
            <DenseSelect
              displayEmpty
              value={local.status}
              onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value as string }))}
            >
              <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("users.filter.all")}</em></ListItemText></MenuItem>
              <MenuItem value="online"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.online")}</ListItemText></MenuItem>
              <MenuItem value="offline"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("users.offline")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>
        </FilterField>

        {ranks.length > 0 && (
          <FilterField label={t("users.filter.rank")}>
            <FormControl fullWidth>
              <DenseSelect
                displayEmpty
                value={local.rank}
                onChange={(e) => setLocal((p) => ({ ...p, rank: e.target.value as string }))}
              >
                <MenuItem value=""><ListItemText slotProps={{ primary: { variant: "body2" } }}><em>{t("users.filter.all")}</em></ListItemText></MenuItem>
                {ranks.map((rank) => (
                  <MenuItem key={rank} value={rank}>
                    <ListItemText slotProps={{ primary: { variant: "body2" } }}>{rank}</ListItemText>
                  </MenuItem>
                ))}
              </DenseSelect>
            </FormControl>
          </FilterField>
        )}

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
