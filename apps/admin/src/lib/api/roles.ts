import { apiClient } from "../api-client";

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  createdAt: string;
  permissions?: Permission[];
}

export async function listRoles(): Promise<Role[]> {
  const res = await apiClient.get("/roles");
  return res.data.data as Role[];
}

export async function getRole(id: string): Promise<Role> {
  const res = await apiClient.get(`/roles/${id}`);
  return res.data.data as Role;
}

export async function createRole(data: { name: string; permissionIds?: string[] }): Promise<Role> {
  const res = await apiClient.post("/roles", data);
  return res.data.data as Role;
}

export async function updateRole(id: string, data: { name?: string }): Promise<Role> {
  const res = await apiClient.patch(`/roles/${id}`, data);
  return res.data.data as Role;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export async function assignPermissions(id: string, permissionIds: string[]): Promise<void> {
  await apiClient.post(`/roles/${id}/permissions`, { permissionIds });
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export async function listPermissions(): Promise<PermissionGroup[]> {
  const res = await apiClient.get("/permissions");
  return res.data.data as PermissionGroup[];
}
