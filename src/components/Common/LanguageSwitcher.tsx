import { languages } from "@/i18n";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { LocalLanguage20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { t } = useTranslation("dashboard");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Tooltip title={t("frame.language")}>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <LocalLanguage20Regular />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: { border: 1, borderColor: "divider", mt: 0.5 },
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={i18next.language === lang.code}
            onClick={() => {
              i18next.changeLanguage(lang.code);
              setAnchorEl(null);
            }}
            sx={{ fontSize: 14 }}
          >
            {lang.displayName}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
