import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckmarkCircle20Filled,
  Dismiss20Regular,
  DismissCircle20Filled,
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { importsService } from "@/lib/services/imports.service";
import type { ImportJob } from "@/lib/types/datasets.types";

interface Props {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
}

function duration(job: ImportJob): string {
  if (!job.finished_at) return "—";
  const secs = differenceInSeconds(parseISO(job.finished_at), parseISO(job.started_at));
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}


export default function ImportJobDetailDialog({ jobId, open, onClose }: Props) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [jobLoading, setJobLoading] = useState(false);

  useEffect(() => {
    if (!open || !jobId) return;
    setJob(null);
    setJobLoading(true);
    importsService
      .getImportById(jobId)
      .then(setJob)
      .finally(() => setJobLoading(false));
  }, [open, jobId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Import Job
          </Typography>
          {job && (
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {job.id}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Dismiss20Regular />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {jobLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : job ? (
          <>
            {/* Job metadata */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
              {job.success ? (
                <Box component={CheckmarkCircle20Filled} sx={{ fontSize: 20, color: "primary.main" }} />
              ) : (
                <Box component={DismissCircle20Filled} sx={{ fontSize: 20, color: "error.main" }} />
              )}
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {job.dataset}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  v{job.version}
                </Typography>
              </Box>
              <Chip
                label={job.success ? "Success" : "Failed"}
                size="small"
                color={job.success ? "primary" : "error"}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                Started {format(parseISO(job.started_at), "PPpp")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Duration: {duration(job)}
              </Typography>
            </Stack>

            {job.message && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                  {job.message}
                </Typography>
              </Box>
            )}

            {/* Stats row */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip label={`${job.added} added`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: "0.75rem" }} />
              <Chip label={`${job.updated} updated`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: "0.75rem" }} />
              <Chip label={`${job.skipped} skipped`} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.75rem" }} />
              <Chip label={`${job.errors} errors`} size="small" color={job.errors > 0 ? "error" : "default"} variant="outlined" sx={{ height: 22, fontSize: "0.75rem" }} />
            </Stack>

            {/* Flags info */}
            {(job.flags_svg_count > 0 || job.flags_png512_count > 0) && (
              <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary">
                  Flags:
                </Typography>
                {job.flags_svg_count > 0 && (
                  <Chip label={`${job.flags_svg_count} SVG`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                )}
                {job.flags_png512_count > 0 && (
                  <Chip label={`${job.flags_png512_count} PNG 512`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                )}
                {job.flags_png1024_count > 0 && (
                  <Chip label={`${job.flags_png1024_count} PNG 1024`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                )}
              </Box>
            )}

          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
