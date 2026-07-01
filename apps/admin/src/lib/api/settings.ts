import { apiClient } from "../api-client";

export interface Setting {
  key: string;
  value: string;
  type: string;
  description?: string | null;
}

export async function listSettings(): Promise<Setting[]> {
  const res = await apiClient.get("/settings");
  return res.data.data as Setting[];
}

export async function updateSetting(key: string, value: string): Promise<Setting> {
  const res = await apiClient.patch(`/settings/${key}`, { value });
  return res.data.data as Setting;
}

export async function bulkUpdateSettings(settings: Record<string, string>): Promise<void> {
  await apiClient.patch("/settings", { settings });
}
