import { Box, styled } from "@mui/material";
import { closeSnackbar, SnackbarKey } from "notistack";
import { forwardRef, useState } from "react";

const SnackbarContent = styled(Box)(({ theme }) => ({
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  fontWeight: 500,
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  cursor: "pointer",
  transition: "all 0.3s ease",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  "&:hover": {
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
    transform: "translateY(-2px)",
  },
}));

interface CustomSnackbarProps {
  id: SnackbarKey;
  message?: string;
}

export const CustomSnackbar = forwardRef<HTMLDivElement, CustomSnackbarProps>(
  ({ id, message }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      const startX = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        setDragOffset(diff);

        if (Math.abs(diff) > 100) {
          closeSnackbar(id);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setDragOffset(0);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleClick = () => {
      if (!isDragging) {
        closeSnackbar(id);
      }
    };

    return (
      <Box
        ref={ref}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        sx={{
          transform: `translateX(${dragOffset}px)`,
          opacity: 1 - Math.abs(dragOffset) / 200,
          transition: isDragging ? "none" : "all 0.3s ease",
        }}
      >
        <SnackbarContent>{message}</SnackbarContent>
      </Box>
    );
  },
);

CustomSnackbar.displayName = "CustomSnackbar";

export default CustomSnackbar;
