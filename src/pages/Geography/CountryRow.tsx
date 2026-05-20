import {
  Box,
  Chip,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Country } from "@/lib/types/geography.types";
import { DATASETS_ENDPOINTS } from "@/lib/api/endpoints";
import type { ColumnKey } from "./CountryColumnsPopover";

const ROW_HEIGHT = 43;

interface CountryRowProps {
  country?: Country;
  loading?: boolean;
  datasetId?: string;
  visibleColumns: Set<ColumnKey>;
  onClick?: () => void;
  onFlagClick?: (country: Country) => void;
}

function FlagImage({ iso }: { iso: string }) {
  const flagEmoji = iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");

  return (
    <Box
      sx={{
        width: 28,
        height: 20,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: "2px",
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
            Object.assign(wrapper.style, { fontSize: "18px", lineHeight: "1", borderRadius: "0" });
          }
        }}
        sx={{ width: 28, height: 20, objectFit: "cover", display: "block", flexShrink: 0 }}
      />
    </Box>
  );
}

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function cellFor(col: ColumnKey, country: Country) {
  const capitalEn = country.capital["en"] ?? country.capital["fr"] ?? Object.values(country.capital)[0] ?? "";

  switch (col) {
    case "iso_alpha2":
      return (
        <TableCell key={col}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{country.iso_alpha2}</Typography>
        </TableCell>
      );
    case "iso_alpha3":
      return (
        <TableCell key={col}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{country.iso_alpha3}</Typography>
        </TableCell>
      );
    case "continent":
      return (
        <TableCell key={col}>
          <Typography variant="body2" noWrap>{country.continent || "—"}</Typography>
        </TableCell>
      );
    case "region":
      return (
        <TableCell key={col}>
          <Tooltip title={country.region || ""}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{country.region || "—"}</Typography>
          </Tooltip>
        </TableCell>
      );
    case "capital":
      return (
        <TableCell key={col}>
          <Typography variant="body2" noWrap>{capitalEn || "—"}</Typography>
        </TableCell>
      );
    case "population":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">{country.population ? formatPopulation(country.population) : "—"}</Typography>
        </TableCell>
      );
    case "area":
      return (
        <TableCell key={col} align="right">
          <Typography variant="body2">{country.area_km2 ? country.area_km2.toLocaleString() : "—"}</Typography>
        </TableCell>
      );
    case "independent":
      return (
        <TableCell key={col}>
          <Chip
            label={country.independent ? "Yes" : "No"}
            size="small"
            color={country.independent ? "success" : "default"}
            variant={country.independent ? "filled" : "outlined"}
          />
        </TableCell>
      );
    case "currency":
      return (
        <TableCell key={col}>
          {country.currency ? (
            <Tooltip title={country.currency.name?.["en"] ?? ""}>
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                {country.currency.code}{country.currency.symbol ? ` (${country.currency.symbol})` : ""}
              </Typography>
            </Tooltip>
          ) : "—"}
        </TableCell>
      );
    case "languages":
      return (
        <TableCell key={col}>
          {country.languages?.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="nowrap">
              {country.languages.slice(0, 3).map((l) => (
                <Chip key={l} label={l.toUpperCase()} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />
              ))}
              {country.languages.length > 3 && (
                <Tooltip title={country.languages.slice(3).join(", ")}>
                  <Chip label={`+${country.languages.length - 3}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.68rem" }} />
                </Tooltip>
              )}
            </Stack>
          ) : <Typography variant="body2">—</Typography>}
        </TableCell>
      );
    case "tld":
      return (
        <TableCell key={col}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
            {country.tld || "—"}
          </Typography>
        </TableCell>
      );
    case "phone_code":
      return (
        <TableCell key={col}>
          <Typography variant="body2">{country.phone_code ? `+${country.phone_code}` : "—"}</Typography>
        </TableCell>
      );
    case "driving_side":
      return (
        <TableCell key={col}>
          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{country.driving_side || "—"}</Typography>
        </TableCell>
      );
    default:
      return <TableCell key={col} />;
  }
}

function skeletonCellFor(col: ColumnKey) {
  if (col === "independent") {
    return (
      <TableCell key={col}>
        <Skeleton variant="rounded" width={36} height={18} />
      </TableCell>
    );
  }
  if (col === "languages") {
    return (
      <TableCell key={col}>
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="rounded" width={28} height={18} />
          <Skeleton variant="rounded" width={28} height={18} />
        </Stack>
      </TableCell>
    );
  }
  const widths: Partial<Record<ColumnKey, number>> = {
    iso_alpha2: 28, iso_alpha3: 36,
    continent: 80, region: 100, capital: 90, population: 56, area: 64,
    currency: 60, tld: 32, phone_code: 48, driving_side: 48,
  };
  return (
    <TableCell key={col} align={col === "population" || col === "area" ? "right" : undefined}>
      <Skeleton variant="text" width={widths[col] ?? 80} sx={{ fontSize: "0.875rem" }} />
    </TableCell>
  );
}

export default function CountryRow({ country, loading, visibleColumns, onClick, onFlagClick }: CountryRowProps) {
  if (loading || !country) {
    return (
      <TableRow sx={{ height: ROW_HEIGHT }}>
        <TableCell sx={{ px: 1.5, width: 44 }}>
          <Skeleton variant="rectangular" width={28} height={20} sx={{ borderRadius: "2px" }} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={130} sx={{ fontSize: "0.875rem" }} />
        </TableCell>
        {Array.from(visibleColumns).map((col) => skeletonCellFor(col))}
      </TableRow>
    );
  }

  const nameEn = country.name["en"] ?? country.name["fr"] ?? Object.values(country.name)[0] ?? country.iso_alpha2;

  return (
    <TableRow hover sx={{ cursor: "pointer", height: ROW_HEIGHT }} onClick={onClick}>
      <TableCell sx={{ px: 1.5, width: 44 }}>
        <Box
          sx={{ cursor: onFlagClick ? "zoom-in" : "inherit", display: "inline-flex" }}
          onClick={onFlagClick ? (e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); onFlagClick(country); } : undefined}
        >
          <FlagImage iso={country.iso_alpha2} />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600} noWrap>{nameEn}</Typography>
      </TableCell>
      {Array.from(visibleColumns).map((col) => cellFor(col, country))}
    </TableRow>
  );
}
