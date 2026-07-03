"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, toast } from "@mirakart/ui";
import { ChevronDown, ChevronUp, Star, Trash2, Upload } from "lucide-react";
import {
  listProductImages,
  uploadProductImage,
  addProductImage,
  deleteProductImage,
  setProductImagePrimary,
  reorderProductImages,
  type ProductImage,
} from "../lib/api/products";

// Inline cropper (avoids shared-component coupling between apps)
const CANVAS_SIZE = 400;
const CROP_SIZE = 320;
const CROP_OFFSET = (CANVAS_SIZE - CROP_SIZE) / 2;

function ImageCropper({ file, onCrop, onCancel }: { file: File; onCrop: (b: Blob) => void; onCancel: () => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setScale(Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight));
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
    const dx = CANVAS_SIZE / 2 + pan.x - (img.naturalWidth * scale) / 2;
    const dy = CANVAS_SIZE / 2 + pan.y - (img.naturalHeight * scale) / 2;
    ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CROP_OFFSET);
    ctx.fillRect(0, CROP_OFFSET + CROP_SIZE, CANVAS_SIZE, CROP_OFFSET);
    ctx.fillRect(0, CROP_OFFSET, CROP_OFFSET, CROP_SIZE);
    ctx.fillRect(CROP_OFFSET + CROP_SIZE, CROP_OFFSET, CROP_OFFSET, CROP_SIZE);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(CROP_OFFSET, CROP_OFFSET, CROP_SIZE, CROP_SIZE);
  }, [scale, pan]);

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = 800;
    out.height = 800;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const dx = CANVAS_SIZE / 2 + pan.x - (img.naturalWidth * scale) / 2;
    const dy = CANVAS_SIZE / 2 + pan.y - (img.naturalHeight * scale) / 2;
    ctx.drawImage(img, (CROP_OFFSET - dx) / scale, (CROP_OFFSET - dy) / scale, CROP_SIZE / scale, CROP_SIZE / scale, 0, 0, 800, 800);
    out.toBlob((b) => { if (b) onCrop(b); }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div className="rounded-xl bg-white p-6 shadow-xl flex flex-col items-center gap-4" style={{ width: `${CANVAS_SIZE + 48}px` }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold self-start">Crop Image</h2>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ cursor: "grab", borderRadius: "8px", background: "#f3f4f6" }}
          onMouseDown={(e) => { const r = canvasRef.current!.getBoundingClientRect(); dragRef.current = { sx: e.clientX - r.left, sy: e.clientY - r.top, px: pan.x, py: pan.y }; }}
          onMouseMove={(e) => { if (!dragRef.current) return; const r = canvasRef.current!.getBoundingClientRect(); setPan({ x: dragRef.current.px + (e.clientX - r.left) - dragRef.current.sx, y: dragRef.current.py + (e.clientY - r.top) - dragRef.current.sy }); }}
          onMouseUp={() => { dragRef.current = null; }}
          onMouseLeave={() => { dragRef.current = null; }}
          onWheel={(e) => { e.preventDefault(); setScale((s) => Math.max(0.1, Math.min(5, s - e.deltaY * 0.001))); }}
        />
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}>− Zoom</Button>
          <span className="text-xs text-muted-foreground w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.min(5, s + 0.1))}>+ Zoom</Button>
        </div>
        <p className="text-xs text-muted-foreground">Drag to reposition · Scroll to zoom</p>
        <div className="flex gap-3 w-full">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button type="button" className="flex-1" onClick={handleCrop}>Use This Image</Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  productId: string;
}

export function ProductImageManager({ productId }: Props) {
  const qc = useQueryClient();
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["admin-product-images", productId],
    queryFn: () => listProductImages(productId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-product-images", productId] });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onSuccess: () => { invalidate(); toast({ title: "Image removed", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const primaryMutation = useMutation({
    mutationFn: (imageId: string) => setProductImagePrimary(productId, imageId),
    onSuccess: () => { invalidate(); toast({ title: "Primary image updated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => reorderProductImages(productId, items),
    onSuccess: invalidate,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    e.target.value = "";
  };

  const handleCrop = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const media = await uploadProductImage(blob);
      await addProductImage(productId, media.id, images.length === 0);
      invalidate();
      toast({ title: "Image added", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Unknown error", variant: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index: number, dir: "up" | "down") => {
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= images.length) return;
    const reordered = [...images] as ProductImage[];
    const a = reordered[index]!;
    const b = reordered[swap]!;
    reordered[index] = b;
    reordered[swap] = a;
    reorderMutation.mutate(reordered.map((img, i) => ({ id: img.id, sortOrder: i })));
  };

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Product Images</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{images.length}/5 images. Starred = primary.</p>
        </div>
        {images.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
            <Upload className="mr-2 h-4 w-4" />Upload
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />

      {images.length === 0 ? (
        <button type="button" className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload a product image</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "1" }}>
              <img src={image.media.url} alt="" className="w-full h-full object-cover" />
              {image.isPrimary && (
                <div className="absolute top-1.5 left-1.5 rounded-full bg-primary p-1">
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button type="button" className="rounded-full bg-white/90 p-2 hover:bg-white shadow" onClick={() => primaryMutation.mutate(image.id)}>
                    <Star className="h-3.5 w-3.5 text-primary" />
                  </button>
                )}
                <button type="button" className="rounded-full bg-white/90 p-2 hover:bg-white shadow disabled:opacity-40" onClick={() => deleteMutation.mutate(image.id)} disabled={images.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </button>
              </div>
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" className="rounded bg-white/90 p-0.5 hover:bg-white shadow disabled:opacity-30" onClick={() => moveImage(index, "up")} disabled={index === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="rounded bg-white/90 p-0.5 hover:bg-white shadow disabled:opacity-30" onClick={() => moveImage(index, "down")} disabled={index === images.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cropFile && <ImageCropper file={cropFile} onCrop={handleCrop} onCancel={() => setCropFile(null)} />}
    </div>
  );
}
