import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import { useSettingsContext } from "../SettingsTabPanel";
import SettingForm from "../SettingForm";
import { SettingSection, SettingSectionContent } from "../SettingSection";
import type { AvatarConfig } from "@/lib/types/settings.types";

function parseList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function AvatarTab() {
  const { values, updateProperty } = useSettingsContext<AvatarConfig>();

  const [mimeInput, setMimeInput] = useState<string | null>(null);
  const [extInput, setExtInput] = useState<string | null>(null);

  return (
    <SettingSection>
      <Typography variant="h6" gutterBottom>
        Avatar Configuration
      </Typography>
      <SettingSectionContent>
        <SettingForm title="Max File Size (MB)">
          <TextField
            type="number"
            size="small"
            value={values.max_file_size_mb}
            onChange={(e) => updateProperty("max_file_size_mb", Number(e.target.value))}
            helperText="Maximum avatar file size. Default: 5"
          />
        </SettingForm>
        <SettingForm title="Allowed MIME Types">
          <Stack spacing={1}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {values.allowed_mime_types?.map((type) => (
                <Chip key={type} label={type} size="small" variant="outlined" />
              ))}
            </Stack>
            <TextField
              fullWidth
              size="small"
              value={mimeInput ?? values.allowed_mime_types?.join(", ") ?? ""}
              onChange={(e) => {
                setMimeInput(e.target.value);
                updateProperty("allowed_mime_types", parseList(e.target.value));
              }}
              onBlur={() => setMimeInput(null)}
              helperText="Comma-separated. Default: image/jpeg, image/png"
            />
          </Stack>
        </SettingForm>
        <SettingForm title="Allowed Extensions">
          <Stack spacing={1}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {values.allowed_extensions?.map((ext) => (
                <Chip key={ext} label={ext} size="small" variant="outlined" />
              ))}
            </Stack>
            <TextField
              fullWidth
              size="small"
              value={extInput ?? values.allowed_extensions?.join(", ") ?? ""}
              onChange={(e) => {
                setExtInput(e.target.value);
                updateProperty("allowed_extensions", parseList(e.target.value));
              }}
              onBlur={() => setExtInput(null)}
              helperText="Comma-separated. Default: .png, .jpeg, .jpg"
            />
          </Stack>
        </SettingForm>
      </SettingSectionContent>
    </SettingSection>
  );
}
