import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  LinearProgress,
  Paper,
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
  Edit20Regular,
  Filter20Regular,
  TextColumnThree20Regular,
} from "@fluentui/react-icons";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useReports } from "@/hooks/useReports";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { SecondaryButton, SquareChip } from "@/components/Common/StyledComponents";
import type { Report, ReportStatus } from "@/lib/types/reports.types";
import ReportFilterPopover, { type ReportFilters } from "./ReportFilterPopover";
import ReportUpdateDialog from "./ReportUpdateDialog";
import ReportColumnTogglePopover, {
  DEFAULT_REPORT_COLUMNS,
  OPTIONAL_REPORT_COLUMNS,
  type ReportColumnKey,
} from "./ReportColumnTogglePopover";

const STATUS_COLORS: Record<ReportStatus, "warning" | "info" | "success"> = {
  pending: "warning",
  in_progress: "info",
  resolved: "success",
};

const COLUMN_MIN_WIDTHS: Partial<Record<ReportColumnKey, number>> = {
  user: 140,
  reason: 140,
  message: 200,
  status: 110,
  created_at: 110,
  resolution_notes: 200,
  updated_at: 110,
  question: 200,
};

function truncate(str: string, max = 60) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function ReportRowSkeleton({ colCount }: { colCount: number }) {
  return (
    <TableRow>
      {Array.from({ length: colCount }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton variant="text" width={i === colCount - 2 ? 70 : 100 + (i % 3) * 30} />
        </TableCell>
      ))}
      <TableCell />
    </TableRow>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation("dashboard");
  const { formatDateOnly } = useDateFormat();
  const {
    reports,
    loading,
    refreshing,
    totalCount,
    currentPage,
    currentLimit,
    filters,
    goToPage,
    setPageSize,
    refresh,
    setFilter,
    updateReportInList,
  } = useReports();

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);
  const [updateReport, setUpdateReport] = useState<Report | null>(null);
  const [visibleOptional, setVisibleOptional] = useState<Set<ReportColumnKey>>(new Set());

  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !refreshing && busy) {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    }
    return () => clearTimeout(busyTimer.current);
  }, [loading, refreshing, busy]);

  const visibleColumns = useMemo<ReportColumnKey[]>(() => {
    const optional = OPTIONAL_REPORT_COLUMNS.filter((k) => visibleOptional.has(k));
    return [...DEFAULT_REPORT_COLUMNS, ...optional];
  }, [visibleOptional]);

  const hasActiveFilters = !!filters.status;
  const isAnyLoading = loading || refreshing || busy;
  const showSkeletons = loading && reports.length === 0;
  const showRefreshSkeletons = (refreshing || busy) && reports.length > 0;
  const colCount = visibleColumns.length;

  const currentFilters: ReportFilters = { status: filters.status };

  const handleApplyFilters = (f: ReportFilters) => {
    setFilter("status", f.status);
  };

  const handleToggleColumn = (key: ReportColumnKey) => {
    setVisibleOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function renderCell(report: Report, col: ReportColumnKey) {
    switch (col) {
      case "user":
        return (
          <Typography variant="body2" fontWeight={500}>
            {report.user?.username ?? report.user_id.slice(0, 8)}
          </Typography>
        );
      case "reason":
        return <Typography variant="body2">{report.reason}</Typography>;
      case "message":
        return (
          <Tooltip title={report.message} placement="top-start">
            <Typography variant="body2" color="text.secondary" sx={{ cursor: "default" }}>
              {truncate(report.message)}
            </Typography>
          </Tooltip>
        );
      case "status":
        return (
          <SquareChip
            size="small"
            label={t(`reports.status.${report.status}`)}
            color={STATUS_COLORS[report.status]}
          />
        );
      case "created_at":
        return (
          <Typography variant="body2" color="text.secondary">
            {formatDateOnly(report.created_at)}
          </Typography>
        );
      case "updated_at":
        return (
          <Typography variant="body2" color="text.secondary">
            {formatDateOnly(report.updated_at)}
          </Typography>
        );
      case "resolution_notes":
        return (
          <Typography variant="body2" color="text.secondary">
            {report.resolution_notes ? truncate(report.resolution_notes, 50) : "—"}
          </Typography>
        );
      case "question":
        return (
          <Typography variant="body2" color="text.secondary">
            {report.question ? truncate(report.question.question.en, 50) : "—"}
          </Typography>
        );
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("nav.reports")}
        subtitle={totalCount > 0 ? t("reports.subtitle", { count: totalCount }) : undefined}
      />

      {/* Toolbar */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isAnyLoading}>
          {t("users.toolbar.refresh")}
        </SecondaryButton>
        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <SecondaryButton variant="contained" startIcon={<Filter20Regular />} onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
            {t("users.toolbar.filter")}
          </SecondaryButton>
        </Badge>
        <SecondaryButton variant="contained" startIcon={<TextColumnThree20Regular />} onClick={(e) => setColumnAnchorEl(e.currentTarget)}>
          {t("users.toolbar.columns")}
        </SecondaryButton>
      </Stack>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}
      >
        {isAnyLoading && (
          <LinearProgress
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
          />
        )}
        <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={col} sx={{ minWidth: COLUMN_MIN_WIDTHS[col] ?? 90, whiteSpace: "nowrap" }}>
                  {t(`reports.table.${col}`)}
                </TableCell>
              ))}
              <TableCell sx={{ minWidth: 52 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeletons ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ReportRowSkeleton key={`skel-${i}`} colCount={colCount} />
              ))
            ) : showRefreshSkeletons ? (
              reports.map((_, i) => (
                <ReportRowSkeleton key={`ref-${i}`} colCount={colCount} />
              ))
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount + 1} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">{t("reports.table.noResults")}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  {visibleColumns.map((col) => (
                    <TableCell key={col}>{renderCell(report, col)}</TableCell>
                  ))}
                  <TableCell align="right">
                    <Tooltip title={t("reports.action.update")}>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ minWidth: 0, px: 0.75 }}
                        onClick={() => setUpdateReport(report)}
                      >
                        <Edit20Regular style={{ fontSize: 18 }} />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={currentPage - 1}
          rowsPerPage={currentLimit}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, p) => goToPage(p + 1)}
          onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
          labelRowsPerPage={t("users.table.rowsPerPage")}
          sx={{ mt: 1 }}
        />
      )}

      {/* Popovers */}
      <ReportFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={currentFilters}
        onApply={handleApplyFilters}
      />
      <ReportColumnTogglePopover
        anchorEl={columnAnchorEl}
        open={Boolean(columnAnchorEl)}
        onClose={() => setColumnAnchorEl(null)}
        visibleOptional={visibleOptional}
        onToggle={handleToggleColumn}
      />

      {/* Update dialog */}
      <ReportUpdateDialog
        report={updateReport}
        open={Boolean(updateReport)}
        onClose={() => setUpdateReport(null)}
        onUpdated={(updated) => {
          updateReportInList(updated);
          setUpdateReport(null);
        }}
      />
    </PageContainer>
  );
}
