import {
  Badge,
  Box,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  ArrowDownload20Regular,
  ArrowSync20Regular,
  CloudArrowUp20Regular,
  Filter20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useDatasetsList } from "@/hooks/useDatasetsList";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import DatasetCard from "./DatasetCard";
import DatasetImportDialog from "./DatasetImportDialog";
import DatasetFilterPopover, { type DatasetFilters } from "./DatasetFilterPopover";
import ImportJobsTab from "./ImportJobsTab";
import type { UnifiedDataset } from "@/hooks/useDatasetsList";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import ResponsiveTabs from "@/components/Common/ResponsiveTabs";

export default function DatasetsPage() {
  const [tab, setTab] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const actionParam = searchParams.get("action");
  useEffect(() => {
    if (actionParam === "import") {
      setImportOpen(true);
      setSearchParams((p) => { p.delete("action"); return p; }, { replace: true });
    }
  }, [actionParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    datasets,
    loading,
    refreshing,
    checkingUpdate,
    totalCount,
    filters,
    setFilter,
    refresh,
    toggleActive,
    deleteDataset,
    setDefault,
    checkAllUpdates,
  } = useDatasetsList();

  const confirm = useConfirm();

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

  const isAnyLoading = loading || refreshing || busy;
  const showSkeletons = loading && datasets.length === 0;
  const showRefreshSkeletons = (refreshing || busy) && datasets.length > 0;
  const hasActiveFilters = filters.type !== "all" || filters.status !== "all";

  const handleApplyFilters = (f: DatasetFilters) => {
    setFilter("type", f.type);
    setFilter("status", f.status);
  };

  const handleDelete = async (d: UnifiedDataset) => {
    const ok = await confirm({
      title: "Delete dataset",
      description: `Delete "${d.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      danger: true,
    });
    if (ok) await deleteDataset(d.id);
  };

  const skeletonCount = showSkeletons ? 5 : datasets.length;

  return (
    <PageContainer>
      <PageHeader
        title="Datasets"
        subtitle={totalCount > 0 ? `${totalCount} dataset${totalCount !== 1 ? "s" : ""}` : undefined}
      />

      <ResponsiveTabs
        tabs={[
          { label: "Datasets", value: 0 },
          { label: "Import Jobs", value: 1 },
        ]}
        value={tab}
        onChange={(_, v) => setTab(v as number)}
      />

      {tab === 0 && (
        <>
          {/* Toolbar */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
            <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isAnyLoading}>
              Refresh
            </SecondaryButton>
            <SecondaryButton
              variant="contained"
              startIcon={<CloudArrowUp20Regular />}
              onClick={checkAllUpdates}
              disabled={checkingUpdate || isAnyLoading}
            >
              {checkingUpdate ? "Checking…" : "Check updates"}
            </SecondaryButton>
            <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
              <SecondaryButton variant="contained" startIcon={<Filter20Regular />} onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                Filter
              </SecondaryButton>
            </Badge>
          </Stack>

          {isAnyLoading && (
            <LinearProgress sx={{ mb: 2, borderRadius: 1, height: 2 }} />
          )}

          {/* Card grid */}
          <Grid container spacing={2}>
            {/* Import card — always first */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Box
                onClick={() => setImportOpen(true)}
                sx={{
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 2,
                  height: "100%",
                  minHeight: 148,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  cursor: "pointer",
                  color: "text.secondary",
                  bgcolor: "background.paper",
                  transition: "background-color 0.3s ease",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ArrowDownload20Regular style={{ fontSize: 24 }} />
                <Typography variant="h6">Import dataset</Typography>
              </Box>
            </Grid>

            {/* Dataset cards / skeletons */}
            {showSkeletons || showRefreshSkeletons ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <DatasetCard key={`skel-${i}`} loading />
              ))
            ) : datasets.length === 0 ? (
              <Grid size={12}>
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No datasets found. Import one to get started.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              datasets.map((d) => (
                <DatasetCard
                  key={d.id}
                  dataset={d}
                  onSetDefault={(d) => setDefault(d.id)}
                  onToggleActive={(d) => toggleActive(d.id)}
                  onDelete={handleDelete}
                />
              ))
            )}
          </Grid>

          {/* Filter popover */}
          <DatasetFilterPopover
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            filters={{ type: filters.type, status: filters.status }}
            onApply={handleApplyFilters}
          />

          {/* Import dialog */}
          <DatasetImportDialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onSuccess={() => { setImportOpen(false); refresh(); }}
          />
        </>
      )}

      {tab === 1 && <ImportJobsTab />}
    </PageContainer>
  );
}
