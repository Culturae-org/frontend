import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Camera20Regular, Delete20Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import { enqueueSnackbar } from "notistack";
import { usersService } from "@/lib/services/users.service";
import { useUser } from "@/lib/stores";
import type { AdminUser, UserUpdateData } from "@/lib/types/user.types";

interface EditForm {
  username: string;
  email: string;
  role: string;
  account_status: string;
  language: string;
  bio: string;
  password: string;
  is_profile_public: boolean;
  show_online_status: boolean;
  allow_friend_requests: boolean;
  allow_party_invites: boolean;
}

function toForm(user: AdminUser): EditForm {
  return {
    username: user.username,
    email: user.email,
    role: user.role,
    account_status: user.account_status,
    language: user.language,
    bio: user.bio ?? "",
    password: "",
    is_profile_public: user.is_profile_public,
    show_online_status: user.show_online_status,
    allow_friend_requests: user.allow_friend_requests,
    allow_party_invites: user.allow_party_invites,
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem", display: "block", mb: 0.5 }}
    >
      {children}
    </Typography>
  );
}

interface UserEditDialogProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function UserEditDialog({ userId, open, onClose, onUpdated }: UserEditDialogProps) {
  const { t } = useTranslation("dashboard");
  const { user: currentAdmin, refetchProfile } = useUser();
  const { formatDateOnly } = useDateFormat();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [original, setOriginal] = useState<EditForm | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [avatarTs, setAvatarTs] = useState(Date.now());
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setUser(null);
    setForm(null);
    setOriginal(null);
    usersService
      .getUserById(userId)
      .then((u) => {
        setUser(u);
        setHasAvatar(u.has_avatar);
        setAvatarTs(Date.now());
        const f = toForm(u);
        setForm(f);
        setOriginal(f);
      })
      .catch((err) => {
        enqueueSnackbar(err instanceof Error ? err.message : t("users.edit.error"), { variant: "error" });
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, userId]);

  const isDirty = form !== null && original !== null && (() => {
    const { password: _op, ...orig } = original;
    const { password, ...curr } = form;
    return JSON.stringify(orig) !== JSON.stringify(curr) || password.trim() !== "";
  })();

  const handleRevert = () => {
    if (original) setForm({ ...original, password: "" });
  };

