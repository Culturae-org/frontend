import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Divider,
  Typography,
  useTheme,
} from "@mui/material";
import { MoreVertical20Regular } from "@fluentui/react-icons";
import { useState } from "react";

export interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export const SquareMenu = styled(Menu)(() => ({
  "& .MuiPaper-root": {
    minWidth: "200px",
  },
}));

export const SquareMenuItem = styled(MenuItem)<{ hoverColor?: string }>(
  ({ theme, hoverColor }) => ({
    "&:hover .MuiListItemIcon-root": {
      color: hoverColor ?? theme.palette.primary.main,
    },
  }),
);

export const DenseDivider = styled(Divider)(() => ({
  margin: "4px 0 !important",
}));

interface RowActionMenuProps {
  actions: ActionMenuItem[];
  title?: string;
}

export function RowActionMenu({ actions, title }: RowActionMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const open = Boolean(anchor);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleAction = (action: ActionMenuItem) => {
    handleClose();
    action.onClick();
  };

  const normalActions = actions.filter((a) => !a.danger);
  const dangerActions = actions.filter((a) => a.danger);

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertical20Regular />
      </IconButton>
      <SquareMenu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{
          dense: true,
        }}
      >
        {title && (
          <>
            <Box sx={{ px: "12px", py: "10px" }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {title}
              </Typography>
            </Box>
            <DenseDivider />
          </>
        )}
        {normalActions.map((action, index) => (
          <SquareMenuItem
            key={index}
            dense
            disabled={action.disabled}
            onClick={() => handleAction(action)}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </SquareMenuItem>
        ))}
        {dangerActions.length > 0 && normalActions.length > 0 && (
          <DenseDivider />
        )}
        {dangerActions.map((action, index) => (
          <SquareMenuItem
            key={`danger-${index}`}
            dense
            disabled={action.disabled}
            hoverColor={theme.palette.error.light}
            onClick={() => handleAction(action)}
          >
            <ListItemIcon sx={{ color: theme.palette.error.main }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText sx={{ color: theme.palette.error.main }}>
              {action.label}
            </ListItemText>
          </SquareMenuItem>
        ))}
      </SquareMenu>
    </>
  );
}
