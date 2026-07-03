"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, toast } from "@mirakart/ui";
import { ChevronDown, ChevronUp, Star, Trash2, Upload } from "lucide-react";
import { ImageCropper } from "./image-cropper";
import {
  listProductImages,
  uploadProductImage,
  addProductImage,
  deleteProductImage,
  setProductImagePrimary,
  reorderProductImages,
} from "../lib/api/products";

interface Props {
  productId: string;
}

export function ProductImageManager({ productId }: Props) {
  const qc = useQueryClient();
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: () => listProductImages(productId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["product-images", productId] });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onSuccess: () => { invalidate(); toast({ title: "Image removed", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed to remove image", description: e.message, variant: "danger" }),
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
      toast({ title: "Image added successfully", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Unknown error", variant: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= images.length) return;
    const reordered = [...images];
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Up to 5 images. {images.length}/5 used. The starred image appears first.
          </p>
        </div>
        {images.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />

      {images.length === 0 ? (
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Click to upload the first product image</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · up to 5 MB</p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border bg-gray-50" style={{ aspectRatio: "1" }}>
              <img src={image.media.url} alt="" className="w-full h-full object-cover" />

              {image.isPrimary && (
                <div className="absolute top-1.5 left-1.5 rounded-full bg-primary p-1 shadow">
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
              )}

              {/* Hover overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    title="Set as primary"
                    className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors shadow"
                    onClick={() => primaryMutation.mutate(image.id)}
                    disabled={primaryMutation.isPending}
                  >
                    <Star className="h-3.5 w-3.5 text-primary" />
                  </button>
                )}
                <button
                  type="button"
                  title="Remove image"
                  className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors shadow disabled:opacity-40"
                  onClick={() => deleteMutation.mutate(image.id)}
                  disabled={images.length <= 1 || deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </button>
              </div>

              {/* Reorder arrows */}
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Move up"
                  className="rounded bg-white/90 p-0.5 hover:bg-white transition-colors shadow disabled:opacity-30"
                  onClick={() => moveImage(index, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  className="rounded bg-white/90 p-0.5 hover:bg-white transition-colors shadow disabled:opacity-30"
                  onClick={() => moveImage(index, "down")}
                  disabled={index === images.length - 1}
                >
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
