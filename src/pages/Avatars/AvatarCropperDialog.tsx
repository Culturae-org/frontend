import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "px", width: mediaWidth * 0.9 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  ctx.translate(-crop.x * scaleX, -crop.y * scaleY);
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight);
  ctx.restore();
}

interface AvatarCropperDialogProps {
  open: boolean;
  src: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}

export function AvatarCropperDialog({ open, src, onClose, onConfirm }: AvatarCropperDialogProps) {
  const { t } = useTranslation("dashboard");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const onCropComplete = useCallback(async (pixelCrop: PixelCrop) => {
    setCompletedCrop(pixelCrop);
    if (imageRef.current && previewCanvasRef.current && pixelCrop.width && pixelCrop.height) {
      await canvasPreview(imageRef.current, previewCanvasRef.current, pixelCrop);
    }
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imageRef.current || !previewCanvasRef.current) return;

    const image = imageRef.current;
    const previewCanvas = previewCanvasRef.current;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      previewCanvas,
      0, 0, previewCanvas.width, previewCanvas.height,
      0, 0, offscreen.width, offscreen.height,
    );

    const blob = await offscreen.convertToBlob({ type: "image/png" });

    setUploading(true);
    try {
      await onConfirm(blob);
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("users.edit.avatar.cropTitle")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <ReactCrop
          circularCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={onCropComplete}
          minWidth={100}
          minHeight={100}
          aspect={1}
        >
          <img
            ref={imageRef}
            src={src}
            onLoad={onImageLoad}
            style={{ maxWidth: "100%", maxHeight: "60vh" }}
            alt="crop preview"
          />
        </ReactCrop>
        <canvas ref={previewCanvasRef} style={{ display: "none" }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {t("users.edit.avatar.cropCancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!completedCrop?.width || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? t("users.edit.avatar.cropSaving") : t("users.edit.avatar.cropSave")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
