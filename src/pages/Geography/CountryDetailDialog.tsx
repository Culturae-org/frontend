import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Dismiss24Regular } from "@fluentui/react-icons";
import type { Country } from "@/lib/types/geography.types";
import { DATASETS_ENDPOINTS } from "@/lib/api/endpoints";

interface Props {
  country: Country | null;
  open: boolean;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography fontWeight={600} variant="body2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}

function TextValue({ value }: { value: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {value ?? "—"}
    </Typography>
  );
}

function MonoValue({ value }: { value: string | undefined }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
      {value || "—"}
    </Typography>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Grid2 size={12} sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        color="text.disabled"
        fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}
      >
        {children}
      </Typography>
      <Divider sx={{ mt: 0.5 }} />
    </Grid2>
  );
}

function FlagDisplay({ iso }: { iso: string }) {
  const flagEmoji = iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");

  return (
    <Box
      sx={{
        width: 80,
        height: 56,
        borderRadius: 1,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "action.hover",
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={DATASETS_ENDPOINTS.GET_FLAG(iso)}
        alt={flagEmoji}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          img.style.display = "none";
          const wrapper = img.parentElement;
          if (wrapper) {
            wrapper.textContent = flagEmoji;
            Object.assign(wrapper.style, { fontSize: "36px", lineHeight: "1" });
          }
        }}
        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Box>
  );
}

export default function CountryDetailDialog({ country, open, onClose }: Props) {
  if (!country) return null;

  const nameEn = country.name["en"] ?? country.name["fr"] ?? Object.values(country.name)[0] ?? country.iso_alpha2;
  const officialEn = country.official_name?.["en"] ?? country.official_name?.["fr"] ?? "";
  const capitalEn = country.capital["en"] ?? country.capital["fr"] ?? Object.values(country.capital)[0] ?? "";

  const translatedNames = Object.entries(country.name ?? {})
    .filter(([lang]) => lang !== "en")
    .slice(0, 6);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}>
        <Typography component="span" variant="subtitle1" fontWeight={600}>Country details</Typography>
        <IconButton size="small" onClick={onClose}>
          <Dismiss24Regular />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Stack direction={{ xs: "column", md: "row" }}>

          <Box
            sx={{
              p: 3,
              minWidth: 220,
              borderRight: { md: "1px solid" },
              borderColor: { md: "divider" },
              borderBottom: { xs: "1px solid", md: "none" },
              borderBottomColor: { xs: "divider" },
            }}
          >
            <Stack spacing={2.5}>
              <Stack spacing={1.5} alignItems="flex-start">
                <FlagDisplay iso={country.iso_alpha2} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>{nameEn}</Typography>
                  {officialEn && officialEn !== nameEn && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {officialEn}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  <Chip
                    label={country.iso_alpha2}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.7rem", fontFamily: "monospace" }}
                  />
                  <Chip
                    label={country.iso_alpha3}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.7rem", fontFamily: "monospace" }}
                  />
                  {country.independent && (
                    <Chip label="Independent" size="small" color="success" sx={{ height: 18, fontSize: "0.7rem" }} />
                  )}
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Field label="Continent"><TextValue value={country.continent} /></Field>
                <Field label="Region"><TextValue value={country.region} /></Field>
                {capitalEn && <Field label="Capital"><TextValue value={capitalEn} /></Field>}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Field label="Added">
                  <TextValue value={new Date(country.created_at).toLocaleDateString()} />
                </Field>
                <Field label="Updated">
                  <TextValue value={new Date(country.updated_at).toLocaleDateString()} />
                </Field>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", maxHeight: { md: "75vh" } }}>
            <Grid2 container spacing={2}>

              <SectionHeader>Identity</SectionHeader>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="ISO Alpha-2"><MonoValue value={country.iso_alpha2} /></Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="ISO Alpha-3"><MonoValue value={country.iso_alpha3} /></Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="ISO Numeric"><MonoValue value={country.iso_numeric} /></Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="TLD"><MonoValue value={country.tld} /></Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="Phone code"><TextValue value={country.phone_code ? `+${country.phone_code}` : undefined} /></Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 4 }}>
                <Field label="Driving side">
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {country.driving_side || "—"}
                  </Typography>
                </Field>
              </Grid2>

              <SectionHeader>Geography</SectionHeader>
              <Grid2 size={{ xs: 6, sm: 3 }}>
                <Field label="Population">
                  <TextValue value={country.population ? country.population.toLocaleString() : undefined} />
                </Field>
              </Grid2>
              <Grid2 size={{ xs: 6, sm: 3 }}>
                <Field label="Area">
                  <TextValue value={country.area_km2 ? `${country.area_km2.toLocaleString()} km²` : undefined} />
                </Field>
              </Grid2>
              {country.coordinates && (
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <Field label="Coordinates">
                    <TextValue value={`${country.coordinates.lat.toFixed(4)}°, ${country.coordinates.lng.toFixed(4)}°`} />
                  </Field>
                </Grid2>
              )}

              {country.currency && (
                <>
                  <SectionHeader>Economy</SectionHeader>
                  <Grid2 size={{ xs: 6, sm: 4 }}>
                    <Field label="Currency code"><MonoValue value={country.currency.code} /></Field>
                  </Grid2>
                  <Grid2 size={{ xs: 6, sm: 4 }}>
                    <Field label="Symbol"><TextValue value={country.currency.symbol} /></Field>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 4 }}>
                    <Field label="Currency name">
                      <TextValue value={country.currency.name?.["en"] ?? country.currency.name?.["fr"] ?? Object.values(country.currency.name ?? {})[0]} />
                    </Field>
                  </Grid2>
                </>
              )}

              {country.languages?.length > 0 && (
                <>
                  <SectionHeader>Languages</SectionHeader>
                  <Grid2 size={12}>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {country.languages.map((lang) => (
                        <Chip
                          key={lang}
                          label={lang.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.72rem" }}
                        />
                      ))}
                    </Stack>
                  </Grid2>
                </>
              )}

              {translatedNames.length > 0 && (
                <>
                  <SectionHeader>Name translations</SectionHeader>
                  {translatedNames.map(([lang, name]) => (
                    <Grid2 key={lang} size={{ xs: 6, sm: 4 }}>
                      <Field label={lang.toUpperCase()}><TextValue value={name} /></Field>
                    </Grid2>
                  ))}
                </>
              )}

              {country.neighbors?.length > 0 && (
                <>
                  <SectionHeader>Neighbors ({country.neighbors.length})</SectionHeader>
                  <Grid2 size={12}>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {country.neighbors.map((code) => (
                        <Chip
                          key={code}
                          label={code}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.72rem", fontFamily: "monospace" }}
                        />
                      ))}
                    </Stack>
                  </Grid2>
                </>
              )}

            </Grid2>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
