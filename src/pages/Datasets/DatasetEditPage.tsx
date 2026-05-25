import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid2,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { ArrowLeft20Regular, Save20Regular } from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { datasetsService } from "@/lib/services/datasets.service";
import PageContainer from "@/components/Common/PageContainer";
import { SecondaryButton } from "@/components/Common/StyledComponents";

type FormValues = {
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
};

const SettingSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(0, 4),
  },
}));

const SettingSectionContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(0, 4),
  },
}));

function SettingForm({
  title, children, lgWidth = 8, helper,
}: {
  title?: string; children: React.ReactNode; lgWidth?: number; helper?: string;
}) {
  return (
    <Grid2 container>
      <Grid2 size={{ md: lgWidth, xs: 12 }}>
        {title && (
          <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>{title}</Typography>
        )}
        {children}
        {helper && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>{helper}</Typography>
        )}
      </Grid2>
    </Grid2>
  );
}

const SaveBarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  position: "fixed",
  backgroundColor: theme.palette.background.paper,
  bottom: 23,
  zIndex: theme.zIndex.modal,
}));

function SaveBar({ saving }: { saving: boolean }) {
  return (
    <>
      <Box sx={{ height: 70 }} />
      <SaveBarContainer>
        <Button
          type="submit"
          form="dataset-edit-form"
          variant="contained"
          disabled={saving}
          startIcon={
            saving
              ? <CircularProgress size={16} color="inherit" />
              : <Save20Regular style={{ fontSize: 18 }} />
          }
        >
          Save changes
        </Button>
      </SaveBarContainer>
    </>
  );
}

export default function DatasetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [loading, setLoading] = useState(true);

  const {
    control, handleSubmit, reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", description: "", is_active: true, is_default: false },
  });

  useEffect(() => {
    if (!id) return;
    datasetsService.getDatasetById(id).then((dataset) => {
      if (!dataset) { navigate("/datasets"); return; }
      setDatasetName(dataset.name);
      reset({
        name: dataset.name,
        description: dataset.description ?? "",
        is_active: dataset.is_active,
        is_default: dataset.is_default,
      });
    }).catch(() => {
      enqueueSnackbar("Dataset not found", { variant: "error" });
      navigate("/datasets");
    }).finally(() => setLoading(false));
  }, [id]);

  const onSubmit = handleSubmit(async (data) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await datasetsService.updateDataset(id, {
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
        is_default: data.is_default,
      });
      setDatasetName(updated.name);
      enqueueSnackbar("Dataset updated", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to save", { variant: "error" });
    } finally {
      setSaving(false);
    }
  });

  return (
    <PageContainer>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <SecondaryButton
          size="small"
          startIcon={<ArrowLeft20Regular style={{ fontSize: 18 }} />}
          onClick={() => navigate("/datasets")}
          sx={{ minWidth: 0, px: 1.5 }}
        >
          Datasets
        </SecondaryButton>
        <Typography color="text.disabled">/</Typography>
        {loading
          ? <Skeleton variant="text" width={160} />
          : <Typography variant="subtitle1" fontWeight={600}>{datasetName}</Typography>
        }
      </Box>

      <Box component="form" id="dataset-edit-form" onSubmit={onSubmit}>
        <Stack spacing={5}>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Basic info</Typography>
            <SettingSectionContent>
              <SettingForm title="Name" lgWidth={6}>
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="name" control={control} rules={{ required: "Required" }} render={({ field }) => (
                    <TextField
                      {...field} fullWidth size="small"
                      error={!!errors.name} helperText={errors.name?.message}
                    />
                  )} />
                )}
              </SettingForm>

              <SettingForm title="Description" lgWidth={7}>
                {loading ? <Skeleton variant="rounded" height={72} /> : (
                  <Controller name="description" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth size="small" multiline rows={2} />
                  )} />
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Status</Typography>
            <SettingSectionContent>
              <SettingForm lgWidth={6}>
                {loading ? <Skeleton variant="rounded" height={38} width={160} /> : (
                  <Controller name="is_active" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                      label="Active"
                    />
                  )} />
                )}
              </SettingForm>

              <SettingForm lgWidth={6} helper="Only one dataset can be the default at a time. Setting this as default will unset the previous one.">
                {loading ? <Skeleton variant="rounded" height={38} width={200} /> : (
                  <Controller name="is_default" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                      label="Default dataset"
                    />
                  )} />
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

        </Stack>
      </Box>

      <SaveBar saving={saving} />
    </PageContainer>
  );
}
