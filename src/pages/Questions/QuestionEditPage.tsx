import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
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
  Save20Regular,
  Delete20Regular,
  Add20Regular,
} from "@fluentui/react-icons";
import { enqueueSnackbar } from "notistack";
import { questionsService } from "@/lib/services/questions.service";
import { datasetsService } from "@/lib/services/datasets.service";
import type { QuestionDataset } from "@/lib/types/datasets.types";
import type { Question } from "@/lib/types/question.types";
import PageContainer from "@/components/Common/PageContainer";
import { SecondaryButton, StyledTab, StyledTabs } from "@/components/Common/StyledComponents";

const I18N_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
] as const;

type I18nCode = (typeof I18N_LANGS)[number]["code"];

type AnswerForm = {
  slug: string;
  is_correct: boolean;
  label_en: string;
  label_es: string;
  label_fr: string;
};

type FormValues = {
  slug: string;
  kind: string;
  version: string;
  qtype: string;
  difficulty: string;
  estimated_seconds: number;
  shuffle_answers: boolean;
  dataset_id: string;
  theme_slug: string;
  subthemes: string;
  tags: string;
  title_en: string; title_es: string; title_fr: string;
  stem_en: string; stem_es: string; stem_fr: string;
  explanation_en: string; explanation_es: string; explanation_fr: string;
  answers: AnswerForm[];
  sources: string;
};

const DEFAULT_ANSWER: AnswerForm = {
  slug: "", is_correct: false, label_en: "", label_es: "", label_fr: "",
};

function splitSlugs(s: string): Array<{ slug: string }> {
  return s.split(",").map((t) => t.trim()).filter(Boolean).map((slug) => ({ slug }));
}

function bumpPatch(v: string): string {
  const parts = v.split(".");
  const n = parseInt(parts[parts.length - 1], 10);
  if (isNaN(n)) return v + ".1";
  parts[parts.length - 1] = String(n + 1);
  return parts.join(".");
}

