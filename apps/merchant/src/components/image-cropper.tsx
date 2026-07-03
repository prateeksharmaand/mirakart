"use client";

import * as React from "react";
import { Button } from "@mirakart/ui";

interface Props {
  file: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

const CANVAS_SIZE = 400;
const CROP_SIZE = 320;
const CROP_OFFSET = (CANVAS_SIZE - CROP_SIZE) / 2;

export function ImageCropper({ file, onCrop, onCancel }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const initScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setScale(initScale);
      setPan({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const drawX = CANVAS_SIZE / 2 + pan.x - (img.naturalWidth * scale) / 2;
    const drawY = CANVAS_SIZE / 2 + pan.y - (img.naturalHeight * scale) / 2;
    ctx.drawImage(img, drawX, drawY, img.naturalWidth * scale, img.naturalHeight * scale);

    // Dim areas outside crop
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CROP_OFFSET);
    ctx.fillRect(0, CROP_OFFSET + CROP_SIZE, CANVAS_SIZE, CROP_OFFSET);
    ctx.fillRect(0, CROP_OFFSET, CROP_OFFSET, CROP_SIZE);
    ctx.fillRect(CROP_OFFSET + CROP_SIZE, CROP_OFFSET, CROP_OFFSET, CROP_SIZE);

    // Crop border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(CROP_OFFSET, CROP_OFFSET, CROP_SIZE, CROP_SIZE);

    // Corner handles
    const hs = 12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    const corners = [
      [CROP_OFFSET, CROP_OFFSET, 1, 1],
      [CROP_OFFSET + CROP_SIZE, CROP_OFFSET, -1, 1],
      [CROP_OFFSET, CROP_OFFSET + CROP_SIZE, 1, -1],
      [CROP_OFFSET + CROP_SIZE, CROP_OFFSET + CROP_SIZE, -1, -1],
    ] as const;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * hs);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * hs, cy);
      ctx.stroke();
    }
  }, [scale, pan]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    dragRef.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top, startPanX: pan.x, startPanY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setPan({
      x: dragRef.current.startPanX + (e.clientX - rect.left) - dragRef.current.startX,
      y: dragRef.current.startPanY + (e.clientY - rect.top) - dragRef.current.startY,
    });
  };

  const handleMouseUp = () => { dragRef.current = null; };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setScale((s) => Math.max(0.1, Math.min(5, s - e.deltaY * 0.001)));
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const output = document.createElement("canvas");
    output.width = 800;
    output.height = 800;
    const ctx = output.getContext("2d");
    if (!ctx) return;

    const drawX = CANVAS_SIZE / 2 + pan.x - (img.naturalWidth * scale) / 2;
    const drawY = CANVAS_SIZE / 2 + pan.y - (img.naturalHeight * scale) / 2;
    const srcX = (CROP_OFFSET - drawX) / scale;
    const srcY = (CROP_OFFSET - drawY) / scale;
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 800, 800);
    output.toBlob((blob) => { if (blob) onCrop(blob); }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div
        className="rounded-xl bg-white p-6 shadow-xl flex flex-col items-center gap-4"
        style={{ width: `${CANVAS_SIZE + 48}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold self-start">Crop Image</h2>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ cursor: "grab", borderRadius: "8px", userSelect: "none", background: "#f3f4f6" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}>
            − Zoom
          </Button>
          <span className="text-xs text-muted-foreground w-16 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.min(5, s + 0.1))}>
            + Zoom
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Drag to reposition · Scroll to zoom · Image will be cropped to the square frame</p>

        <div className="flex gap-3 w-full">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleCrop}>
            Use This Image
          </Button>
        </div>
      </div>
    </div>
  );
}
