import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { GameTemplate, CreateGameTemplateRequest } from "@/lib/types/game-template.types";
import type { QuestionDataset } from "@/lib/types/datasets.types";
import type { GeographyDataset } from "@/lib/types/geography.types";
import { datasetsService } from "@/lib/services/datasets.service";
import {
  FLAG_VARIANT_OPTIONS,
  MODE_LABELS,
  CATEGORY_LABELS,
  SCORE_MODE_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  FIXED_PLAYER_COUNT_MODES,
  MODE_DEFAULTS,
} from "@/lib/constants/game-template.constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGameTemplateRequest) => Promise<void>;
  template?: GameTemplate | null;
}

const I18N_LANGS = [
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
] as const;

type I18nCode = typeof I18N_LANGS[number]["code"];

type FormValues = {
  name: string;
  slug: string;
  description: string;
  name_i18n_es: string; name_i18n_fr: string;
  description_i18n_es: string; description_i18n_fr: string;
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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toForm(t?: GameTemplate | null): FormValues {
  return {
    name: t?.name ?? "",
    slug: t?.slug ?? "",
    description: t?.description ?? "",
    name_i18n_es: t?.name_i18n?.es ?? "",
    name_i18n_fr: t?.name_i18n?.fr ?? "",
    description_i18n_es: t?.description_i18n?.es ?? "",
    description_i18n_fr: t?.description_i18n?.fr ?? "",
    mode: t?.mode ?? "solo",
    category: t?.category ?? "general",
    dataset_id: t?.dataset_id ?? "",
    question_count: t?.question_count ?? 10,
    min_players: t?.min_players ?? 1,
    max_players: t?.max_players ?? 1,
    question_type: t?.question_type ?? "mcq_4",
    flag_variant: t?.flag_variant ?? "flag_to_name_4",
    continent: t?.continent ?? "",
    include_territories: t?.include_territories ?? false,
    score_mode: t?.score_mode ?? "classic",
    time_bonus: t?.time_bonus ?? false,
    points_per_correct: t?.points_per_correct ?? 100,
    xp_multiplier: t?.xp_multiplier ?? 1,
    is_active: t?.is_active ?? true,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption" color="text.disabled" fontWeight={700}
      sx={{ letterSpacing: "0.07em", textTransform: "uppercase", fontSize: "0.65rem", display: "block", mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

export default function TemplateFormDialog({ open, onClose, onSubmit, template }: Props) {
  const isEdit = !!template;
  const [questionDatasets, setQuestionDatasets] = useState<QuestionDataset[]>([]);
  const [geoDatasets, setGeoDatasets] = useState<GeographyDataset[]>([]);
  const [i18nLang, setI18nLang] = useState<I18nCode>(I18N_LANGS[0].code);

  const {
    control, handleSubmit, reset, watch, setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ defaultValues: toForm(template) });

  useEffect(() => {
    if (open) {
      reset(toForm(template));
      setI18nLang(I18N_LANGS[0].code);
      datasetsService.getDatasets(false).then(setQuestionDatasets).catch(() => setQuestionDatasets([]));
      datasetsService.getGeographyDatasets(false).then(setGeoDatasets).catch(() => setGeoDatasets([]));
    }
  }, [open, template]);

  const mode = watch("mode");
  const category = watch("category");
  const isFixedPlayers = FIXED_PLAYER_COUNT_MODES.includes(mode);
  const isGeoCategory = category === "flags" || category === "geography";
  const displayedDatasets: (QuestionDataset | GeographyDataset)[] = isGeoCategory ? geoDatasets : questionDatasets;

  useEffect(() => {
    setValue("dataset_id", "");
  }, [isGeoCategory]);

  useEffect(() => {
    if (isEdit) return;
    const defaults = MODE_DEFAULTS[mode] ?? {};
    if (defaults.min_players !== undefined) setValue("min_players", defaults.min_players);
    if (defaults.max_players !== undefined) setValue("max_players", defaults.max_players);
    if (defaults.score_mode !== undefined) setValue("score_mode", defaults.score_mode as string);
    if (defaults.time_bonus !== undefined) setValue("time_bonus", defaults.time_bonus);
  }, [mode, isEdit]);

  const onValid = async (data: FormValues) => {
    const name_i18n: Record<string, string> = {};
    const description_i18n: Record<string, string> = {};
    for (const { code } of I18N_LANGS) {
      const n = data[`name_i18n_${code}` as keyof FormValues] as string;
      const d = data[`description_i18n_${code}` as keyof FormValues] as string;
      if (n) name_i18n[code] = n;
      if (d) description_i18n[code] = d;
    }
    await onSubmit({
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      name_i18n: Object.keys(name_i18n).length ? name_i18n : undefined,
      description_i18n: Object.keys(description_i18n).length ? description_i18n : undefined,
      mode: data.mode as CreateGameTemplateRequest["mode"],
      category: data.category as CreateGameTemplateRequest["category"],
      dataset_id: data.dataset_id || undefined,
      question_count: Number(data.question_count),
      min_players: Number(data.min_players),
      max_players: Number(data.max_players),
      question_type: data.question_type || undefined,
      flag_variant: data.flag_variant as CreateGameTemplateRequest["flag_variant"],
      continent: data.continent || undefined,
      include_territories: data.include_territories,
      score_mode: data.score_mode as CreateGameTemplateRequest["score_mode"],
      time_bonus: data.time_bonus,
      points_per_correct: Number(data.points_per_correct),
      xp_multiplier: Number(data.xp_multiplier),
      is_active: data.is_active,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>{isEdit ? "Edit template" : "Create template"}</Typography>
        <IconButton size="small" onClick={onClose}><Dismiss24Regular /></IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" id="template-form" onSubmit={handleSubmit(onValid)}>
          <Stack spacing={3}>

            <Box>
              <SectionLabel>Basic</SectionLabel>
              <Stack spacing={2}>
                <Controller name="name" control={control} rules={{ required: "Required" }} render={({ field }) => (
                  <TextField
                    {...field} label="Name" fullWidth
                    error={!!errors.name} helperText={errors.name?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!isEdit) setValue("slug", slugify(e.target.value));
                    }}
                  />
                )} />
                <Controller name="slug" control={control} rules={{ required: "Required", pattern: { value: /^[a-z0-9-]+$/, message: "Lowercase, numbers and hyphens only" } }} render={({ field }) => (
                  <TextField
                    {...field} label="Slug" fullWidth
                    error={!!errors.slug} helperText={errors.slug?.message}
                    slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                  />
                )} />
                <Controller name="description" control={control} render={({ field }) => (
                  <TextField {...field} label="Description" fullWidth multiline rows={2} />
                )} />
                <Controller name="is_active" control={control} render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                    label="Active"
                  />
                )} />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <SectionLabel>Translations</SectionLabel>
              <Tabs
                value={i18nLang}
                onChange={(_, v) => setI18nLang(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, minHeight: 32, "& .MuiTab-root": { minHeight: 32, py: 0.5, fontSize: "0.75rem" } }}
              >
                {I18N_LANGS.map(({ code, label }) => (
                  <Tab key={code} value={code} label={label} />
                ))}
              </Tabs>
              {I18N_LANGS.map(({ code }) => (
                <Box key={code} sx={{ display: i18nLang === code ? "block" : "none" }}>
                  <Stack spacing={2}>
                    <Controller
                      name={`name_i18n_${code}` as keyof FormValues}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value as string}
                          label={`Name (${code.toUpperCase()})`}
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                    <Controller
                      name={`description_i18n_${code}` as keyof FormValues}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value as string}
                          label={`Description (${code.toUpperCase()})`}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                      )}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>

            <Divider />

            <Box>
              <SectionLabel>Game settings</SectionLabel>
              <Grid2 container spacing={2}>
                <Grid2 size={6}>
                  <Controller name="mode" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Mode</InputLabel>
                      <Select {...field} label="Mode">
                        {Object.entries(MODE_LABELS).map(([v, l]) => (
                          <MenuItem key={v} value={v}>{l}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                </Grid2>
                <Grid2 size={6}>
                  <Controller name="category" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                          <MenuItem key={v} value={v}>{l}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                </Grid2>
                <Grid2 size={4}>
                  <Controller name="question_count" control={control} rules={{ required: true, min: 1 }} render={({ field }) => (
                    <TextField {...field} label="Questions" type="number" fullWidth slotProps={{ htmlInput: { min: 1 } }} error={!!errors.question_count} />
                  )} />
                </Grid2>
                <Grid2 size={4}>
                  <Controller name="min_players" control={control} render={({ field }) => (
                    <TextField {...field} label="Min players" type="number" fullWidth slotProps={{ htmlInput: { min: 1 } }} disabled={isFixedPlayers} />
                  )} />
                </Grid2>
                <Grid2 size={4}>
                  <Controller name="max_players" control={control} render={({ field }) => (
                    <TextField {...field} label="Max players" type="number" fullWidth slotProps={{ htmlInput: { min: 1 } }} disabled={isFixedPlayers} />
                  )} />
                </Grid2>
              </Grid2>
            </Box>

            <Divider />

            <Box>
              <SectionLabel>Dataset</SectionLabel>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1.5 }}>
                {isGeoCategory
                  ? "Geography datasets (countries, flags, capitals)"
                  : "Question datasets (knowledge, quizzes)"}
              </Typography>
              <Controller name="dataset_id" control={control} render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Dataset</InputLabel>
                  <Select
                    {...field}
                    label="Dataset"
                    renderValue={(v) => {
                      if (!v) return "Default dataset";
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
                            {d.slug}
                            {" · "}
                            {"question_count" in d
                              ? `${d.question_count} questions`
                              : `${d.country_count} countries`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
            </Box>

            <Divider />

            <Box>
              <SectionLabel>Questions</SectionLabel>
              <Stack spacing={2}>
                <Controller name="question_type" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Question type</InputLabel>
                    <Select {...field} label="Question type">
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

                {category === "flags" && (
                  <Controller name="flag_variant" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Flag variant</InputLabel>
                      <Select {...field} label="Flag variant">
                        {FLAG_VARIANT_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                )}

                <Grid2 container spacing={2}>
                  <Grid2 size={6}>
                    <Controller name="continent" control={control} render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Continent</InputLabel>
                        <Select {...field} label="Continent">
                          {CONTINENTS.map((c) => (
                            <MenuItem key={c} value={c}>{CONTINENT_LABELS[c]}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )} />
                  </Grid2>
                  <Grid2 size={6} sx={{ display: "flex", alignItems: "center" }}>
                    <Controller name="include_territories" control={control} render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                        label="Include territories"
                      />
                    )} />
                  </Grid2>
                </Grid2>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <SectionLabel>Scoring</SectionLabel>
              <Stack spacing={2}>
                <Controller name="score_mode" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Score mode</InputLabel>
                    <Select {...field} label="Score mode">
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
                <Grid2 container spacing={2}>
                  <Grid2 size={6}>
                    <Controller name="points_per_correct" control={control} render={({ field }) => (
                      <TextField {...field} label="Points per correct" type="number" fullWidth slotProps={{ htmlInput: { min: 0 } }} />
                    )} />
                  </Grid2>
                  <Grid2 size={6}>
                    <Controller name="xp_multiplier" control={control} render={({ field }) => (
                      <TextField
                        {...field} label="XP multiplier" type="number" fullWidth
                        slotProps={{ htmlInput: { min: 0, step: 0.1 }, input: { endAdornment: <InputAdornment position="end">×</InputAdornment> } }}
                      />
                    )} />
                  </Grid2>
                  <Grid2 size={12}>
                    <Controller name="time_bonus" control={control} render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                        label="Time bonus"
                      />
                    )} />
                  </Grid2>
                </Grid2>
              </Stack>
            </Box>

          </Stack>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="text" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          type="submit" form="template-form" variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
