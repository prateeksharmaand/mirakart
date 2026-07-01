import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";

export interface UploadedMedia {
  id: string;
  url: string;
}

export async function uploadFile(file: File, purpose: "RETURN_IMAGES"): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);
  const res = await apiClient.post<ApiSuccessResponse<UploadedMedia>>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}
