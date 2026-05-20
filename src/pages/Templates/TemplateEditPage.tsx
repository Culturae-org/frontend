import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid2,
  Grow,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import {
  ArrowLeft20Regular,
  Checkmark20Regular,
  ArrowCounterclockwise20Regular,
} from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import gameTemplatesService from "@/lib/services/game-templates.service";
import { datasetsService } from "@/lib/services/datasets.service";
import type { GameTemplate } from "@/lib/types/game-template.types";
import type { QuestionDataset } from "@/lib/types/datasets.types";
import type { GeographyDataset } from "@/lib/types/geography.types";
import {
  FLAG_VARIANT_OPTIONS,
  MODE_LABELS,
  CATEGORY_LABELS,
  SCORE_MODE_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  FIXED_PLAYER_COUNT_MODES,
  MODE_DEFAULTS,
} from "@/lib/constants/game-template.constants";
import PageContainer from "@/components/Common/PageContainer";
import { SecondaryButton, SquareChip, StyledTab, StyledTabs } from "@/components/Common/StyledComponents";

const I18N_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
] as const;

type I18nCode = typeof I18N_LANGS[number]["code"];

type FormValues = {
  name: string;
  slug: string;
  description: string;
  name_i18n_en: string; name_i18n_es: string; name_i18n_fr: string;
  description_i18n_en: string; description_i18n_es: string; description_i18n_fr: string;
  mode: string;
  category: string;
  dataset_id: string;
  question_count: number;
  min_players: number;
  max_players: number;
  question_type: string;
  flag_variant: string;
  continent: string;
  include_territories: boolean;
  score_mode: string;
  time_bonus: boolean;
  points_per_correct: number;
  xp_multiplier: number;
  is_active: boolean;
};

const CONTINENTS = ["", "AF", "AN", "AS", "EU", "NA", "OC", "SA"];
const CONTINENT_LABELS: Record<string, string> = {
  "": "All", AF: "Africa", AN: "Antarctica", AS: "Asia",
  EU: "Europe", NA: "North America", OC: "Oceania", SA: "South America",
};

const MODE_COLORS: Record<string, "default" | "info" | "warning" | "success"> = {
  solo: "info", "1v1": "warning", multi: "success",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toForm(t: GameTemplate): FormValues {
  return {
    name: t.name ?? "",
    slug: t.slug ?? "",
    description: t.description ?? "",
    name_i18n_en: t.name_i18n?.en ?? "",
    name_i18n_es: t.name_i18n?.es ?? "",
    name_i18n_fr: t.name_i18n?.fr ?? "",
    description_i18n_en: t.description_i18n?.en ?? "",
    description_i18n_es: t.description_i18n?.es ?? "",
    description_i18n_fr: t.description_i18n?.fr ?? "",
    mode: t.mode ?? "solo",
    category: t.category ?? "general",
    dataset_id: t.dataset_id ?? "",
    question_count: t.question_count ?? 10,
    min_players: t.min_players ?? 1,
    max_players: t.max_players ?? 1,
    question_type: t.question_type ?? "mcq_4",
    flag_variant: t.flag_variant ?? "flag_to_name_4",
    continent: t.continent ?? "",
    include_territories: t.include_territories ?? false,
    score_mode: t.score_mode ?? "classic",
    time_bonus: t.time_bonus ?? false,
    points_per_correct: t.points_per_correct ?? 100,
    xp_multiplier: t.xp_multiplier ?? 1,
    is_active: t.is_active ?? true,
  };
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
  title,
  children,
  lgWidth = 8,
  helper,
}: {
  title?: string;
  children: React.ReactNode;
  lgWidth?: number;
  helper?: string;
}) {
  return (
    <Grid2 container>
      <Grid2 size={{ md: lgWidth, xs: 12 }}>
        {title && (
          <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
        )}
        {children}
        {helper && <FormHelperText sx={{ ml: 0 }}>{helper}</FormHelperText>}
      </Grid2>
    </Grid2>
  );
}

const SavingFloatContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(2),
  position: "fixed",
  backgroundColor: theme.palette.background.paper,
  bottom: 23,
  zIndex: theme.zIndex.modal,
}));

interface SavingFloatProps {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onRevert: () => void;
}

