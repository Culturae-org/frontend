import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSettingsContext } from "../SettingsTabPanel";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import SettingForm from "../SettingForm";
import type { VersionStatus } from "@/lib/types/settings.types";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Update from "@mui/icons-material/Update";

export default function VersionTab() {
  const { t } = useTranslation("dashboard");
  const { values } = useSettingsContext<VersionStatus>();

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        {t("settings.version.title")}
      </Typography>
      <SettingSectionContent>
        <SettingForm title={t("settings.version.current")}>
          <Typography variant="body2">{values.current_version}</Typography>
        </SettingForm>
        <SettingForm title={t("settings.version.latest")}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{values.latest_version || t("settings.version.unknown")}</Typography>
            {values.is_up_to_date ? (
              <Chip
                icon={<CheckCircle fontSize="small" />}
                label={t("settings.version.upToDate")}
                color="primary"
                size="small"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<Update fontSize="small" />}
                label={t("settings.version.updateAvailable")}
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </SettingForm>
        <SettingForm title={t("settings.version.lastChecked")}>
          <Typography variant="body2" color="text.secondary">
            {values.checked_at
              ? new Date(values.checked_at).toLocaleString()
              : t("settings.version.never")}
          </Typography>
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
