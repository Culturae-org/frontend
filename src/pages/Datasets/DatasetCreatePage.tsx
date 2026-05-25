import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid2,
  Stack,
  Switch,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { ArrowLeft20Regular, Add20Regular } from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { datasetsService } from "@/lib/services/datasets.service";
import PageContainer from "@/components/Common/PageContainer";
import { SecondaryButton } from "@/components/Common/StyledComponents";

type FormValues = {
  slug: string;
  name: string;
  description: string;
  version: string;
  is_default: boolean;
};

const DEFAULTS: FormValues = {
  slug: "", name: "", description: "", version: "1.0",
  is_default: false,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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

const CreateBarContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  position: "fixed",
  backgroundColor: theme.palette.background.paper,
  bottom: 23,
  zIndex: theme.zIndex.modal,
}));

function CreateBar({ saving }: { saving: boolean }) {
  return (
    <>
      <Box sx={{ height: 70 }} />
      <CreateBarContainer>
        <Button
          type="submit"
          form="dataset-create-form"
          variant="contained"
          disabled={saving}
          startIcon={
            saving
              ? <CircularProgress size={16} color="inherit" />
              : <Add20Regular style={{ fontSize: 18 }} />
          }
        >
          Create dataset
        </Button>
      </CreateBarContainer>
    </>
  );
}

export default function DatasetCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const {
    control, handleSubmit, setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS });

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true);
    try {
      const created = await datasetsService.createDataset({
        slug: data.slug,
        name: data.name,
        description: data.description || undefined,
        version: data.version,
        source: "custom",
        is_default: data.is_default,
      });
      enqueueSnackbar(`"${created.name}" created`, { variant: "success" });
      navigate("/datasets");
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to create", { variant: "error" });
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
        <Typography variant="subtitle1" fontWeight={600}>New dataset</Typography>
      </Box>

      <Box component="form" id="dataset-create-form" onSubmit={onSubmit}>
        <Stack spacing={5}>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Basic info</Typography>
            <SettingSectionContent>
              <SettingForm title="Name" lgWidth={6}>
                <Controller name="name" control={control} rules={{ required: "Required" }} render={({ field }) => (
                  <TextField
                    {...field} fullWidth size="small"
                    error={!!errors.name} helperText={errors.name?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      setValue("slug", slugify(e.target.value), { shouldDirty: true });
                    }}
                  />
                )} />
              </SettingForm>

              <SettingForm title="Slug" lgWidth={6} helper="Unique identifier used in the API.">
                <Controller name="slug" control={control} rules={{ required: "Required", pattern: { value: /^[a-z0-9-]+$/, message: "Lowercase, numbers and hyphens only" } }} render={({ field }) => (
                  <TextField
                    {...field} fullWidth size="small"
                    error={!!errors.slug} helperText={errors.slug?.message}
                    slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                  />
                )} />
              </SettingForm>

              <SettingForm title="Description" lgWidth={7}>
                <Controller name="description" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth size="small" multiline rows={2} />
                )} />
              </SettingForm>

              <SettingForm title="Version" lgWidth={3}>
                <Controller name="version" control={control} rules={{ required: "Required" }} render={({ field }) => (
                  <TextField {...field} fullWidth size="small" error={!!errors.version} helperText={errors.version?.message} />
                )} />
              </SettingForm>

              <SettingForm lgWidth={6}>
                <Controller name="is_default" control={control} render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                    label="Set as default dataset"
                  />
                )} />
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

        </Stack>
      </Box>

      <CreateBar saving={saving} />
    </PageContainer>
  );
}