  const handleSave = async () => {
    if (!form || !userId) return;
    setSaving(true);
    try {
      const updates: UserUpdateData = {
        username: form.username,
        email: form.email,
        role: form.role,
        account_status: form.account_status,
        language: form.language,
        bio: form.bio || undefined,
        is_profile_public: form.is_profile_public,
        show_online_status: form.show_online_status,
        allow_friend_requests: form.allow_friend_requests,
        allow_party_invites: form.allow_party_invites,
      };
      await usersService.updateUser(userId, updates);
      if (form.password.trim()) {
        await usersService.updateUserPassword(userId, { password: form.password });
      }
      enqueueSnackbar(t("users.edit.success"), { variant: "success" });
      const f = { ...form, password: "" };
      setOriginal(f);
      setForm(f);
      if (currentAdmin?.id === userId) {
        refetchProfile();
      }
      onUpdated();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.edit.error"), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      await usersService.uploadAvatar(userId, file);
      setHasAvatar(true);
      setAvatarTs(Date.now());
      enqueueSnackbar(t("users.edit.avatar.updated"), { variant: "success" });
      if (currentAdmin?.id === userId) {
        refetchProfile();
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.edit.avatar.uploadError"), { variant: "error" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      await usersService.deleteAvatar(userId);
      setHasAvatar(false);
      setAvatarTs(Date.now());
      enqueueSnackbar(t("users.edit.avatar.removed"), { variant: "success" });
      if (currentAdmin?.id === userId) {
        refetchProfile();
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t("users.edit.avatar.removeError"), { variant: "error" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const setField = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => p && { ...p, [key]: e.target.value });

  const setBool = (key: keyof EditForm) => (_: unknown, checked: boolean) =>
    setForm((p) => p && { ...p, [key]: checked });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}>
        <Typography component="span" variant="subtitle1" fontWeight={600}>{t("users.edit.title")}</Typography>
        <IconButton size="small" onClick={onClose}><Dismiss24Regular /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!loading && form && user && (
          <Stack direction={{ xs: "column", md: "row" }} sx={{ minHeight: 400 }}>
            <Box sx={{ p: 3, minWidth: 200, borderRight: { md: "1px solid" }, borderColor: { md: "divider" }, borderBottom: { xs: "1px solid", md: "none" }, borderBottomColor: { xs: "divider" } }}>
              <Stack spacing={2.5} alignItems="flex-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
                <Stack spacing={0.75} alignItems="flex-start">
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <Avatar
                      src={hasAvatar ? usersService.getAvatarUrl(userId!, avatarTs) : undefined}
                      sx={{ width: 72, height: 72, fontSize: "1.75rem", bgcolor: "primary.main", color: "primary.contrastText" }}
                    >
                      {user.username[0]?.toUpperCase()}
                    </Avatar>
                    <Box
                      onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                      sx={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        bgcolor: "rgba(0,0,0,0.45)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.15s",
                        cursor: "pointer",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      {uploadingAvatar
                        ? <CircularProgress size={18} sx={{ color: "white" }} />
                        : <Camera20Regular style={{ color: "white", fontSize: 20 }} />}
                    </Box>
                  </Box>
                  {hasAvatar && (
                    <Button
                      variant="contained"
                      disableElevation
                      size="small"
                      startIcon={<Delete20Regular style={{ fontSize: 14 }} />}
                      onClick={handleAvatarDelete}
                      disabled={uploadingAvatar}
                      sx={{ color: "error.main", bgcolor: "action.hover", "&:hover": { bgcolor: "action.focus" } }}
                    >
                      {t("users.edit.avatar.remove")}
                    </Button>
                  )}
                </Stack>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {user.public_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">{t("users.edit.levelRank")}</Typography>
                  <Typography variant="body2" fontWeight={500}>{user.level} — {user.rank}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">{t("users.edit.created")}</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatDateOnly(user.created_at)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">{t("users.edit.lastSeen")}</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatDateOnly(user.last_seen_at)}</Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              <Stack spacing={3}>
                <Box>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField label={t("users.edit.fields.username")} size="small" fullWidth required value={form.username} onChange={setField("username")} disabled={saving} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField label={t("users.edit.fields.email")} size="small" fullWidth required type="email" value={form.email} onChange={setField("email")} disabled={saving} />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t("users.edit.fields.role")}</InputLabel>
                        <Select label={t("users.edit.fields.role")} value={form.role} onChange={(e) => setForm((p) => p && { ...p, role: e.target.value })} disabled={saving}>
                          <MenuItem value="user">{t("users.role.user")}</MenuItem>
                          <MenuItem value="moderator">{t("users.role.moderator")}</MenuItem>
                          <MenuItem value="administrator">{t("users.role.administrator")}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t("users.edit.fields.status")}</InputLabel>
                        <Select label={t("users.edit.fields.status")} value={form.account_status} onChange={(e) => setForm((p) => p && { ...p, account_status: e.target.value })} disabled={saving}>
                          <MenuItem value="active">{t("users.status.active")}</MenuItem>
                          <MenuItem value="inactive">{t("users.status.inactive")}</MenuItem>
                          <MenuItem value="manual_banned">{t("users.status.manual_banned")}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t("users.edit.fields.language")}</InputLabel>
                        <Select label={t("users.edit.fields.language")} value={form.language} onChange={(e) => setForm((p) => p && { ...p, language: e.target.value })} disabled={saving}>
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="fr">Français</MenuItem>
                          <MenuItem value="es">Español</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t("users.edit.fields.newPassword")}
                        size="small"
                        fullWidth
                        type="password"
                        value={form.password}
                        onChange={setField("password")}
                        disabled={saving}
                        placeholder={t("users.edit.fields.passwordPlaceholder")}
                      />
                    </Grid2>
                  </Grid2>
                </Box>

                <Box>
                  <Stack spacing={1.5}>
                    <TextField
                      label={t("users.edit.fields.bio")}
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={form.bio}
                      onChange={setField("bio")}
                      disabled={saving}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={form.is_profile_public} onChange={setBool("is_profile_public")} disabled={saving} />}
                      label={<Typography variant="body2">{t("users.edit.fields.publicProfile")}</Typography>}
                    />
                  </Stack>
                </Box>

                <Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={0.5}>
                    <FormControlLabel
                      control={<Switch size="small" checked={form.show_online_status} onChange={setBool("show_online_status")} disabled={saving} />}
                      label={<Typography variant="body2">{t("users.edit.fields.showOnlineStatus")}</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={form.allow_friend_requests} onChange={setBool("allow_friend_requests")} disabled={saving} />}
                      label={<Typography variant="body2">{t("users.edit.fields.allowFriendRequests")}</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={form.allow_party_invites} onChange={setBool("allow_party_invites")} disabled={saving} />}
                      label={<Typography variant="body2">{t("users.edit.fields.allowPartyInvites")}</Typography>}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <Collapse in={isDirty}>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleRevert} disabled={saving}>{t("users.edit.revert")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{t("users.edit.save")}</Button>
        </DialogActions>
      </Collapse>
    </Dialog>
  );
}
