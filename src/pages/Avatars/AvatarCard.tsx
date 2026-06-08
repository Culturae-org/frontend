import { alpha, Box, ButtonBase, IconButton, Skeleton, styled, Tooltip, Typography } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import React, { useRef, useMemo, useState } from "react";
import { AVATAR_ENDPOINTS } from "@/lib/api/endpoints";
import { SquareChip } from "@/components/Common/StyledComponents";
import { StatusChip } from "@/pages/Users/UserRow";
import type { AdminUser } from "@/lib/types/user.types";
import { AvatarCropperDialog } from "./AvatarCropperDialog";
import { usersService } from "@/lib/services/users.service";
import { enqueueSnackbar } from "notistack";

const ROLE_COLORS: Record<string, "default" | "primary" | "warning" | "error"> = {
  administrator: "error",
  moderator: "warning",
  user: "default",
};

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 55%)`;
}

const CardBase = styled(ButtonBase)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[900],
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  overflow: "hidden",
  transition: "background-color 200ms ease, box-shadow 200ms ease",
  "&:hover": {
    backgroundColor: theme.palette.mode === "light" ? theme.palette.grey[200] : theme.palette.grey[800],
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.35)}`,
  },
}));

const AvatarArea = styled(Box)({
  position: "relative",
  width: "100%",
  paddingBottom: "100%",
  overflow: "hidden",
  flexShrink: 0,
});

const AvatarImg = styled("img")<{ loaded: boolean }>(({ theme, loaded }) => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  opacity: loaded ? 1 : 0,
  transition: theme.transitions.create("opacity"),
  userSelect: "none",
  WebkitUserDrag: "none" as any,
}));

const InitialsBg = styled(Box)<{ color: string }>(({ color }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: color,
}));

const InfoBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75, 1),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(0.5),
  minHeight: 38,
}));

const UploadOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: alpha(theme.palette.common.black, 0.4),
  opacity: 0,
  transition: "opacity 150ms ease",
  ".CardBase:hover &": {
    opacity: 1,
  },
  "&:hover": {
    opacity: 1,
  },
}));

interface AvatarCardProps {
  user: AdminUser;
  onClick: (user: AdminUser) => void;
  onContextMenu?: (user: AdminUser, e: React.MouseEvent) => void;
}

export function AvatarCard({ user, onClick, onContextMenu }: AvatarCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const color = useMemo(() => stringToColor(user.username), [user.username]);
  const showImage = (user.has_avatar || version !== undefined) && !imgError;

  const avatarSrc = useMemo(
    () => AVATAR_ENDPOINTS.GET(user.id, version),
    [user.id, version],
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(user, e);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    const file = new File([blob], "avatar.png", { type: "image/png" });
    await usersService.uploadAvatar(user.id, file);
    setVersion(Date.now());
    setImgLoaded(false);
    setImgError(false);
    enqueueSnackbar("Avatar updated", { variant: "success" });
  };

  const handleCropClose = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  return (
    <>
      <CardBase className="CardBase" onClick={() => onClick(user)} onContextMenu={handleContextMenu}>
        <AvatarArea>
          {showImage && (
            <AvatarImg
              src={avatarSrc}
              loaded={imgLoaded}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              alt={user.username}
            />
          )}
          {showImage && !imgLoaded && (
            <Skeleton
              variant="rectangular"
              sx={{ position: "absolute", inset: 0, height: "100%", width: "100%" }}
            />
          )}
          {!showImage && (
            <InitialsBg color={color}>
              <Typography
                sx={{ color: "#fff", fontWeight: 700, fontSize: "clamp(1.5rem, 5vw, 2.5rem)", userSelect: "none" }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Typography>
            </InitialsBg>
          )}
          {user.is_online && (
            <Box sx={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "success.main",
              border: "2px solid",
              borderColor: "background.paper",
              zIndex: 1,
            }} />
          )}
          <UploadOverlay>
            <Tooltip title="Upload avatar">
              <IconButton size="small" onClick={handleUploadClick} sx={{ color: "#fff" }}>
                <CameraAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </UploadOverlay>
        </AvatarArea>

        <InfoBar>
          <Tooltip title={user.username} disableHoverListener={user.username.length <= 14}>
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}
            >
              {user.username}
            </Typography>
          </Tooltip>
          {user.account_status !== "active" ? (
            <StatusChip status={user.account_status} />
          ) : (
            <SquareChip
              size="small"
              label={user.role}
              color={ROLE_COLORS[user.role] ?? "default"}
              sx={{ fontSize: "0.65rem", height: 18, flexShrink: 0 }}
            />
          )}
        </InfoBar>
      </CardBase>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {cropSrc && (
        <AvatarCropperDialog
          open={!!cropSrc}
          src={cropSrc}
          onClose={handleCropClose}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}

export function AvatarCardSkeleton() {
  return (
    <Box
      sx={(theme) => ({
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: "hidden",
        backgroundColor: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[900],
      })}
    >
      <Box sx={{ position: "relative", width: "100%", paddingBottom: "100%" }}>
        <Skeleton
          variant="rectangular"
          sx={{ position: "absolute", inset: 0, height: "100%", width: "100%" }}
        />
      </Box>
      <Box sx={{ p: "6px 8px", display: "flex", alignItems: "center", gap: 1, minHeight: 38 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rounded" width={40} height={18} />
      </Box>
    </Box>
  );
}
