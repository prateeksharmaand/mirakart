import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CustomersRepository } from "./customers.repository";
import type { CreateAddressDto } from "./dto/create-address.dto";
import type { CustomerQueryDto } from "./dto/customer-query.dto";
import type { UpdateAddressDto } from "./dto/update-address.dto";
import type { UpdateCustomerProfileDto } from "./dto/update-customer-profile.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  async list(query: CustomerQueryDto) {
    const { items, totalItems } = await this.repo.findMany({
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async updateProfile(id: string, dto: UpdateCustomerProfileDto) {
    await this.findOne(id);
    return this.repo.updateProfile(id, dto);
  }

  async block(id: string) {
    await this.findOne(id);
    return this.repo.setStatus(id, "BLOCKED");
  }

  listAddresses(customerId: string) {
    return this.repo.findAddresses(customerId);
  }

  createAddress(customerId: string, dto: CreateAddressDto) {
    return this.repo.createAddress(customerId, {
      label: dto.label,
      fullName: dto.fullName,
      phone: dto.phone,
      line1: dto.line1,
      line2: dto.line2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      type: dto.type ?? "BOTH",
      isDefault: dto.isDefault ?? false,
    });
  }

  async updateAddress(addressId: string, customerId: string, dto: UpdateAddressDto) {
    await this.assertOwnedAddress(addressId, customerId);
    return this.repo.updateAddress(addressId, customerId, dto);
  }

  async removeAddress(addressId: string, customerId: string): Promise<void> {
    await this.assertOwnedAddress(addressId, customerId);
    await this.repo.deleteAddress(addressId);
  }

  private async assertOwnedAddress(addressId: string, customerId: string) {
    const address = await this.repo.findAddressById(addressId);
    if (!address) throw new NotFoundException("Address not found");
    if (address.customerId !== customerId) {
      throw new ForbiddenException("This address does not belong to you");
    }
    return address;
  }
}
