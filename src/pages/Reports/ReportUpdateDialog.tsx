import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { DenseSelect, SquareChip } from "@/components/Common/StyledComponents";
import { reportsService } from "@/lib/services/reports.service";
import type { Report, ReportStatus } from "@/lib/types/reports.types";
import { useDateFormat } from "@/hooks/useDateFormat";

interface ReportUpdateDialogProps {
  report: Report | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (report: Report) => void;
}

const STATUS_COLORS: Record<ReportStatus, "warning" | "info" | "success"> = {
  pending: "warning",
  in_progress: "info",
  resolved: "success",
};

export default function ReportUpdateDialog({ report, open, onClose, onUpdated }: ReportUpdateDialogProps) {
  const { t } = useTranslation("dashboard");
  const { formatDateOnly } = useDateFormat();
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && report) {
      setStatus(report.status);
      setNotes(report.resolution_notes ?? "");
    }
  }, [open, report]);

  const handleSave = async () => {
    if (!report) return;
    try {
      setSaving(true);
      await reportsService.updateStatus(report.id, status, notes || undefined);
      const updated: Report = { ...report, status, resolution_notes: notes || undefined };
      enqueueSnackbar(t("reports.update.success"), { variant: "success" });
      onUpdated(updated);
      onClose();
    } catch (err) {
      enqueueSnackbar(
        err instanceof Error ? err.message : t("reports.update.error"),
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("reports.update.title")}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Report meta */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <SquareChip
              size="small"
              label={t(`reports.status.${report.status}`)}
              color={STATUS_COLORS[report.status]}
            />
            <Typography variant="caption" color="text.secondary">
              {t("reports.table.by")} <strong>{report.user?.username ?? report.user_id}</strong>
              {" · "}
              {formatDateOnly(report.created_at)}
            </Typography>
          </Box>

          {/* Reason + message */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("reports.table.reason")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25 }}>{report.reason}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("reports.table.message")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: "pre-wrap" }}>{report.message}</Typography>
          </Box>

          {report.question && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("reports.table.question")}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25 }}>
                {report.question.question.en}
              </Typography>
              <Typography variant="caption" color="text.secondary">{report.question.category}</Typography>
            </Box>
          )}

          <Divider />

          <FormControl>
            <FormLabel sx={{ mb: 0.5, typography: "body2", fontWeight: 600, color: "text.primary" }}>
              {t("reports.update.newStatus")}
            </FormLabel>
            <DenseSelect
              displayEmpty
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
            >
              <MenuItem value="pending"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.pending")}</ListItemText></MenuItem>
              <MenuItem value="in_progress"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.in_progress")}</ListItemText></MenuItem>
              <MenuItem value="resolved"><ListItemText slotProps={{ primary: { variant: "body2" } }}>{t("reports.status.resolved")}</ListItemText></MenuItem>
            </DenseSelect>
          </FormControl>

          <FormControl>
            <FormLabel sx={{ mb: 0.5, typography: "body2", fontWeight: 600, color: "text.primary" }}>
              {t("reports.update.notes")}
            </FormLabel>
            <TextField
              size="small"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("reports.update.notesPlaceholder")}
            />
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">{t("users.filter.reset")}</Button>
        <Button variant="contained" size="small" onClick={handleSave} disabled={saving}>
          {saving ? t("reports.update.saving") : t("reports.update.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
