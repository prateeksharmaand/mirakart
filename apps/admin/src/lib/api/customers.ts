import { apiClient } from "../api-client";

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: string;
  createdAt: string;
}

export async function listCustomers(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const res = await apiClient.get("/customers", { params });
  return res.data as { data: Customer[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getCustomer(id: string): Promise<Customer> {
  const res = await apiClient.get(`/customers/${id}`);
  return res.data.data as Customer;
}

export async function suspendCustomer(id: string): Promise<Customer> {
  const res = await apiClient.patch(`/customers/${id}/suspend`);
  return res.data.data as Customer;
}

export async function activateCustomer(id: string): Promise<Customer> {
  const res = await apiClient.patch(`/customers/${id}/activate`);
  return res.data.data as Customer;
}