function questionToForm(q: Question): FormValues {
  const i18n = q.i18n ?? {};
  const answersRaw: AnswerForm[] = (q.answers ?? []).map((a) => ({
    slug: a.slug,
    is_correct: a.is_correct,
    label_en: a.i18n?.["en"]?.label ?? "",
    label_es: a.i18n?.["es"]?.label ?? "",
    label_fr: a.i18n?.["fr"]?.label ?? "",
  }));

  return {
    slug: q.slug,
    kind: q.kind,
    version: q.version,
    qtype: q.qtype,
    difficulty: q.difficulty,
    estimated_seconds: q.estimated_seconds,
    shuffle_answers: q.shuffle_answers,
    dataset_id: q.dataset_id ?? "",
    theme_slug: q.theme?.slug ?? "",
    subthemes: (q.subthemes ?? []).map((t) => t.slug).join(", "),
    tags: (q.tags ?? []).map((t) => t.slug).join(", "),
    title_en: i18n["en"]?.title ?? "",
    title_es: i18n["es"]?.title ?? "",
    title_fr: i18n["fr"]?.title ?? "",
    stem_en: i18n["en"]?.stem ?? "",
    stem_es: i18n["es"]?.stem ?? "",
    stem_fr: i18n["fr"]?.stem ?? "",
    explanation_en: i18n["en"]?.explanation ?? "",
    explanation_es: i18n["es"]?.explanation ?? "",
    explanation_fr: i18n["fr"]?.explanation ?? "",
    answers: answersRaw.length >= 2 ? answersRaw : [...answersRaw, DEFAULT_ANSWER, DEFAULT_ANSWER].slice(0, Math.max(answersRaw.length, 2)),
    sources: (q.sources ?? []).join("\n"),
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
          form="question-edit-form"
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

export default function QuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionSlug, setQuestionSlug] = useState("");
  const [versionAuto, setVersionAuto] = useState(true);
  const [i18nLang, setI18nLang] = useState<I18nCode>("en");
  const [questionDatasets, setQuestionDatasets] = useState<QuestionDataset[]>([]);

  const {
    control, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: {} as FormValues });

  const { fields: answerFields, append: appendAnswer, remove: removeAnswer, replace: replaceAnswers } = useFieldArray({
    control,
    name: "answers",
  });

  useEffect(() => {
    datasetsService.getDatasets(false).then(setQuestionDatasets).catch(() => setQuestionDatasets([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    questionsService.getQuestionById(id).then((q) => {
      setQuestionSlug(q.slug);
      const values = questionToForm(q);
      reset(values);
      replaceAnswers(values.answers);
    }).catch(() => {
      enqueueSnackbar("Question not found", { variant: "error" });
      navigate("/questions");
    }).finally(() => setLoading(false));
  }, [id]);

  const qtype = watch("qtype");
  const currentVersion = watch("version");

  const onSubmit = handleSubmit(async (data) => {
    if (!id) return;
    setSaving(true);
    try {
      const i18n: Record<string, { title: string; stem: string; explanation?: string }> = {};
      for (const { code } of I18N_LANGS) {
        const title = data[`title_${code}` as keyof FormValues] as string;
        const stem = data[`stem_${code}` as keyof FormValues] as string;
        const explanation = data[`explanation_${code}` as keyof FormValues] as string;
        if (title && stem) {
          i18n[code] = { title, stem, ...(explanation ? { explanation } : {}) };
        }
      }

      const answers = data.answers
        .filter((a) => a.slug)
        .map((a) => {
          const answerI18n: Record<string, { label: string }> = {};
          for (const { code } of I18N_LANGS) {
            const label = a[`label_${code}` as keyof AnswerForm] as string;
            if (label) answerI18n[code] = { label };
          }
          return { slug: a.slug, is_correct: a.is_correct, i18n: answerI18n };
        });

      const updated = await questionsService.updateQuestion(id, {
        slug: data.slug,
        kind: data.kind,
        version: versionAuto ? undefined : data.version,
        qtype: data.qtype,
        difficulty: data.difficulty,
        estimated_seconds: Number(data.estimated_seconds),
        shuffle_answers: data.shuffle_answers,
        theme: { slug: data.theme_slug },
        subthemes: splitSlugs(data.subthemes),
        tags: splitSlugs(data.tags),
        i18n,
        answers,
        sources: data.sources.split("\n").map((s) => s.trim()).filter(Boolean),
      });

      setQuestionSlug(updated.slug);
      reset(questionToForm(updated));
      replaceAnswers(questionToForm(updated).answers);
      enqueueSnackbar("Question saved", { variant: "success" });
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
          onClick={() => navigate("/questions")}
          sx={{ minWidth: 0, px: 1.5 }}
        >
          Questions
        </SecondaryButton>
        <Typography color="text.disabled">/</Typography>
        {loading
          ? <Skeleton variant="text" width={200} />
          : <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: "monospace" }}>{questionSlug}</Typography>
        }
      </Box>

      <Box component="form" id="question-edit-form" onSubmit={onSubmit}>
        <Stack spacing={5}>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Basic info</Typography>
            <SettingSectionContent>
              <SettingForm title="Slug" lgWidth={6} helper="Unique identifier used in the API.">
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="slug" control={control} rules={{ required: "Required", pattern: { value: /^[a-z0-9-]+$/, message: "Lowercase, numbers and hyphens only" } }} render={({ field }) => (
                    <TextField
                      {...field} fullWidth size="small"
                      error={!!errors.slug} helperText={errors.slug?.message}
                      slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                    />
                  )} />
                )}
              </SettingForm>

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <SettingForm title="Kind" lgWidth={12}>
                    {loading ? <Skeleton variant="rounded" height={40} /> : (
                      <Controller name="kind" control={control} rules={{ required: "Required" }} render={({ field }) => (
                        <TextField {...field} fullWidth size="small" error={!!errors.kind} helperText={errors.kind?.message} />
                      )} />
                    )}
                  </SettingForm>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <SettingForm title="Version" lgWidth={12}>
                    {loading ? <Skeleton variant="rounded" height={40} /> : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Controller name="version" control={control} rules={{ required: !versionAuto }} render={({ field }) => (
                          <TextField
                            {...field} fullWidth size="small"
                            disabled={versionAuto}
                            error={!versionAuto && !!errors.version}
                            helperText={versionAuto
                              ? `→ ${bumpPatch(currentVersion)} after save`
                              : errors.version?.message}
                            slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                          />
                        )} />
                        <FormControlLabel
                          sx={{ whiteSpace: "nowrap", ml: 0, mb: errors.version ? 2.5 : versionAuto ? 2.5 : 0 }}
                          control={
                            <Switch
                              checked={versionAuto}
                              onChange={(_, v) => setVersionAuto(v)}
                              size="small"
                            />
                          }
                          label={<Typography variant="caption">Auto</Typography>}
                        />
                      </Box>
                    )}
                  </SettingForm>
                </Grid2>
              </Grid2>

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <SettingForm title="Type" lgWidth={12}>
                    {loading ? <Skeleton variant="rounded" height={40} /> : (
                      <Controller name="qtype" control={control} render={({ field }) => (
                        <FormControl fullWidth size="small">
                          <Select {...field}>
                            <MenuItem value="mcq">MCQ</MenuItem>
                            <MenuItem value="text_input">Text input</MenuItem>
                          </Select>
                        </FormControl>
                      )} />
                    )}
                  </SettingForm>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <SettingForm title="Difficulty" lgWidth={12}>
                    {loading ? <Skeleton variant="rounded" height={40} /> : (
                      <Controller name="difficulty" control={control} render={({ field }) => (
                        <FormControl fullWidth size="small">
                          <Select {...field}>
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                          </Select>
                        </FormControl>
                      )} />
                    )}
                  </SettingForm>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <SettingForm title="Estimated time" lgWidth={12}>
                    {loading ? <Skeleton variant="rounded" height={40} /> : (
                      <Controller name="estimated_seconds" control={control} rules={{ required: true, min: 1 }} render={({ field }) => (
                        <TextField
                          {...field} type="number" fullWidth size="small"
                          slotProps={{ htmlInput: { min: 1 }, input: { endAdornment: <InputAdornment position="end">s</InputAdornment> } }}
                          error={!!errors.estimated_seconds}
                        />
                      )} />
                    )}
                  </SettingForm>
                </Grid2>
              </Grid2>

              <SettingForm lgWidth={6}>
                {loading ? <Skeleton variant="rounded" height={38} width={160} /> : (
                  <Controller name="shuffle_answers" control={control} render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(_, v) => field.onChange(v)} size="small" />}
                      label="Shuffle answers"
                    />
                  )} />
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Dataset</Typography>
            <SettingSectionContent>
              <SettingForm title="Dataset" lgWidth={6} helper="Optional. Leave empty for the platform default.">
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="dataset_id" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select
                        {...field} displayEmpty
                        renderValue={(v) => {
                          if (!v) return <em style={{ fontStyle: "normal" }}>Default dataset</em>;
                          const found = questionDatasets.find((d) => d.id === v);
                          return found ? found.name : String(v);
                        }}
                      >
                        <MenuItem value="">
                          <Box>
                            <Typography variant="body2">Default dataset</Typography>
                            <Typography variant="caption" color="text.disabled">Uses the platform's active default</Typography>
                          </Box>
                        </MenuItem>
                        {questionDatasets.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            <Box>
                              <Typography variant="body2">
                                {d.name}
                                {d.is_default && <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>default</Typography>}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {d.slug} · {d.question_count} questions
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Classification</Typography>
            <SettingSectionContent>
              <SettingForm title="Theme slug" lgWidth={4}>
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="theme_slug" control={control} rules={{ required: "Required" }} render={({ field }) => (
                    <TextField
                      {...field} fullWidth size="small"
                      error={!!errors.theme_slug} helperText={errors.theme_slug?.message}
                      slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                    />
                  )} />
                )}
              </SettingForm>

              <SettingForm title="Subthemes" lgWidth={6} helper="Comma-separated slugs.">
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="subthemes" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth size="small" />
                  )} />
                )}
              </SettingForm>

              <SettingForm title="Tags" lgWidth={6} helper="Comma-separated slugs.">
                {loading ? <Skeleton variant="rounded" height={40} /> : (
                  <Controller name="tags" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth size="small" />
                  )} />
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

          <SettingSection>
            <Typography variant="h6" gutterBottom>Content</Typography>
            <SettingSectionContent>
              <SettingForm lgWidth={9}>
                {loading ? (
                  <Stack spacing={2}>
                    <Skeleton variant="rounded" height={40} width={240} />
                    <Skeleton variant="rounded" height={40} />
                    <Skeleton variant="rounded" height={72} />
                    <Skeleton variant="rounded" height={56} />
                  </Stack>
                ) : (
                  <>
                    <StyledTabs value={i18nLang} onChange={(_, v) => setI18nLang(v)} sx={{ mb: 2 }}>
                      {I18N_LANGS.map(({ code, label }) => (
                        <StyledTab key={code} value={code} label={label} />
                      ))}
                    </StyledTabs>
                    {I18N_LANGS.map(({ code }) => (
                      <Box key={code} sx={{ display: i18nLang === code ? "flex" : "none", flexDirection: "column", gap: 2 }}>
                        <Controller
                          name={`title_${code}` as keyof FormValues}
                          control={control}
                          rules={code === "en" ? { required: "Required" } : undefined}
                          render={({ field }) => (
                            <Box>
                              <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
                                Title ({code.toUpperCase()}){code === "en" && " *"}
                              </Typography>
                              <TextField
                                {...field} value={field.value as string} fullWidth size="small"
                                error={code === "en" && !!errors.title_en}
                                helperText={code === "en" ? errors.title_en?.message : undefined}
                              />
                            </Box>
                          )}
                        />
                        <Controller
                          name={`stem_${code}` as keyof FormValues}
                          control={control}
                          rules={code === "en" ? { required: "Required" } : undefined}
                          render={({ field }) => (
                            <Box>
                              <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
                                Question stem ({code.toUpperCase()}){code === "en" && " *"}
                              </Typography>
                              <TextField
                                {...field} value={field.value as string} fullWidth size="small" multiline rows={3}
                                error={code === "en" && !!errors.stem_en}
                                helperText={code === "en" ? errors.stem_en?.message : undefined}
                              />
                            </Box>
                          )}
                        />
                        <Controller
                          name={`explanation_${code}` as keyof FormValues}
                          control={control}
                          render={({ field }) => (
                            <Box>
                              <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
                                Explanation ({code.toUpperCase()})
                              </Typography>
                              <TextField {...field} value={field.value as string} fullWidth size="small" multiline rows={2} />
                            </Box>
                          )}
                        />
                      </Box>
                    ))}
                  </>
                )}
              </SettingForm>
            </SettingSectionContent>
          </SettingSection>

          {!loading && qtype === "mcq" && (
            <SettingSection>
              <Typography variant="h6" gutterBottom>Answers</Typography>
              <SettingSectionContent>
                <SettingForm lgWidth={10} helper="2–4 answers. Check the correct one.">
                  <Stack spacing={2}>
                    {answerFields.map((field, index) => (
                      <Box key={field.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Controller
                            name={`answers.${index}.is_correct`}
                            control={control}
                            render={({ field: f }) => (
                              <Checkbox
                                checked={f.value}
                                onChange={(_, v) => f.onChange(v)}
                                size="small"
                                color="primary"
                                sx={{ p: 0.5 }}
                              />
                            )}
                          />
                          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                            Answer {index + 1}
                          </Typography>
                          {answerFields.length > 2 && (
                            <IconButton size="small" onClick={() => removeAnswer(index)} color="error">
                              <Delete20Regular style={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                        <Grid2 container spacing={1.5}>
                          <Grid2 size={{ xs: 12, sm: 3 }}>
                            <Controller
                              name={`answers.${index}.slug`}
                              control={control}
                              rules={{ required: "Required" }}
                              render={({ field: f }) => (
                                <TextField
                                  {...f} label="Slug" size="small" fullWidth
                                  slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
                                  error={!!errors.answers?.[index]?.slug}
                                />
                              )}
                            />
                          </Grid2>
                          {I18N_LANGS.map(({ code }) => (
                            <Grid2 key={code} size={{ xs: 12, sm: 3 }}>
                              <Controller
                                name={`answers.${index}.label_${code}` as `answers.${number}.label_en`}
                                control={control}
                                render={({ field: f }) => (
                                  <TextField {...f} label={`Label (${code.toUpperCase()})`} size="small" fullWidth />
                                )}
                              />
                            </Grid2>
                          ))}
                        </Grid2>
                        {index < answerFields.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                    {answerFields.length < 4 && (
                      <Box>
                        <SecondaryButton
                          size="small"
                          startIcon={<Add20Regular />}
                          onClick={() => appendAnswer({ ...DEFAULT_ANSWER })}
                        >
                          Add answer
                        </SecondaryButton>
                      </Box>
                    )}
                  </Stack>
                </SettingForm>
              </SettingSectionContent>
            </SettingSection>
          )}

          <SettingSection>
            <Typography variant="h6" gutterBottom>Sources</Typography>
            <SettingSectionContent>
              <SettingForm title="Sources" lgWidth={6} helper="One URL per line. Optional.">
                {loading ? <Skeleton variant="rounded" height={72} /> : (
                  <Controller name="sources" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth size="small" multiline rows={3} />
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
