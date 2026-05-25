import {
  Badge,
  Box,
  Button,
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
import {
  Add20Regular,
  ArrowSync20Regular,
  Dismiss20Regular,
  Filter20Regular,
  Search20Regular,
  TextColumnThree20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { enqueueSnackbar } from "notistack";
import PageContainer from "@/components/Common/PageContainer";
import PageHeader from "@/components/Common/PageHeader";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import type { QuestionDataset } from "@/lib/types/datasets.types";
import { datasetsService } from "@/lib/services/datasets.service";
import { questionsService } from "@/lib/services/questions.service";
import { useQuestions } from "@/hooks/useQuestions";
import { SecondaryButton } from "@/components/Common/StyledComponents";
import QuestionRow from "./QuestionRow";
import QuestionFilterPopover, {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from "./QuestionFilterPopover";
import QuestionColumnsPopover, {
  ALL_COLUMNS,
  ALWAYS_COLUMNS,
  type QuestionColumnKey,
} from "./QuestionColumnsPopover";

const COLUMN_HEADERS: Record<QuestionColumnKey, { label: string; align?: "right" }> = {
  qtype:        { label: "Type" },
  difficulty:   { label: "Difficulty" },
  theme:        { label: "Theme" },
  kind:         { label: "Kind" },
  tags:         { label: "Tags" },
  est_time:     { label: "Est. time",     align: "right" },
  success_rate: { label: "Success rate",  align: "right" },
  times_played: { label: "Times played",  align: "right" },
  avg_time:     { label: "Avg time",      align: "right" },
  version:      { label: "Version" },
  created_at:   { label: "Created at" },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function QuestionsPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [questionDatasets, setQuestionDatasets] = useState<QuestionDataset[]>([]);
  const [datasetId, setDatasetId] = useState("");

  const [themes, setThemes] = useState<Array<{ id: string; slug: string }>>([]);

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [columnsAnchorEl, setColumnsAnchorEl] = useState<HTMLElement | null>(null);
  const [filters, setFilters] = useState<QuestionFilters>(EMPTY_QUESTION_FILTERS);
  const [visibleOptional, setVisibleOptional] = useState<Set<QuestionColumnKey>>(new Set());

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { questions, loading, totalCount, fetchQuestions } = useQuestions();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    datasetsService.getDatasets(false).then((ds) => {
      setQuestionDatasets(ds);
      const def = ds.find((d) => d.is_default) ?? ds[0];
      if (def) setDatasetId(def.id);
    });
  }, []);

  const doFetch = useCallback(
    (opts: { datasetId: string; page: number; pageSize: number; search: string; filters: QuestionFilters }) => {
      if (!opts.datasetId) return;
      fetchQuestions({
        dataset_id: opts.datasetId,
        page: opts.page,
        limit: opts.pageSize,
        q: opts.search || undefined,
        difficulty: opts.filters.difficulty || undefined,
        qtype: opts.filters.qtype || undefined,
        theme: opts.filters.theme || undefined,
      });
    },
    [fetchQuestions],
  );

  useEffect(() => {
    doFetch({ datasetId, page, pageSize, search: debouncedSearch, filters });
  }, [datasetId, page, pageSize, debouncedSearch, filters]);

  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRefresh = useCallback(() => {
    setBusy(true);
    doFetch({ datasetId, page, pageSize, search: debouncedSearch, filters });
  }, [datasetId, page, pageSize, debouncedSearch, filters, doFetch]);

  useEffect(() => {
    if (!loading && busy) {
      busyTimer.current = setTimeout(() => setBusy(false), 300);
    }
    return () => clearTimeout(busyTimer.current);
  }, [loading, busy]);

  const handleApplyFilters = (f: QuestionFilters) => {
    setFilters(f);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  useEffect(() => {
    if (!datasetId) { setThemes([]); return; }
    questionsService
      .getQuestions({ dataset_id: datasetId, limit: 500, page: 1 })
      .then((res) => {
        const seen = new Map<string, { id: string; slug: string }>();
        for (const q of res.data) {
          if (q.theme?.slug && !seen.has(q.theme.slug)) {
            seen.set(q.theme.slug, q.theme);
          }
        }
        setThemes([...seen.values()].sort((a, b) => a.slug.localeCompare(b.slug)));
      })
      .catch(() => setThemes([]));
  }, [datasetId]);

  const handleDatasetChange = (id: string) => {
    setDatasetId(id);
    setPage(1);
    setSearch("");
    setFilters(EMPTY_QUESTION_FILTERS);
  };

  const hasActiveFilters = !!(filters.difficulty || filters.qtype || filters.theme);

  const isAnyLoading = loading || busy;
  const showSkeletons = loading && questions.length === 0;
  const showRefreshSkeletons = busy && questions.length > 0;

  const orderedVisibleCols = ALL_COLUMNS
    .map((c) => c.key)
    .filter((k) => ALWAYS_COLUMNS.some((a) => a.key === k) || visibleOptional.has(k));

  return (
    <PageContainer>
      <PageHeader
        title="Questions"
        subtitle={datasetId && totalCount > 0 ? `${totalCount} questions` : undefined}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Dataset</InputLabel>
          <Select
            value={datasetId}
            label="Dataset"
            onChange={(e) => handleDatasetChange(e.target.value)}
            renderValue={(v) => questionDatasets.find((d) => d.id === v)?.name ?? v}
          >
            {questionDatasets.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{d.name}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    v{d.version} — {d.question_count} questions
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {datasetId && (
          <>
            <SecondaryButton
              variant="contained"
              startIcon={<ArrowSync20Regular />}
              onClick={handleRefresh}
              disabled={isAnyLoading}
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

            <SecondaryButton
              variant="contained"
              startIcon={<TextColumnThree20Regular />}
              onClick={(e) => setColumnsAnchorEl(e.currentTarget)}
            >
              Columns
            </SecondaryButton>

            <Button
              variant="contained"
              startIcon={<Add20Regular />}
              onClick={() => navigate("/questions/new")}
            >
              New question
            </Button>

            <TextField
              size="small"
              placeholder="Search questions…"
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
          </>
        )}
      </Stack>

      {!datasetId ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {questionDatasets.length === 0
              ? "No question datasets available. Import one first."
              : "Select a dataset to view questions."}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: "none",
              border: 1,
              borderColor: "divider",
              overflowX: "auto",
              position: "relative",
              width: "100%",
              minWidth: 0,
            }}
          >
            {isAnyLoading && (
              <LinearProgress
                sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, borderRadius: "4px 4px 0 0", height: 2 }}
              />
            )}
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 240, whiteSpace: "nowrap" }}>Question</TableCell>
                  <TableCell sx={{ minWidth: 160, whiteSpace: "nowrap" }}>Slug</TableCell>
                  {orderedVisibleCols.map((col) => (
                    <TableCell
                      key={col}
                      align={COLUMN_HEADERS[col].align}
                      sx={{ minWidth: 80, whiteSpace: "nowrap" }}
                    >
                      {COLUMN_HEADERS[col].label}
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {showSkeletons ? (
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                    <QuestionRow
                      key={`skel-${i}`}
                      loading
                      visibleColumns={new Set(orderedVisibleCols)}
                    />
                  ))
                ) : showRefreshSkeletons ? (
                  questions.map((_, i) => (
                    <QuestionRow
                      key={`ref-${i}`}
                      loading
                      visibleColumns={new Set(orderedVisibleCols)}
                    />
                  ))
                ) : questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + orderedVisibleCols.length} sx={{ py: 6, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">No questions found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      visibleColumns={new Set(orderedVisibleCols)}
                      onClick={() => navigate(`/questions/${q.id}`)}
                      onEdit={() => navigate(`/questions/${q.id}`)}
                      onDelete={async () => {
                        const ok = await confirm({
                          title: "Delete question",
                          description: `Delete "${q.slug}"? This action cannot be undone.`,
                          confirmText: "Delete",
                          danger: true,
                        });
                        if (ok) {
                          try {
                            await questionsService.deleteQuestion(q.id);
                            enqueueSnackbar("Question deleted", { variant: "success" });
                            fetchQuestions();
                          } catch (err) {
                            enqueueSnackbar(err instanceof Error ? err.message : "Failed to delete", { variant: "error" });
                          }
                        }
                      }}
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
              page={page - 1}
              rowsPerPage={pageSize}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              onPageChange={(_, p) => setPage(p + 1)}
              onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              labelRowsPerPage="Rows per page:"
              sx={{ mt: 1 }}
            />
          )}
        </>
      )}

      <QuestionFilterPopover
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        filters={filters}
        themes={themes}
        onApply={handleApplyFilters}
      />

      <QuestionColumnsPopover
        anchorEl={columnsAnchorEl}
        open={Boolean(columnsAnchorEl)}
        onClose={() => setColumnsAnchorEl(null)}
        visibleOptional={visibleOptional}
        onToggle={(key) =>
          setVisibleOptional((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          })
        }
      />
    </PageContainer>
  );
}
