import { useThemeMode } from "@/App";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import RestartAlt from "@mui/icons-material/RestartAlt";
import { useCallback, useEffect, useState } from "react";

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHue(hex: string): number | null {
  const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

const DEFAULT_HUE = 0;
const DEFAULT_COLOR = "#444444";

const NEUTRAL_SWATCHES = ["#444444", "#666666", "#888888", "#aaaaaa"];

function getSliderGradient(mode: "light" | "dark"): string {
  const stops = Array.from({ length: 73 }, (_, i) => {
    const h = i * 5;
    const l = mode === "dark" ? 55 : 45;
    return `hsl(${h}, 85%, ${l}%)`;
  }).join(", ");
  return `linear-gradient(to right, ${stops})`;
}

export default function ThemeTab() {
  const { accentColor, setAccentColor } = useThemeMode();
  const theme = useTheme();
  const mode = theme.palette.mode;

  const resolvedAccent = accentColor || DEFAULT_COLOR;
  const currentHue = hexToHue(resolvedAccent) ?? DEFAULT_HUE;
  const [hue, setHue] = useState(currentHue);
  const [hexInput, setHexInput] = useState(resolvedAccent);

  useEffect(() => {
    setHue(currentHue);
    setHexInput(resolvedAccent);
  }, [resolvedAccent, currentHue]);

  const applyHue = useCallback(
    (newHue: number) => {
      const hex = hslToHex(newHue, 70, mode === "dark" ? 55 : 45);
      setAccentColor(hex);
      setHexInput(hex);
    },
    [mode, setAccentColor],
  );

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = Number(e.target.value);
    setHue(newHue);
    applyHue(newHue);
  };

  const handleHexChange = useCallback(
    (raw: string) => {
      setHexInput(raw);
      const cleaned = raw.startsWith("#") ? raw : `#${raw}`;
      if (/^#[0-9a-f]{6}$/i.test(cleaned)) {
        setAccentColor(cleaned.toLowerCase());
      }
    },
    [setAccentColor],
  );

  const resetHue = () => {
    setAccentColor(DEFAULT_COLOR);
    setHexInput(DEFAULT_COLOR);
    setHue(DEFAULT_HUE);
  };

  const isDefault = resolvedAccent.toLowerCase() === DEFAULT_COLOR;
  const sliderBg = getSliderGradient(mode);
  const thumbColor = hslToHex(hue, 70, mode === "dark" ? 55 : 45);

  return (
    <Stack spacing={5}>
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 4,
                height: 16,
                borderRadius: 1,
                bgcolor: "primary.main",
              }}
            />
            <Typography variant="h6">Theme Color</Typography>
            <IconButton
              size="small"
              onClick={resetHue}
              sx={{
                opacity: isDefault ? 0 : 1,
                pointerEvents: isDefault ? "none" : "auto",
                transition: "opacity 0.2s",
              }}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </Stack>
          <Box
            sx={{
              width: 40,
              height: 28,
              borderRadius: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              {hue}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            width: "100%",
            height: 24,
            borderRadius: 1,
            backgroundImage: sliderBg,
            overflow: "hidden",
            position: "relative",
            userSelect: "none",
            mb: 3,
          }}
        >
          <Box
            component="input"
            type="range"
            min={0}
            max={360}
            step={5}
            value={hue}
            onChange={handleHueChange}
            aria-label="Theme color hue"
            sx={{
              width: "100%",
              height: "100%",
              m: 0,
              p: 0,
              appearance: "none",
              WebkitAppearance: "none",
              background: "transparent",
              cursor: "pointer",
              outline: "none",
              "&::-webkit-slider-thumb": {
                WebkitAppearance: "none",
                height: 16,
                width: 8,
                borderRadius: 0.5,
                background: "rgba(255,255,255,0.75)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                cursor: "grab",
                "&:hover": { background: "rgba(255,255,255,0.85)" },
                "&:active": { background: "rgba(255,255,255,0.6)" },
              },
              "&::-moz-range-thumb": {
                height: 16,
                width: 8,
                borderRadius: 0.5,
                border: "none",
                background: "rgba(255,255,255,0.75)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                cursor: "grab",
                "&:hover": { background: "rgba(255,255,255,0.85)" },
                "&:active": { background: "rgba(255,255,255,0.6)" },
              },
            }}
          />
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: resolvedAccent,
              border: `2px solid ${theme.palette.divider}`,
              flexShrink: 0,
            }}
          />
          <TextField
            size="small"
            label="Hex color"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#444444"
            sx={{ maxWidth: 160 }}
            slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: "0.875rem" } } }}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Neutrals
          </Typography>
          <Stack direction="row" spacing={1}>
            {NEUTRAL_SWATCHES.map((color) => {
              const selected = resolvedAccent.toLowerCase() === color.toLowerCase();
              return (
                <Box
                  key={color}
                  onClick={() => {
                    setAccentColor(color);
                    setHexInput(color);
                    setHue(hexToHue(color) ?? 0);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: color,
                    border: selected
                      ? `3px solid ${theme.palette.primary.main}`
                      : `2px solid ${theme.palette.divider}`,
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: selected ? `0 0 0 2px ${theme.palette.background.paper}` : "none",
                    "&:hover": { transform: "scale(1.15)" },
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Preview
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Button variant="contained" size="small" disableFocusRipple disableRipple>Contained</Button>
          <Button variant="outlined" size="small" disableFocusRipple disableRipple>Outlined</Button>
          <Button variant="text" size="small" disableFocusRipple disableRipple>Text</Button>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "inline-block",
            }}
          />
          <Typography variant="body2" color="primary" fontWeight={500}>
            Linked text
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
