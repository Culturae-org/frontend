import {
  Badge,
  Box,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowSync20Regular,
  CheckmarkCircle20Filled,
  DismissCircle20Filled,
  Filter20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { importsService } from "@/lib/services/imports.service";
import type { ImportJob } from "@/lib/types/datasets.types";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import ImportJobDetailDialog from "./ImportJobDetailDialog";
import ImportJobFilterPopover, { DEFAULT_IMPORT_FILTERS, type ImportJobFilters } from "./ImportJobFilterPopover";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

function durationLabel(job: ImportJob): string {
  if (!job.finished_at) return "—";
  const secs = differenceInSeconds(parseISO(job.finished_at), parseISO(job.started_at));
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function ImportJobsTab() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  const [filters, setFilters] = useState<ImportJobFilters>(DEFAULT_IMPORT_FILTERS);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchJobs = useCallback(async (p: number, rpp: number, f: ImportJobFilters) => {
    setLoading(true);
    try {
      const result = await importsService.getImports({
        page: p + 1,
        limit: rpp,
        success: f.success === "all" ? undefined : f.success === "true",
      });
      setJobs(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(page, rowsPerPage, filters);
  }, [page, rowsPerPage, filters, fetchJobs]);

  const handleApplyFilters = (f: ImportJobFilters) => {
    setPage(0);
    setFilters(f);
  };

  const handleChangeRowsPerPage = (rpp: number) => {
    setRowsPerPage(rpp);
    setPage(0);
  };

  const hasActiveFilters = filters.success !== "all";

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <SecondaryButton
          variant="contained"
          startIcon={<ArrowSync20Regular />}
          onClick={() => fetchJobs(page, rowsPerPage, filters)}
          disabled={loading}
        >
          Refresh
        </SecondaryButton>

        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <SecondaryButton
            variant="contained"
            startIcon={<Filter20Regular />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            Filter
          </SecondaryButton>
        </Badge>

        <Box sx={{ flex: 1 }} />

        {!loading && total > 0 && (
          <Typography variant="body2" color="text.secondary">
            {total.toLocaleString()} job{total !== 1 ? "s" : ""}
          </Typography>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1, height: 2, borderRadius: 1 }} />}

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 32 }} />
              <TableCell>Dataset</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Added</TableCell>
              <TableCell align="right">Updated</TableCell>
              <TableCell align="right">Skipped</TableCell>
              <TableCell align="right">Errors</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Started</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && jobs.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="circular" width={18} height={18} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="text" width={50} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={60} height={20} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={30} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={30} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={30} /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width={30} /></TableCell>
                    <TableCell><Skeleton variant="text" width={40} /></TableCell>
                    <TableCell><Skeleton variant="text" width={90} /></TableCell>
                  </TableRow>
                ))
              : jobs.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      {hasActiveFilters ? "No jobs match the current filters" : "No import jobs found"}
                    </TableCell>
                  </TableRow>
                )
              : jobs.map((job) => (
                  <TableRow
                    key={job.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => { setSelectedJobId(job.id); setDialogOpen(true); }}
                  >
                    <TableCell>
                      {job.success ? (
                        <Box component={CheckmarkCircle20Filled} sx={{ fontSize: 18, color: "primary.main", display: "block" }} />
                      ) : (
                        <Box component={DismissCircle20Filled} sx={{ fontSize: 18, color: "error.main", display: "block" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 160 }}>
                        {job.dataset}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                        v{job.version}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.success ? "Success" : "Failed"}
                        size="small"
                        color={job.success ? "primary" : "error"}
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        {job.added.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="primary.main">
                        {job.updated.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {job.skipped.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="caption"
                        color={job.errors > 0 ? "error.main" : "text.secondary"}
                        fontWeight={job.errors > 0 ? 600 : 400}
                      >
                        {job.errors.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {durationLabel(job)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={format(parseISO(job.started_at), "PPpp")} placement="top">
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {format(parseISO(job.started_at), "dd MMM yyyy")}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      {total > rowsPerPage && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(e) => handleChangeRowsPerPage(Number(e.target.value))}
        />
      )}

      <ImportJobFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      <ImportJobDetailDialog
        jobId={selectedJobId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
}
