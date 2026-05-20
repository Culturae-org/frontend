import { LoadingButton } from "@mui/lab";
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  ButtonProps,
  Checkbox,
  Chip,
  FormControlLabel,
  FormControlLabelProps,
  ListItemText,
  ListItemTextProps,
  Paper,
  Select,
  styled,
  Tab,
  TableCell,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

export const BorderedCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

export const BorderedCardClickable = styled(BorderedCard)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  transition: "background-color 0.3s ease",
}));

export const BorderedCardClickableBaImg = styled(BorderedCardClickable)<{
  img?: string;
}>(({ img }) => ({
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-20px",
    right: "-20px",
    width: "150px",
    height: "150px",
    backgroundImage: `url(${img})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "rotate(-10deg)",
    opacity: 0.1,
    maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  boxShadow: "initial",
  border: `1px solid ${theme.palette.divider}`,
}));

export const DefaultButton = styled(({ variant, ...rest }: ButtonProps) => (
  <Button variant={variant} {...rest} />
))(({ variant, theme }) => ({
  color: theme.palette.text.primary,
  minHeight: theme.spacing(4),
  "& .MuiButton-startIcon": {
    marginLeft: 0,
  },
  border:
    variant === "outlined" ? `1px solid ${theme.palette.divider}` : "none",
}));

export const SecondaryButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.action.hover,
  "&:hover": {
    backgroundColor: theme.palette.action.focus,
  },
}));

export const SecondaryLoadingButton = styled(LoadingButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.action.hover,
  "&:hover": {
    backgroundColor: theme.palette.action.focus,
  },
}));

export const NoWrapTypography = styled(Typography)({
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

export const NoWrapBox = styled(Box)({
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

export const BadgeText = styled(NoWrapTypography)({
  marginLeft: "8px",
});

export const FilledTextField = styled(TextField)(() => ({
  "& .Mui-disabled:before": {
    border: "none",
  },
}));

export const DenseFilledTextField = styled(FilledTextField)(({ theme }) => ({
  "& .MuiOutlinedInput-input": {
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    fontSize: theme.typography.body2.fontSize,
  },
  "& .MuiInputBase-root.MuiOutlinedInput-root": {
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: theme.typography.body2.fontSize,
  },
  "& .MuiInputLabel-root": {
    fontSize: theme.typography.body2.fontSize,
    "&:not(.Mui-focused):not(.MuiInputLabel-shrink)": {
      transform: "translate(14px, 10px) scale(1)",
    },
  },
}));

export const NoLabelFilledTextField = styled(FilledTextField)<{
  fullSize?: boolean;
  multiline?: boolean;
}>(({ theme, fullSize, multiline }) => ({
  "& .MuiInputBase-root": {
    transition: theme.transitions.create(
      ["box-shadow", "border-radius", "background-color"],
      {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
      },
    ),
    ...(fullSize
      ? {}
      : {
          backgroundColor: "initial",
          borderRadius: 0,
        }),
    paddingTop: 0,
    paddingBottom: 0,
    "&.Mui-focused": {
      ...(fullSize
        ? {}
        : {
            boxShadow: `inset 0 0 0 1px ${theme.palette.primary.light}`,
            borderRadius: theme.spacing(0.5),
          }),
    },
    "&.Mui-focused, &:hover": {
      ...(fullSize
        ? {}
        : {
            backgroundColor: "initial",
          }),
    },
    "&.Mui-disabled": {
      ...(fullSize
        ? {}
        : {
            backgroundColor: "initial",
          }),
      borderBottomStyle: "none",
      "&::before": {
        borderBottomStyle: "none !important",
      },
    },
  },
  "& .MuiInputBase-root.MuiFilledInput-root": {
    ...(fullSize
      ? {}
      : {
          padding: "0!important",
          paddingLeft: 0,
          paddingRight: 0,
        }),
  },
  "& .MuiFilledInput-input": {
    ...(fullSize
      ? {
          paddingTop: theme.spacing(1),
          paddingBottom: theme.spacing(1),
        }
      : {
          padding: "0!important",
        }),
    ...(!multiline && !fullSize
      ? {
          height: "23px",
        }
      : {}),
    fontSize: theme.typography.body2.fontSize,
    "&.Mui-disabled": {
      ...(fullSize
        ? {}
        : {
            backgroundColor: "initial",
          }),
      borderBottomStyle: "none",
      "&::before": {
        borderBottomStyle: "none !important",
      },
    },
  },
}));

export const DenseAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    paddingTop: "6px",
    paddingBottom: "6px",
    fontSize: theme.typography.body2.fontSize,
  },
  "& .MuiInputLabel-root": {
    fontSize: theme.typography.body2.fontSize,
    "&:not(.Mui-focused):not(.MuiInputLabel-shrink)": {
      transform: "translate(14px, 12px) scale(1)",
    },
  },
  "& .MuiOutlinedInput-root .MuiAutocomplete-input": {
    padding: "5.5px 4px 5.5px 5px",
  },
}));

export const NoWrapTableCell = styled(TableCell)({
  whiteSpace: "nowrap",
});

export const NoWrapCell = styled(TableCell)({
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

export const StyledCheckbox = styled(Checkbox)(() => ({
  width: 16,
  height: 16,
}));

export const DenseSelect = styled(Select)(() => ({
  "& .MuiOutlinedInput-input": {
    display: "flex",
    alignItems: "center",
    paddingTop: "5px",
    paddingBottom: "5px",
  },
  "& .MuiFilledInput-input": {
    paddingTop: "4px",
    paddingBottom: "4px",
  },
  "& .MuiListItemIcon-root": {
    minWidth: 36,
  },
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
  padding: "8px 0px",
  overflow: "initial",
  minHeight: 36,
  minWidth: 0,
  transition: theme.transitions.create(["background-color", "color"]),
  "&::after": {
    content: "''",
    borderRadius: 8,
    position: "absolute",
    top: 4,
    bottom: 4,
    left: -8,
    right: -8,
    transition: theme.transitions.create(["background-color"]),
  },
  "&.MuiTab-root>.MuiTab-iconWrapper": {
    height: 20,
    width: 20,
    marginRight: 4,
    marginBottom: 0,
  },
  "&.MuiTab-root": {
    flexDirection: "row",
    paddingRight: 4,
  },
  "&.MuiButtonBase-root .MuiTouchRipple-root": {
    borderRadius: 8,
    top: 4,
    bottom: 4,
    left: -8,
    right: -8,
  },
  "&:hover": {
    "&:not(.Mui-selected)": { color: theme.palette.text.primary },
    "&::after": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-selected::after": {
      backgroundColor: alpha(theme.palette.primary.main, 0.06),
    },
  },
}));

export const StyledTabs = styled(Tabs)(() => ({
  minHeight: 36,
  overflow: "initial",
  "& .MuiTabs-flexContainer": {
    gap: 24,
  },
  "& .MuiTabs-scroller": {
    overflow: "initial!important",
  },
  "& .MuiTabs-indicator": {
    bottom: "initial",
  },
}));

export const SquareChip = styled(Chip)(() => ({
  borderRadius: 8,
}));

export const SmallFormControlLabel = styled((props: FormControlLabelProps) => (
  <FormControlLabel
    {...props}
    slotProps={{
      typography: {
        variant: "body2",
      },
    }}
  />
))(() => ({}));

export const StyledListItemText = styled((props: ListItemTextProps) => (
  <ListItemText
    {...props}
    slotProps={{
      primary: {
        variant: "subtitle2",
        color: "textPrimary",
      },
      secondary: {
        variant: "body2",
      },
    }}
  />
))(() => ({}));

export const StyledTableContainerPaper = styled(Paper)(({ theme }) => ({
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
}));

export const StyledListItemIcon = styled(Box)(() => ({
  minWidth: 0,
  display: "flex",
  alignItems: "center",
}));
