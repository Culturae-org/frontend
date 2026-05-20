import {
  Chip,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete20Regular,
  Eye20Regular,
  EyeOff20Regular,
  Star20Regular,
} from "@fluentui/react-icons";
import type { UnifiedDataset } from "@/hooks/useDatasetsList";
import { RowActionMenu } from "@/components/Common/RowActionMenu";

interface Props {
  dataset?: UnifiedDataset;
  loading?: boolean;
  onSetDefault?: (d: UnifiedDataset) => void;
  onToggleActive?: (d: UnifiedDataset) => void;
  onDelete?: (d: UnifiedDataset) => void;
}

const TYPE_LABELS: Record<string, string> = {
  questions: "Knowledge",
  geography: "Geography",
};

const SOURCE_LABELS: Record<string, string> = {
  cultpedia: "Cultpedia",
  custom: "Custom",
  imported: "Imported",
};

const ROW_HEIGHT = 52;

export default function DatasetRow({ dataset, loading, onSetDefault, onToggleActive, onDelete }: Props) {
  if (loading || !dataset) {
    return (
      <TableRow sx={{ height: ROW_HEIGHT }}>
        <TableCell>
          <Skeleton variant="text" width={150} sx={{ fontSize: "0.875rem" }} />
          <Skeleton variant="text" width={90} sx={{ fontSize: "0.75rem" }} />
        </TableCell>
        <TableCell><Skeleton variant="rounded" width={72} height={20} /></TableCell>
        <TableCell><Skeleton variant="text" width={70} /></TableCell>
        <TableCell><Skeleton variant="text" width={48} /></TableCell>
        <TableCell><Skeleton variant="text" width={80} /></TableCell>
        <TableCell><Skeleton variant="rounded" width={56} height={20} /></TableCell>
        <TableCell />
      </TableRow>
    );
  }

  const stats = dataset.type === "questions"
    ? `${dataset.question_count ?? 0} questions`
    : `${dataset.country_count ?? 0} countries`;

  const actions = [
    ...(!dataset.is_default ? [{
      label: "Set as default",
      icon: <Star20Regular />,
      onClick: () => onSetDefault?.(dataset),
    }] : []),
    {
      label: dataset.is_active ? "Deactivate" : "Activate",
      icon: dataset.is_active ? <EyeOff20Regular /> : <Eye20Regular />,
      onClick: () => onToggleActive?.(dataset),
    },
    {
      label: "Delete",
      icon: <Delete20Regular />,
      onClick: () => onDelete?.(dataset),
      danger: true,
      disabled: dataset.is_default,
    },
  ];

  return (
    <TableRow hover sx={{ height: ROW_HEIGHT }}>
      <TableCell>
        <Typography variant="body2" fontWeight={600} noWrap>{dataset.name}</Typography>
        <Typography variant="caption" color="text.disabled" noWrap sx={{ fontFamily: "monospace" }}>{dataset.slug}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={TYPE_LABELS[dataset.type] ?? dataset.type}
          size="small"
          color={dataset.type === "questions" ? "info" : "success"}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">{SOURCE_LABELS[dataset.source] ?? dataset.source}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{dataset.version}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{stats}</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {dataset.is_default && (
            <Chip label="Default" size="small" color="primary" />
          )}
          <Chip
            label={dataset.is_active ? "Active" : "Inactive"}
            size="small"
            color={dataset.is_active ? "success" : "default"}
            variant={dataset.is_active ? "filled" : "outlined"}
          />
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Tooltip
          title={dataset.is_default ? "Cannot delete the default dataset" : ""}
          placement="left"
        >
          <span>
            <RowActionMenu
              title="Actions"
              actions={actions}
            />
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
