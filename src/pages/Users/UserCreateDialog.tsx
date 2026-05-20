import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { usersService } from "@/lib/services/users.service";
import type { AdminUser } from "@/lib/types/user.types";

interface UserCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}

const INITIAL_FORM = {
  username: "",
  email: "",
  password: "",
  role: "user",
  account_status: "active",
};

export default function UserCreateDialog({
  open,
  onClose,
  onCreated,
}: UserCreateDialogProps) {
  const { t } = useTranslation("dashboard");
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const isValid = form.username.trim() && form.email.trim() && form.password.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const user = await usersService.createUser(form);
      enqueueSnackbar(t("users.create.success"), { variant: "success" });
      onCreated(user);
      setForm(INITIAL_FORM);
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("users.create.error"),
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm(INITIAL_FORM);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{t("users.create.title")}</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("users.edit.fields.username")}
            size="small"
            fullWidth
            required
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            disabled={loading}
          />
          <TextField
            label={t("users.edit.fields.email")}
            size="small"
            fullWidth
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            disabled={loading}
          />
          <TextField
            label={t("users.edit.fields.newPassword")}
            size="small"
            fullWidth
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            disabled={loading}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>{t("users.edit.fields.role")}</InputLabel>
            <Select
              label={t("users.edit.fields.role")}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              disabled={loading}
            >
              <MenuItem value="user">{t("users.role.user")}</MenuItem>
              <MenuItem value="moderator">{t("users.role.moderator")}</MenuItem>
              <MenuItem value="administrator">{t("users.role.administrator")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.account_status}
              onChange={(e) => setForm((p) => ({ ...p, account_status: e.target.value }))}
              disabled={loading}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="banned">Banned</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t("users.create.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !isValid}
        >
          {t("users.create.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
