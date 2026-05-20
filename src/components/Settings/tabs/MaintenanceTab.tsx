import { apiPost } from "@/lib/api-client";
import { SETTINGS_ENDPOINTS } from "@/lib/api/endpoints";
import { useConfirm } from "@/components/Common/ConfirmDialog";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { enqueueSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { MaintenanceStatus } from "@/lib/types/settings.types";

export default function MaintenanceTab() {
  const { t } = useTranslation("dashboard");
  const { values, updateProperty } = useSettingsContext<MaintenanceStatus>();
  const confirm = useConfirm();

  const clearCache = useCallback(async () => {
    const ok = await confirm({
      title: t("settings.maintenance.clearTitle"),
      description: t("settings.maintenance.clearConfirm"),
      confirmText: t("settings.maintenance.clearButton"),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await apiPost(SETTINGS_ENDPOINTS.CACHE_CLEAR, {});
      if (!res.ok) throw new Error(t("settings.maintenance.clearError"));
      enqueueSnackbar(t("settings.maintenance.clearSuccess"), { variant: "success" });
    } catch (e) {
      enqueueSnackbar(
        e instanceof Error ? e.message : t("settings.maintenance.clearError"),
        { variant: "error" },
      );
    }
  }, [t, confirm]);

  return (
    <>
      <SettingSection>
        <Typography variant="h6" gutterBottom>
          {t("settings.maintenance.modeTitle")}
        </Typography>
        <SettingSectionContent>
          <SettingForm title={t("settings.maintenance.enableTitle")}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(values.enabled)}
                  onChange={(_, v) => updateProperty("enabled", v)}
                />
              }
              label={t("settings.maintenance.enableDesc")}
            />
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>

      <SettingSection>
        <Typography variant="h6" gutterBottom>
          {t("settings.maintenance.cacheTitle")}
        </Typography>
        <SettingSectionContent>
          <SettingForm title={t("settings.maintenance.clearTitle")}>
            <Button variant="outlined" color="primary" onClick={clearCache}>
              {t("settings.maintenance.clearButton")}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t("settings.maintenance.clearDesc")}
            </Typography>
          </SettingForm>
        </SettingSectionContent>
      </SettingSection>
    </>
  );
}
