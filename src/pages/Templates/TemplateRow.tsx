import {
  Chip,
  Skeleton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete20Regular,
  Edit20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router";
import type { GameTemplate } from "@/lib/types/game-template.types";
import {
  CATEGORY_LABELS,
  FLAG_VARIANT_LABELS,
  MODE_LABELS,
  SCORE_MODE_LABELS,
} from "@/lib/constants/game-template.constants";
import { RowActionMenu } from "@/components/Common/RowActionMenu";
import { useDateFormat } from "@/hooks/useDateFormat";

export type TemplateOptionalColumn =
  | "time_bonus"
  | "xp_multiplier"
  | "flag_variant"
  | "continent"
  | "language"
  | "created_at"
  | "updated_at";

export const OPTIONAL_COLUMNS: { key: TemplateOptionalColumn; label: string }[] = [
  { key: "flag_variant", label: "Flag variant" },
  { key: "time_bonus", label: "Time bonus" },
  { key: "xp_multiplier", label: "XP multiplier" },
  { key: "continent", label: "Continent" },
  { key: "language", label: "Language" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
];

export const OPTIONAL_COLUMN_MIN_WIDTHS: Partial<Record<TemplateOptionalColumn, number>> = {
  flag_variant: 140,
  time_bonus: 90,
  xp_multiplier: 90,
  continent: 90,
  language: 80,
  created_at: 100,
  updated_at: 100,
};

interface TemplateRowProps {
  template?: GameTemplate;
  loading?: boolean;
  visibleOptional?: Set<TemplateOptionalColumn>;
  onDelete?: (t: GameTemplate) => void;
}

const MODE_COLORS: Record<string, "default" | "primary" | "secondary" | "info" | "success" | "warning"> = {
  solo: "primary",
  "1v1": "warning",
  multi: "success",
};

const CATEGORY_COLORS: Record<string, "default" | "primary" | "secondary" | "info" | "success" | "warning"> = {
  general: "default",
  flags: "primary",
  geography: "secondary",
};

const CONTINENT_LABELS: Record<string, string> = {
  AF: "Africa", AN: "Antarctica", AS: "Asia",
  EU: "Europe", NA: "North America", OC: "Oceania", SA: "South America",
};

export default function TemplateRow({ template, loading, visibleOptional = new Set(), onDelete }: TemplateRowProps) {
  const navigate = useNavigate();
  const { formatDateOnly } = useDateFormat();

  const totalCells = 8 + visibleOptional.size;

  if (loading || !template) {
    return (
      <TableRow sx={{ height: 43 }}>
        {Array.from({ length: totalCells }).map((_, i) => (
          <TableCell key={i}>
            <Skeleton variant="text" width={i === 0 ? 160 : i === 1 ? 130 : 70} sx={{ fontSize: "0.875rem" }} />
          </TableCell>
        ))}
        <TableCell />
      </TableRow>
    );
  }

  const modeLabel = MODE_LABELS[template.mode] ?? template.mode;
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;
  const scoreModeLabel = SCORE_MODE_LABELS[template.score_mode] ?? template.score_mode;
  const players = template.min_players === template.max_players
    ? `${template.min_players}`
    : `${template.min_players}–${template.max_players}`;

  const goToEdit = () => navigate(`/templates/${template.id}`);

  return (
    <TableRow hover onClick={goToEdit} sx={{ cursor: "pointer", height: 43 }}>
      <TableCell>
        <Typography variant="body2" fontWeight={600} noWrap>{template.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem", color: "text.secondary" }} noWrap>
          {template.slug}
        </Typography>
      </TableCell>
      <TableCell>
        {template.mode ? (
          <Chip label={modeLabel} size="small" color={MODE_COLORS[template.mode] ?? "default"} variant="outlined" />
        ) : "—"}
      </TableCell>
      <TableCell>
        {template.category ? (
          <Chip label={categoryLabel} size="small" color={CATEGORY_COLORS[template.category] ?? "default"} variant="outlined" />
        ) : "—"}
      </TableCell>
      <TableCell align="center">{template.question_count}</TableCell>
      <TableCell align="center">{players}</TableCell>
      <TableCell>
        <Tooltip title={scoreModeLabel}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 110 }}>{scoreModeLabel}</Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Chip
          label={template.is_active ? "Active" : "Inactive"}
          size="small"
          color={template.is_active ? "primary" : "default"}
          variant={template.is_active ? "filled" : "outlined"}
        />
      </TableCell>

      {visibleOptional.has("flag_variant") && (
        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 130 }}>
            {template.flag_variant ? (FLAG_VARIANT_LABELS[template.flag_variant] ?? template.flag_variant) : "—"}
          </Typography>
        </TableCell>
      )}
      {visibleOptional.has("time_bonus") && (
        <TableCell>
          <Chip
            label={template.time_bonus ? "Yes" : "No"}
            size="small"
            color={template.time_bonus ? "primary" : "default"}
            variant="outlined"
          />
        </TableCell>
      )}
      {visibleOptional.has("xp_multiplier") && (
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {template.xp_multiplier != null ? `${template.xp_multiplier}×` : "—"}
          </Typography>
        </TableCell>
      )}
      {visibleOptional.has("continent") && (
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {template.continent ? (CONTINENT_LABELS[template.continent] ?? template.continent) : "—"}
          </Typography>
        </TableCell>
      )}
      {visibleOptional.has("language") && (
        <TableCell>
          {template.language ? (
            <Chip label={template.language.toUpperCase()} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          ) : "—"}
        </TableCell>
      )}
      {visibleOptional.has("created_at") && (
        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap>{formatDateOnly(template.created_at)}</Typography>
        </TableCell>
      )}
      {visibleOptional.has("updated_at") && (
        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap>{formatDateOnly(template.updated_at)}</Typography>
        </TableCell>
      )}

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <RowActionMenu
          actions={[
            {
              label: "Edit",
              icon: <Edit20Regular />,
              onClick: goToEdit,
            },
            {
              label: "Delete",
              icon: <Delete20Regular />,
              onClick: () => onDelete?.(template),
              danger: true,
            },
          ]}
        />
      </TableCell>
    </TableRow>
  );
}
