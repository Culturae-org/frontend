import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { enqueueSnackbar } from "notistack";
import { datasetsService } from "@/lib/services/datasets.service";
import { geographyService } from "@/lib/services/geography.service";
import SettingForm from "@/components/Settings/SettingForm";

const CULTPEDIA_KNOWLEDGE_URL =
  "https://raw.githubusercontent.com/Culturae-org/cultpedia/refs/heads/main/datasets/general-knowledge/manifest.json";
const CULTPEDIA_GEOGRAPHY_URL =
  "https://raw.githubusercontent.com/Culturae-org/cultpedia/refs/heads/main/datasets/geography/manifest.json";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Source = "cultpedia" | "url";
type DatasetType = "questions" | "geography";

export default function DatasetImportDialog({ open, onClose, onSuccess }: Props) {
  const [source, setSource] = useState<Source>("cultpedia");
  const [type, setType] = useState<DatasetType>("questions");
  const [customUrl, setCustomUrl] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState<{ message: string; errors: string[] } | null>(null);

  const isCultpedia = source === "cultpedia";
  const cultpediaUrl = type === "questions" ? CULTPEDIA_KNOWLEDGE_URL : CULTPEDIA_GEOGRAPHY_URL;
  const activeUrl = isCultpedia ? cultpediaUrl : customUrl.trim();

  const canSubmit = !!activeUrl;

  const handleImport = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setImportError(null);
    try {
      let result;
      if (type === "questions") {
        result = await datasetsService.importDataset({ manifest_url: activeUrl, set_as_default: setAsDefault });
      } else {
        result = await geographyService.importDataset({ manifest_url: activeUrl, dataset_type: "geography", set_as_default: setAsDefault });
      }
      const hasErrors = !result.success || (result.errors && result.errors.length > 0);
      if (hasErrors) {
        setImportError({ message: result.message || "Import completed with errors", errors: result.errors ?? [] });
        onSuccess(); // refresh list — some data may have been imported
        enqueueSnackbar("Import completed with errors", { variant: "warning" });
      } else {
        enqueueSnackbar("Dataset imported successfully", { variant: "success" });
        onSuccess();
        handleClose();
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Import failed", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSource("cultpedia");
    setType("questions");
    setCustomUrl("");
    setSetAsDefault(false);
    setImportError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Import dataset</Typography>
        <IconButton size="small" onClick={handleClose} disabled={loading}>
          <Dismiss24Regular />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={3}>

          <SettingForm lgWidth={12} title="Source">
            <RadioGroup
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
            >
              <FormControlLabel
                value="cultpedia"
                control={<Radio size="small" />}
                label={
                  <Stack>
                    <Typography variant="body2">Cultpedia</Typography>
                    <Typography variant="caption" color="text.disabled">
                      Official datasets maintained by the{" "}
                      <Link
                        href="https://github.com/Culturae-org/cultpedia"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Culturae organization
                      </Link>
                    </Typography>
                  </Stack>
                }
                sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 0.5 } }}
              />
              <FormControlLabel
                value="url"
                control={<Radio size="small" />}
                label={
                  <Stack>
                    <Typography variant="body2">Custom manifest URL</Typography>
                    <Typography variant="caption" color="text.disabled">
                      Import from any compatible manifest.json
                    </Typography>
                  </Stack>
                }
                sx={{ alignItems: "flex-start", mt: 0.5, "& .MuiRadio-root": { pt: 0.5 } }}
              />
            </RadioGroup>
          </SettingForm>

          <Divider />

          {/* Shared fields — always visible */}
          <SettingForm lgWidth={12} title="Dataset type">
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as DatasetType)}
                label="Type"
                disabled={loading}
              >
                <MenuItem value="questions">Knowledge (questions)</MenuItem>
                <MenuItem value="geography">Geography (countries / flags)</MenuItem>
              </Select>
            </FormControl>
          </SettingForm>

          <SettingForm lgWidth={12} title="Manifest URL">
            <TextField
              fullWidth
              size="small"
              placeholder="https://example.com/dataset/manifest.json"
              value={isCultpedia ? cultpediaUrl : customUrl}
              onChange={isCultpedia ? undefined : (e) => setCustomUrl(e.target.value)}
              disabled={loading}
              slotProps={{
                htmlInput: {
                  readOnly: isCultpedia,
                  style: { fontFamily: "monospace", fontSize: "0.8rem" },
                },
              }}
              helperText={
                isCultpedia
                  ? "Pre-filled with the official Cultpedia manifest"
                  : "URL pointing to a valid manifest.json file"
              }
              sx={isCultpedia ? { "& .MuiInputBase-root": { bgcolor: "action.hover" } } : undefined}
            />
          </SettingForm>

          <Divider />

          {/* Set as default */}
          <SettingForm lgWidth={12} title="Set as default">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={setAsDefault}
                  onChange={(_, v) => setSetAsDefault(v)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Replace the current default {type === "questions" ? "knowledge" : "geography"} dataset
                </Typography>
              }
            />
          </SettingForm>

          {importError && (
            <Alert severity="error" onClose={() => setImportError(null)}>
              <AlertTitle>{importError.message}</AlertTitle>
              {importError.errors.map((e, i) => (
                <Typography key={i} variant="caption" display="block" sx={{ fontFamily: "monospace", mt: 0.25 }}>{e}</Typography>
              ))}
            </Alert>
          )}

        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="text" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={loading || !canSubmit}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Importing…" : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
