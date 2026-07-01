import { apiClient } from "../api-client";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  role?: { id: string; name: string } | null;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function listAdminUsers(params: AdminUserListParams = {}) {
  const res = await apiClient.get("/admin-users", { params });
  return res.data as { data: AdminUser[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const res = await apiClient.get(`/admin-users/${id}`);
  return res.data.data as AdminUser;
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId?: string;
}): Promise<AdminUser> {
  const res = await apiClient.post("/admin-users", data);
  return res.data.data as AdminUser;
}

export async function updateAdminUser(
  id: string,
  data: { firstName?: string; lastName?: string; status?: string; roleId?: string },
): Promise<AdminUser> {
  const res = await apiClient.patch(`/admin-users/${id}`, data);
  return res.data.data as AdminUser;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiClient.delete(`/admin-users/${id}`);
}