function SavingFloat({ visible, saving, onSave, onRevert }: SavingFloatProps) {
  return (
    <>
      <Box sx={{ height: 70 }} />
      <Grow in={visible}>
        <SavingFloatContainer>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
            startIcon={
              saving
                ? <CircularProgress size={16} color="inherit" />
                : <Checkmark20Regular style={{ fontSize: 18 }} />
            }
          >
            Save
          </Button>
          <SecondaryButton
            disabled={saving}
            onClick={onRevert}
            sx={{ ml: 1 }}
            variant="contained"
            startIcon={<ArrowCounterclockwise20Regular style={{ fontSize: 18 }} />}
          >
            Revert
          </SecondaryButton>
        </SavingFloatContainer>
      </Grow>
    </>
  );
}

export default function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<GameTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [i18nLang, setI18nLang] = useState<I18nCode>("en");
  const [questionDatasets, setQuestionDatasets] = useState<QuestionDataset[]>([]);
  const [geoDatasets, setGeoDatasets] = useState<GeographyDataset[]>([]);

  const {
    control, handleSubmit, reset, watch, setValue,
    formState: { isDirty, errors },
  } = useForm<FormValues>({ defaultValues: {} as FormValues });

  useEffect(() => {
    if (!id) return;
    setLoadingTemplate(true);
    gameTemplatesService.getTemplate(id)
      .then((t) => {
        setTemplate(t);
        reset(toForm(t));
      })
      .catch(() => {
        enqueueSnackbar("Template not found", { variant: "error" });
        navigate("/templates");
      })
      .finally(() => setLoadingTemplate(false));
  }, [id]);

  useEffect(() => {
    datasetsService.getDatasets(false).then(setQuestionDatasets).catch(() => setQuestionDatasets([]));
    datasetsService.getGeographyDatasets(false).then(setGeoDatasets).catch(() => setGeoDatasets([]));
  }, []);

  const mode = watch("mode");
  const category = watch("category");
  const isFixedPlayers = FIXED_PLAYER_COUNT_MODES.includes(mode);
  const isGeoCategory = category === "flags" || category === "geography";
  const displayedDatasets: (QuestionDataset | GeographyDataset)[] = isGeoCategory ? geoDatasets : questionDatasets;

  useEffect(() => {
    setValue("dataset_id", "");
  }, [isGeoCategory]);

  useEffect(() => {
    if (!template) return;
    const defaults = MODE_DEFAULTS[mode] ?? {};
    if (defaults.min_players !== undefined) setValue("min_players", defaults.min_players);
    if (defaults.max_players !== undefined) setValue("max_players", defaults.max_players);
    if (defaults.score_mode !== undefined) setValue("score_mode", defaults.score_mode as string);
    if (defaults.time_bonus !== undefined) setValue("time_bonus", defaults.time_bonus);
  }, [mode]);

  const onSave = handleSubmit(async (data) => {
    if (!template) return;
    setSaving(true);
    try {
      const name_i18n: Record<string, string> = {};
      const description_i18n: Record<string, string> = {};
      for (const { code } of I18N_LANGS) {
        const n = data[`name_i18n_${code}` as keyof FormValues] as string;
        const d = data[`description_i18n_${code}` as keyof FormValues] as string;
        if (n) name_i18n[code] = n;
        if (d) description_i18n[code] = d;
      }
      const updated = await gameTemplatesService.updateTemplate(template.id, {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        name_i18n: Object.keys(name_i18n).length ? name_i18n : undefined,
        description_i18n: Object.keys(description_i18n).length ? description_i18n : undefined,
        mode: data.mode as GameTemplate["mode"],
        category: data.category as GameTemplate["category"],
        dataset_id: data.dataset_id || undefined,
        question_count: Number(data.question_count),
        min_players: Number(data.min_players),
        max_players: Number(data.max_players),
        question_type: data.question_type || undefined,
        flag_variant: data.flag_variant as GameTemplate["flag_variant"],
        continent: data.continent || undefined,
        include_territories: data.include_territories,
        score_mode: data.score_mode as GameTemplate["score_mode"],
        time_bonus: data.time_bonus,
        points_per_correct: Number(data.points_per_correct),
        xp_multiplier: Number(data.xp_multiplier),
        is_active: data.is_active,
      });
      setTemplate(updated);
      reset(toForm(updated));
      enqueueSnackbar(`"${updated.name}" saved`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to save", { variant: "error" });
    } finally {
      setSaving(false);
    }
  });

  const handleRevert = () => {
    if (template) reset(toForm(template));
  };

  if (loadingTemplate) {
    return (
      <PageContainer>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
          <Skeleton variant="rounded" width={90} height={30} />
          <Skeleton variant="text" width={160} sx={{ fontSize: "1rem" }} />
        </Box>
        <Stack spacing={5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SettingSection key={i}>
              <Skeleton variant="text" width={120} sx={{ fontSize: "1.25rem" }} />
              <SettingSectionContent>
                {Array.from({ length: 2 }).map((_, j) => (
                  <Grid2 container key={j}>
                    <Grid2 size={{ md: 6, xs: 12 }}>
                      <Skeleton variant="text" width={80} sx={{ fontSize: "0.875rem", mb: 0.5 }} />
                      <Skeleton variant="rounded" height={40} />
                    </Grid2>
                  </Grid2>
                ))}
              </SettingSectionContent>
            </SettingSection>
          ))}
        </Stack>
      </PageContainer>
    );
  }

  if (!template) return null;

  return (
    <PageContainer>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <SecondaryButton
          size="small"
          startIcon={<ArrowLeft20Regular style={{ fontSize: 18 }} />}
          onClick={() => navigate("/templates")}
          sx={{ minWidth: 0, px: 1.5 }}
        >
          Templates
        </SecondaryButton>
        <Typography color="text.disabled">/</Typography>
        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
          {template.name}
        </Typography>
        {template.mode && (
          <SquareChip
            label={MODE_LABELS[template.mode] ?? template.mode}
            color={MODE_COLORS[template.mode] ?? "default"}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        )}
        <Chip
          label={template.is_active ? "Active" : "Inactive"}
          color={template.is_active ? "primary" : "default"}
          size="small"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      </Box>

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
                    setValue("name_i18n_en", e.target.value, { shouldDirty: true });
                    setValue("slug", slugify(e.target.value), { shouldDirty: true });
                  }}
                />
              )} />
            </SettingForm>

            <SettingForm title="Slug" lgWidth={6} helper="Unique identifier used in URLs and the API.">
              <Controller name="slug" control={control} rules={{ required: "Required", pattern: { value: /^[a-z0-9-]+$/, message: "Lowercase, numbers and hyphens only" } }} render={({ field }) => (
                <TextField
                  {...field} fullWidth size="small"
                  error={!!errors.slug} helperText={errors.slug?.message}
                  slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                />
              )} />
            </SettingForm>

            <SettingForm lgWidth={6}>
              <Controller name="is_active" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                  label="Active"
                />
              )} />
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom>Translations</Typography>
          <SettingSectionContent>
            <SettingForm lgWidth={8}>
              <StyledTabs
                value={i18nLang}
                onChange={(_, v) => setI18nLang(v)}
                sx={{ mb: 2 }}
              >
                {I18N_LANGS.map(({ code, label }) => (
                  <StyledTab key={code} value={code} label={label} />
                ))}
              </StyledTabs>
              {I18N_LANGS.map(({ code }) => (
                <Box key={code} sx={{ display: i18nLang === code ? "flex" : "none", flexDirection: "column", gap: 2 }}>
                  <Controller
                    name={`name_i18n_${code}` as keyof FormValues}
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>Name ({code.toUpperCase()})</Typography>
                        <TextField
                          {...field}
                          value={field.value as string}
                          fullWidth
                          size="small"
                          disabled={code === "en"}
                        />
                      </Box>
                    )}
                  />
                  <Controller
                    name={`description_i18n_${code}` as keyof FormValues}
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>Description ({code.toUpperCase()})</Typography>
                        <TextField {...field} value={field.value as string} fullWidth size="small" multiline rows={2} />
                      </Box>
                    )}
                  />
                </Box>
              ))}
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom>Game settings</Typography>
          <SettingSectionContent>
            <SettingForm title="Mode" lgWidth={4}>
              <Controller name="mode" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select {...field}>
                    {Object.entries(MODE_LABELS).map(([v, l]) => (
                      <MenuItem key={v} value={v}>{l}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>

            <SettingForm title="Category" lgWidth={4}>
              <Controller name="category" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select {...field}>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <MenuItem key={v} value={v}>{l}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>

            <SettingForm title="Number of questions" lgWidth={3}>
              <Controller name="question_count" control={control} rules={{ required: true, min: 1 }} render={({ field }) => (
                <TextField {...field} type="number" fullWidth size="small" slotProps={{ htmlInput: { min: 1 } }} error={!!errors.question_count} />
              )} />
            </SettingForm>

            <SettingForm title="Players" lgWidth={6} helper={isFixedPlayers ? "Fixed by mode" : "Minimum and maximum number of players."}>
              <Grid2 container spacing={2}>
                <Grid2 size={6}>
                  <Controller name="min_players" control={control} render={({ field }) => (
                    <TextField {...field} label="Min" type="number" fullWidth size="small" slotProps={{ htmlInput: { min: 1 } }} disabled={isFixedPlayers} />
                  )} />
                </Grid2>
                <Grid2 size={6}>
                  <Controller name="max_players" control={control} render={({ field }) => (
                    <TextField {...field} label="Max" type="number" fullWidth size="small" slotProps={{ htmlInput: { min: 1 } }} disabled={isFixedPlayers} />
                  )} />
                </Grid2>
              </Grid2>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom>Dataset</Typography>
          <SettingSectionContent>
            <SettingForm
              title="Dataset"
              lgWidth={6}
              helper={isGeoCategory
                ? "Geography datasets (countries, flags, capitals)."
                : "Question datasets (knowledge, quizzes)."}
            >
              <Controller name="dataset_id" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select
                    {...field}
                    displayEmpty
                    renderValue={(v) => {
                      if (!v) return <em style={{ fontStyle: "normal", color: "inherit" }}>Default dataset</em>;
                      const found = displayedDatasets.find((d) => d.id === v);
                      return found ? found.name : String(v);
                    }}
                  >
                    <MenuItem value="">
                      <Box>
                        <Typography variant="body2">Default dataset</Typography>
                        <Typography variant="caption" color="text.disabled">Uses the platform's active default</Typography>
                      </Box>
                    </MenuItem>
                    {displayedDatasets.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        <Box>
                          <Typography variant="body2">
                            {d.name}
                            {d.is_default && (
                              <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>default</Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {d.slug} · {"question_count" in d ? `${d.question_count} questions` : `${d.country_count} countries`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom>Questions</Typography>
          <SettingSectionContent>
            <SettingForm title="Question type" lgWidth={6}>
              <Controller name="question_type" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select {...field}>
                    {QUESTION_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        <Box>
                          <Typography variant="body2">{o.label}</Typography>
                          <Typography variant="caption" color="text.disabled">{o.description}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>

            {category === "flags" && (
              <SettingForm title="Flag variant" lgWidth={6}>
                <Controller name="flag_variant" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <Select {...field}>
                      {FLAG_VARIANT_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} />
              </SettingForm>
            )}

            <SettingForm title="Continent" lgWidth={4}>
              <Controller name="continent" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select {...field}>
                    {CONTINENTS.map((c) => (
                      <MenuItem key={c} value={c}>{CONTINENT_LABELS[c]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>

            <SettingForm lgWidth={6}>
              <Controller name="include_territories" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                  label="Include territories"
                />
              )} />
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <SettingSection>
          <Typography variant="h6" gutterBottom>Scoring</Typography>
          <SettingSectionContent>
            <SettingForm title="Score mode" lgWidth={6}>
              <Controller name="score_mode" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Select {...field}>
                    {SCORE_MODE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        <Box>
                          <Typography variant="body2">{o.label}</Typography>
                          <Typography variant="caption" color="text.disabled">{o.description}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </SettingForm>

            <SettingForm title="Points per correct answer" lgWidth={3}>
              <Controller name="points_per_correct" control={control} render={({ field }) => (
                <TextField {...field} type="number" fullWidth size="small" slotProps={{ htmlInput: { min: 0 } }} />
              )} />
            </SettingForm>

            <SettingForm title="XP multiplier" lgWidth={3}>
              <Controller name="xp_multiplier" control={control} render={({ field }) => (
                <TextField
                  {...field} type="number" fullWidth size="small"
                  slotProps={{ htmlInput: { min: 0, step: 0.1 }, input: { endAdornment: <InputAdornment position="end">×</InputAdornment> } }}
                />
              )} />
            </SettingForm>

            <SettingForm lgWidth={6}>
              <Controller name="time_bonus" control={control} render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                  label="Time bonus"
                />
              )} />
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

      </Stack>

      <SavingFloat
        visible={isDirty}
        saving={saving}
        onSave={onSave}
        onRevert={handleRevert}
      />
    </PageContainer>
  );
}
