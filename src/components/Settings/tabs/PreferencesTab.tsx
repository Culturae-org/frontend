import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import { BorderedCard } from "@/components/Common/StyledComponents";

export default function PreferencesTab() {
  const { t } = useTranslation("dashboard");
  const { dateFormat, setDateFormat, formatOptions, formatDate, formatDateOnly, formatDateWithSeconds } = useDateFormat();

  const now = new Date();

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <BorderedCard sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t("settings.preferences.dateFormat")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("settings.preferences.dateFormatDesc")}
        </Typography>

        <RadioGroup value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
          <Stack spacing={0.5}>
            {formatOptions.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ minWidth: 120 }}>
                      {opt.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {opt.example}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Stack>
        </RadioGroup>

        <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {t("settings.preferences.preview")}
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              <Box component="span" color="text.secondary" sx={{ mr: 1 }}>{t("settings.preferences.previewDate")}</Box>
              {formatDateOnly(now)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" color="text.secondary" sx={{ mr: 1 }}>{t("settings.preferences.previewDateTime")}</Box>
              {formatDate(now)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" color="text.secondary" sx={{ mr: 1 }}>{t("settings.preferences.previewDateTimeSeconds")}</Box>
              {formatDateWithSeconds(now)}
            </Typography>
          </Stack>
        </Box>
      </BorderedCard>
    </Stack>
  );
}
