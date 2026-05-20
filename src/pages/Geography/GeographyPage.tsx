import {
  Badge,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DATASETS_ENDPOINTS } from "@/lib/api/endpoints";
import {
  ArrowSync20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Search20Regular,
  TextColumnThree20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import type { Country, GeographyDataset } from "@/lib/types/geography.types";
import { datasetsService } from "@/lib/services/datasets.service";
import geographyService from "@/lib/services/geography.service";
import { useCountriesList } from "@/hooks/useGeography";
import CountryRow from "./CountryRow";
import CountryDetailDialog from "./CountryDetailDialog";
import CountryFilterPopover, { EMPTY_GEO_FILTERS, type GeoFilters } from "./CountryFilterPopover";
import CountryColumnsPopover, {
  ALL_COLUMNS,
  ALWAYS_COLUMNS,
  type ColumnKey,
} from "./CountryColumnsPopover";
import { SecondaryButton } from "@/components/Common/StyledComponents";

const COLUMN_HEADERS: Record<ColumnKey, { label: string; align?: "right" | "left" }> = {
  iso_alpha2: { label: "ISO α2" },
  iso_alpha3: { label: "ISO α3" },
  continent: { label: "Continent" },
  region: { label: "Region" },
  capital: { label: "Capital" },
  population: { label: "Population", align: "right" },
  area: { label: "Area (km²)", align: "right" },
  independent: { label: "Independent" },
  currency: { label: "Currency" },
  languages: { label: "Languages" },
  tld: { label: "TLD" },
  phone_code: { label: "Phone code" },
  driving_side: { label: "Driving side" },
};

export default function GeographyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const countryParam = searchParams.get("country");

  const [geoDatasets, setGeoDatasets] = useState<GeographyDataset[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [flagCountry, setFlagCountry] = useState<Country | null>(null);

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnsAnchorEl, setColumnsAnchorEl] = useState<HTMLElement | null>(null);
  const [geoFilters, setGeoFilters] = useState<GeoFilters>(EMPTY_GEO_FILTERS);
  const [visibleOptional, setVisibleOptional] = useState<Set<ColumnKey>>(new Set());

  useEffect(() => {
    datasetsService.getGeographyDatasets(false).then((ds) => {
      setGeoDatasets(ds);
      const def = ds.find((d) => d.is_default) ?? ds[0];
      if (def) setDatasetId(def.id);
    });
  }, []);

  const {
    countries,
    continents,
    regions,
    loading,
    refreshing,
    totalCount,
    currentPage,
    currentLimit,
    search,
    setSearch,
    setFilter,
    goToPage,
    setPageSize,
    refresh,
  } = useCountriesList(datasetId);

  useEffect(() => {
    if (!countryParam || !datasetId) return;
    if (selectedCountry?.id === countryParam) return;
    const found = countries.find((c) => c.id === countryParam);
    if (found) {
      setSelectedCountry(found);
    } else {
      geographyService
        .listCountries(datasetId, { limit: 300, page: 1 })
        .then((res) => {
          const match = res.data.find((c) => c.id === countryParam);
          if (match) setSelectedCountry(match);
        })
        .catch(() => {});
    }
  }, [countryParam, datasetId]);

  const openCountry = (c: Country) => {
    setSelectedCountry(c);
    setSearchParams((p) => { p.set("country", c.id); return p; }, { replace: true });
  };

  const closeCountry = () => {
    setSelectedCountry(null);
    setSearchParams((p) => { p.delete("country"); return p; }, { replace: true });
  };

  const handleApplyFilters = (f: GeoFilters) => {
    setGeoFilters(f);
    setFilter("continent", f.continent);
    setFilter("region", f.region);
    setFilter("independent", f.independent);
    setFilter("drivingSide", f.driving_side);
  };

  const hasActiveFilters = !!(
    geoFilters.continent ||
    geoFilters.region ||
    geoFilters.independent ||
    geoFilters.driving_side
  );

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
  const showSkeletons = loading && countries.length === 0;
  const showRefreshSkeletons = (refreshing || busy) && countries.length > 0;

  const orderedVisibleCols = ALL_COLUMNS
    .map((c) => c.key)
    .filter((k) => ALWAYS_COLUMNS.some((a) => a.key === k) || visibleOptional.has(k));

  return (
    <PageContainer>
      <PageHeader
        title="Geography"
        subtitle={datasetId && totalCount > 0 ? `${totalCount} countries` : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Dataset</InputLabel>
          <Select
            value={datasetId}
            label="Dataset"
            onChange={(e) => setDatasetId(e.target.value)}
            renderValue={(v) => geoDatasets.find((d) => d.id === v)?.name ?? v}
          >
            {geoDatasets.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{d.name}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    v{d.version} — {d.country_count} countries
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {datasetId && (
          <>
            <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isAnyLoading}>
              Refresh
            </SecondaryButton>

            <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
              <SecondaryButton variant="contained" startIcon={<Filter20Regular />} onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                Filter
              </SecondaryButton>
            </Badge>

            <SecondaryButton variant="contained" startIcon={<TextColumnThree20Regular />} onClick={(e) => setColumnsAnchorEl(e.currentTarget)}>
              Columns
            </SecondaryButton>

            <TextField
              size="small"
              placeholder="Search countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ ml: "auto !important", width: 220 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search20Regular style={{ fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => setSearch("")} tabIndex={-1}>
                        <Dismiss20Regular style={{ fontSize: 14 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </>
        )}
      </Stack>

      {!datasetId ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {geoDatasets.length === 0
              ? "No geography datasets available. Import one first."
              : "Select a dataset to view countries."}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative", width: "100%", minWidth: 0 }}
          >
            {isAnyLoading && (
              <LinearProgress
                sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
              />
            )}
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 44, px: 1.5 }} />
                  <TableCell sx={{ minWidth: 160, whiteSpace: "nowrap" }}>Name</TableCell>
                  {orderedVisibleCols.map((col) => (
                    <TableCell
                      key={col}
                      align={COLUMN_HEADERS[col].align}
                      sx={{ minWidth: 90, whiteSpace: "nowrap" }}
                    >
                      {COLUMN_HEADERS[col].label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {showSkeletons ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <CountryRow
                      key={`skel-${i}`}
                      loading
                      visibleColumns={new Set(orderedVisibleCols)}
                    />
                  ))
                ) : showRefreshSkeletons ? (
                  countries.map((_, i) => (
                    <CountryRow
                      key={`ref-${i}`}
                      loading
                      visibleColumns={new Set(orderedVisibleCols)}
                    />
                  ))
                ) : countries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + orderedVisibleCols.length} sx={{ py: 6, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">No countries found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  countries.map((c) => (
                    <CountryRow
                      key={c.id}
                      country={c}
                      visibleColumns={new Set(orderedVisibleCols)}
                      onClick={() => openCountry(c)}
                      onFlagClick={setFlagCountry}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalCount > 0 && (
            <TablePagination
              component="div"
              count={totalCount}
              page={currentPage - 1}
              rowsPerPage={currentLimit}
              rowsPerPageOptions={[25, 50, 100]}
              onPageChange={(_, p) => goToPage(p + 1)}
              onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
              labelRowsPerPage="Rows per page:"
              sx={{ mt: 1 }}
            />
          )}
        </>
      )}

      <CountryFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={geoFilters}
        continents={continents}
        regions={regions}
        onApply={handleApplyFilters}
      />

      <CountryColumnsPopover
        anchorEl={columnsAnchorEl}
        open={Boolean(columnsAnchorEl)}
        onClose={() => setColumnsAnchorEl(null)}
        visibleOptional={visibleOptional}
        onToggle={(key) => setVisibleOptional((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        })}
      />

      <CountryDetailDialog
        country={selectedCountry}
        open={Boolean(selectedCountry)}
        onClose={closeCountry}
      />

      <Dialog open={Boolean(flagCountry)} onClose={() => setFlagCountry(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {flagCountry
              ? (flagCountry.name["en"] ?? flagCountry.name["fr"] ?? flagCountry.iso_alpha2)
              : ""}
          </Typography>
          <IconButton size="small" onClick={() => setFlagCountry(null)}>
            <Dismiss20Regular />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", pb: 3 }}>
          {flagCountry && (
            <Box
              component="img"
              src={DATASETS_ENDPOINTS.GET_FLAG(flagCountry.iso_alpha2)}
              alt={flagCountry.iso_alpha2}
              sx={{ width: "100%", maxWidth: 320, height: "auto", borderRadius: 1, boxShadow: 2 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
