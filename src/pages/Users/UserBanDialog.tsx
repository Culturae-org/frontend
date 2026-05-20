import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AdminUser } from "@/lib/types/user.types";

const DURATION_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "0", label: "Permanent" },
];

interface Props {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (userId: string, duration: string, reason: string) => Promise<void>;
}

export default function UserBanDialog({ open, user, onClose, onConfirm }: Props) {
  const { t } = useTranslation("dashboard");
  const [duration, setDuration] = useState("7d");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setDuration("7d");
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await onConfirm(user.id, duration, reason);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>{t("users.ban.title")}</Typography>
        <IconButton size="small" onClick={handleClose} disabled={loading}>
          <Dismiss24Regular />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t("users.ban.description", { username: user?.username ?? "" })}
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>{t("users.ban.duration")}</InputLabel>
            <Select
              value={duration}
              label={t("users.ban.duration")}
              onChange={(e) => setDuration(e.target.value as string)}
            >
              {DURATION_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("users.ban.reason")}
            placeholder={t("users.ban.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="text" onClick={handleClose} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {t("users.ban.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
