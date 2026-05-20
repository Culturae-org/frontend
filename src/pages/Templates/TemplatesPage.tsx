import {
  Badge,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
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
import {
  Add20Regular,
  ArrowSync20Regular,
  DatabaseLightning20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Search20Regular,
  TextColumnThree20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useGameTemplates } from "@/hooks/useGameTemplates";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import TemplateRow from "./TemplateRow";
import TemplateFilterPopover, { type TemplateFilters } from "./TemplateFilterPopover";
import TemplateColumnTogglePopover from "./TemplateColumnTogglePopover";
import type { TemplateOptionalColumn } from "./TemplateRow";
import { OPTIONAL_COLUMNS, OPTIONAL_COLUMN_MIN_WIDTHS } from "./TemplateRow";
import type { GameTemplate } from "@/lib/types/game-template.types";
import { SecondaryButton } from "@/components/Common/StyledComponents";

const EMPTY_FILTERS: TemplateFilters = { mode: "", category: "", active_only: "" };
const LIMIT_KEY = "templates_page_limit";
const VALID_LIMITS = [10, 25, 50];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const {
    templates, loading, total, currentPage,
    fetchTemplates, deleteTemplate, seedDefaultTemplates,
  } = useGameTemplates();

  const [pageLimit, setPageLimit] = useState(() => {
    const saved = Number(localStorage.getItem(LIMIT_KEY));
    return VALID_LIMITS.includes(saved) ? saved : 10;
  });

  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TemplateFilters>(EMPTY_FILTERS);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);
  const [visibleOptional, setVisibleOptional] = useState<Set<TemplateOptionalColumn>>(new Set());

  const handleToggleColumn = (key: TemplateOptionalColumn) => {
    setVisibleOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = (page = 1, limit = pageLimit, q = search, f = filters) => {
    fetchTemplates({
      page,
      limit,
      query: q || undefined,
      mode: f.mode as GameTemplate["mode"] || undefined,
      category: f.category as GameTemplate["category"] || undefined,
      active_only: f.active_only === "" ? undefined : f.active_only === "true",
    });
  };

  useEffect(() => { load(); }, []);

  const actionParam = searchParams.get("action");
  useEffect(() => {
    if (actionParam === "create") {
      navigate("/templates/new");
    } else if (actionParam === "seed") {
      seedDefaultTemplates(() => load());
    }
    if (actionParam) setSearchParams((p) => { p.delete("action"); return p; }, { replace: true });
  }, [actionParam]);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, pageLimit, v), 350);
  };

  const handleApplyFilters = (f: TemplateFilters) => {
    setFilters(f);
    load(1, pageLimit, search, f);
  };

  const handleDelete = async (t: GameTemplate) => {
    const ok = await confirm({
      title: "Delete template",
      description: `Delete "${t.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      danger: true,
    });
    if (ok) {
      await deleteTemplate(t.id, t.name);
      load();
    }
  };

  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    load(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!loading && busy) {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    }
    return () => clearTimeout(busyTimer.current);
  }, [loading, busy]);

  const hasActiveFilters = !!(filters.mode || filters.category || filters.active_only);
  const isAnyLoading = loading || busy;
  const showSkeletons = loading && templates.length === 0;
  const showRefreshSkeletons = (loading || busy) && templates.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Game Templates"
        subtitle={total > 0 ? `${total} templates` : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <Button variant="contained" startIcon={<Add20Regular />} onClick={() => navigate("/templates/new")}>
          Create
        </Button>
        <SecondaryButton variant="contained" startIcon={<ArrowSync20Regular />} onClick={handleRefresh} disabled={isAnyLoading}>
          Refresh
        </SecondaryButton>
        <SecondaryButton
          variant="contained"
          startIcon={<DatabaseLightning20Regular />}
          onClick={() => seedDefaultTemplates(() => load())}
          disabled={isAnyLoading}
        >
          Seed defaults
        </SecondaryButton>
        <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
          <SecondaryButton variant="contained" startIcon={<Filter20Regular />} onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
            Filter
          </SecondaryButton>
        </Badge>
        <SecondaryButton variant="contained" startIcon={<TextColumnThree20Regular />} onClick={(e) => setColumnAnchorEl(e.currentTarget)}>
          Columns
        </SecondaryButton>
        <TextField
          size="small"
          placeholder="Search templates…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
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
                  <IconButton size="small" edge="end" onClick={() => handleSearch("")} tabIndex={-1}>
                    <Dismiss20Regular style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Stack>

      <TableContainer
        component={Paper}
        sx={{ boxShadow: "none", border: 1, borderColor: "divider", overflowX: "auto", position: "relative" }}
      >
        {isAnyLoading && (
          <LinearProgress
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
          />
        )}
        <Table size="small" stickyHeader sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 160, whiteSpace: "nowrap" }}>Name</TableCell>
              <TableCell sx={{ minWidth: 160, whiteSpace: "nowrap" }}>Slug</TableCell>
              <TableCell sx={{ minWidth: 90, whiteSpace: "nowrap" }}>Mode</TableCell>
              <TableCell sx={{ minWidth: 110, whiteSpace: "nowrap" }}>Category</TableCell>
              <TableCell align="center" sx={{ minWidth: 80, whiteSpace: "nowrap" }}>Questions</TableCell>
              <TableCell align="center" sx={{ minWidth: 70, whiteSpace: "nowrap" }}>Players</TableCell>
              <TableCell sx={{ minWidth: 110, whiteSpace: "nowrap" }}>Score mode</TableCell>
              <TableCell sx={{ minWidth: 80, whiteSpace: "nowrap" }}>Status</TableCell>
              {OPTIONAL_COLUMNS.filter(({ key }) => visibleOptional.has(key)).map(({ key, label }) => (
                <TableCell key={key} sx={{ minWidth: OPTIONAL_COLUMN_MIN_WIDTHS[key] ?? 90, whiteSpace: "nowrap" }}>
                  {label}
                </TableCell>
              ))}
              <TableCell sx={{ minWidth: 52 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeletons ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TemplateRow key={`skel-${i}`} loading visibleOptional={visibleOptional} />
              ))
            ) : showRefreshSkeletons ? (
              templates.map((_, i) => (
                <TemplateRow key={`ref-${i}`} loading visibleOptional={visibleOptional} />
              ))
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9 + visibleOptional.size} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">No templates found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TemplateRow key={t.id} template={t} visibleOptional={visibleOptional} onDelete={handleDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={currentPage - 1}
          rowsPerPage={pageLimit}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => load(p + 1)}
          onRowsPerPageChange={(e) => {
            const newLimit = Number(e.target.value);
            localStorage.setItem(LIMIT_KEY, String(newLimit));
            setPageLimit(newLimit);
            load(1, newLimit);
          }}
          labelRowsPerPage="Rows per page:"
          sx={{ mt: 1 }}
        />
      )}

      <TemplateFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      <TemplateColumnTogglePopover
        anchorEl={columnAnchorEl}
        open={Boolean(columnAnchorEl)}
        onClose={() => setColumnAnchorEl(null)}
        visibleOptional={visibleOptional}
        onToggle={handleToggleColumn}
      />

    </PageContainer>
  );
}
