import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
  styled,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  CheckmarkCircle20Filled,
  Delete20Regular,
  DismissCircle20Filled,
  Eye20Regular,
  EyeOff20Regular,
  MoreVertical20Regular,
  Star20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import type { UnifiedDataset } from "@/hooks/useDatasetsList";
import { DenseDivider, SquareMenu, SquareMenuItem } from "@/components/Common/RowActionMenu";

const BorderedCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  transition: "background-color 0.3s ease",
  height: "100%",
  boxSizing: "border-box",
}));

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

function formatCount(dataset: UnifiedDataset): string {
  if (dataset.type === "questions") {
    const n = dataset.question_count ?? 0;
    return `${n.toLocaleString()} question${n !== 1 ? "s" : ""}`;
  }
  const n = dataset.country_count ?? 0;
  return `${n.toLocaleString()} countr${n !== 1 ? "ies" : "y"}`;
}

export default function DatasetCard({ dataset, loading, onSetDefault, onToggleActive, onDelete }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (loading) {
    return (
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <BorderedCard sx={{ cursor: "default", "&:hover": { bgcolor: "background.paper" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton variant="text" width={130} sx={{ fontSize: "1rem" }} />
            <Skeleton variant="text" width={64} sx={{ fontSize: "0.8rem" }} />
          </Box>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Skeleton variant="text" width="55%" sx={{ fontSize: "0.75rem", mb: 0.5 }} />
            <Box sx={{ display: "flex", gap: 0.75 }}>
              <Skeleton variant="rounded" width={80} height={20} />
              <Skeleton variant="rounded" width={60} height={20} />
              <Skeleton variant="rounded" width={40} height={20} />
            </Box>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton variant="text" width={60} sx={{ fontSize: "0.8rem" }} />
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        </BorderedCard>
      </Grid>
    );
  }

  if (!dataset) return null;

  const hasUpdate =
    dataset.latest_available_version &&
    dataset.latest_available_version !== dataset.version;

  return (
    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
      <BorderedCard>
        {/* Header: name + type label */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ minWidth: 0, mr: 1 }}>
            {dataset.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {TYPE_LABELS[dataset.type] ?? dataset.type}
          </Typography>
        </Box>

        {/* Middle: slug + chips */}
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontFamily: "monospace", display: "block", mb: 0.75 }}
            noWrap
          >
            {dataset.slug}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            <Chip
              label={formatCount(dataset)}
              size="small"
              color="secondary"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
            <Chip
              label={SOURCE_LABELS[dataset.source] ?? dataset.source}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
            <Chip
              label={`v${dataset.version}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem", fontFamily: "monospace" }}
            />
            {hasUpdate && (
              <Chip
                label={`v${dataset.latest_available_version} available`}
                size="small"
                color="warning"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Footer: status + actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {dataset.is_active ? (
              <>
                <Box component={CheckmarkCircle20Filled} sx={{ fontSize: 18, color: "primary.main", mr: 0.5 }} />
                <Typography variant="body2" color="primary.main">Active</Typography>
              </>
            ) : (
              <>
                <Box component={DismissCircle20Filled} sx={{ fontSize: 18, color: "text.secondary", mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">Inactive</Typography>
              </>
            )}
            {dataset.is_default && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
                · Default
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchor(e.currentTarget);
            }}
          >
            <MoreVertical20Regular />
          </IconButton>
        </Box>
      </BorderedCard>

      <SquareMenu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        MenuListProps={{ dense: true }}
      >
        {!dataset.is_default && (
          <SquareMenuItem onClick={() => { setAnchor(null); onSetDefault?.(dataset); }}>
            <ListItemIcon><Star20Regular /></ListItemIcon>
            <ListItemText>Set as default</ListItemText>
          </SquareMenuItem>
        )}
        <SquareMenuItem onClick={() => { setAnchor(null); onToggleActive?.(dataset); }}>
          <ListItemIcon>
            {dataset.is_active ? <EyeOff20Regular /> : <Eye20Regular />}
          </ListItemIcon>
          <ListItemText>{dataset.is_active ? "Deactivate" : "Activate"}</ListItemText>
        </SquareMenuItem>
        <DenseDivider />
        <Tooltip
          title={dataset.is_default ? "Cannot delete the default dataset" : ""}
          placement="left"
        >
          <span>
            <SquareMenuItem
              onClick={() => { setAnchor(null); onDelete?.(dataset); }}
              disabled={dataset.is_default}
            >
              <ListItemIcon sx={{ color: "error.main" }}><Delete20Regular /></ListItemIcon>
              <ListItemText sx={{ color: "error.main" }}>Delete</ListItemText>
            </SquareMenuItem>
          </span>
        </Tooltip>
      </SquareMenu>
    </Grid>
  );
}
