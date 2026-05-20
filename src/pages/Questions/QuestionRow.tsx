import {
  Box,
  Chip,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Question } from "@/lib/types/question.types";
import type { QuestionColumnKey } from "./QuestionColumnsPopover";

const ROW_HEIGHT = 43;

interface QuestionRowProps {
  question?: Question;
  loading?: boolean;
  visibleColumns: Set<QuestionColumnKey>;
  onClick?: () => void;
}

const DIFFICULTY_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

function formatSeconds(s: number): string {
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

function formatMs(ms: number): string {
  if (ms >= 60_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  if (ms >= 1_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function cellFor(col: QuestionColumnKey, q: Question) {
  switch (col) {
    case "qtype":
      return (
        <TableCell key={col}>
          <Chip
            label={q.qtype === "text_input" ? "text" : q.qtype}
            size="small"
            variant="outlined"
            sx={{ height: 18, fontSize: "0.7rem" }}
          />
        </TableCell>
      );
    case "difficulty":
      return (
        <TableCell key={col}>
          <Chip
            label={q.difficulty}
            size="small"
            color={DIFFICULTY_COLOR[q.difficulty] ?? "default"}
            sx={{ height: 18, fontSize: "0.7rem" }}
          />
        </TableCell>
      );
    case "theme":
      return (
        <TableCell key={col}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{q.theme?.slug ?? "—"}</Typography>
        </TableCell>
      );
    case "kind":
      return (
        <TableCell key={col}>
          <Typography variant="body2" noWrap>{q.kind || "—"}</Typography>
        </TableCell>
      );
    case "tags":
      return (
        <TableCell key={col}>
          {q.tags?.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="nowrap">
              {q.tags.slice(0, 3).map((t) => (
                <Chip key={t.id} label={t.slug} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />
              ))}
              {q.tags.length > 3 && (
                <Tooltip title={q.tags.slice(3).map((t) => t.slug).join(", ")}>
                  <Chip label={`+${q.tags.length - 3}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />
                </Tooltip>
              )}
            </Stack>
          ) : <Typography variant="body2">—</Typography>}
        </TableCell>
      );
    case "est_time":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">{q.estimated_seconds ? formatSeconds(q.estimated_seconds) : "—"}</Typography>
        </TableCell>
      );
    case "success_rate":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">
            {q.success_rate != null ? `${(q.success_rate * 100).toFixed(0)}%` : "—"}
          </Typography>
        </TableCell>
      );
    case "times_played":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">{q.times_played ?? "—"}</Typography>
        </TableCell>
      );
    case "avg_time":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">{q.avg_time_ms ? formatMs(q.avg_time_ms) : "—"}</Typography>
        </TableCell>
      );
    case "version":
      return (
        <TableCell key={col}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{q.version || "—"}</Typography>
        </TableCell>
      );
    case "created_at":
      return (
        <TableCell key={col}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}
          </Typography>
        </TableCell>
      );
    default:
      return <TableCell key={col} />;
  }
}

function skeletonCellFor(col: QuestionColumnKey) {
  if (col === "difficulty" || col === "qtype" || col === "kind") {
    return (
      <TableCell key={col}>
        <Skeleton variant="rounded" width={44} height={18} />
      </TableCell>
    );
  }
  if (col === "tags") {
    return (
      <TableCell key={col}>
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="rounded" width={36} height={18} />
          <Skeleton variant="rounded" width={36} height={18} />
        </Stack>
      </TableCell>
    );
  }
  const alignRight = new Set<QuestionColumnKey>(["est_time", "success_rate", "times_played", "avg_time"]);
  const widths: Partial<Record<QuestionColumnKey, number>> = {
    theme: 90, est_time: 40, success_rate: 40, times_played: 36,
    avg_time: 40, version: 56, created_at: 72,
  };
  return (
    <TableCell key={col} align={alignRight.has(col) ? "right" : undefined}>
      <Skeleton variant="text" width={widths[col] ?? 80} sx={{ fontSize: "0.875rem" }} />
    </TableCell>
  );
}

export default function QuestionRow({ question, loading, visibleColumns, onClick }: QuestionRowProps) {
  if (loading || !question) {
    return (
      <TableRow sx={{ height: ROW_HEIGHT }}>
        <TableCell>
          <Skeleton variant="text" width={180} sx={{ fontSize: "0.875rem" }} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={120} sx={{ fontSize: "0.875rem" }} />
        </TableCell>
        {Array.from(visibleColumns).map((col) => skeletonCellFor(col))}
      </TableRow>
    );
  }

  const title = question.i18n?.["en"]?.title ?? question.i18n?.["fr"]?.title ?? Object.values(question.i18n ?? {})[0]?.title ?? question.slug;

  return (
    <TableRow hover sx={{ cursor: "pointer", height: ROW_HEIGHT }} onClick={onClick}>
      <TableCell>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{title}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontFamily: "monospace", fontSize: "0.78rem", maxWidth: 200 }}>{question.slug}</Typography>
      </TableCell>
      {Array.from(visibleColumns).map((col) => cellFor(col, question))}
    </TableRow>
  );
}
