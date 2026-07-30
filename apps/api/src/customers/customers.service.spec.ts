import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CustomersRepository } from "./customers.repository";
import { CustomersService } from "./customers.service";

describe("CustomersService", () => {
  let service: CustomersService;
  let repo: jest.Mocked<CustomersRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      updateProfile: jest.fn(),
      setStatus: jest.fn(),
      findAddresses: jest.fn(),
      findAddressById: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
    } as unknown as jest.Mocked<CustomersRepository>;
    service = new CustomersService(repo);
  });

  describe("updateAddress", () => {
    it("throws NotFoundException for a missing address", async () => {
      repo.findAddressById.mockResolvedValue(null);
      await expect(service.updateAddress("addr1", "c1", {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks updating another customer's address", async () => {
      repo.findAddressById.mockResolvedValue({ id: "addr1", customerId: "someone-else" } as never);
      await expect(service.updateAddress("addr1", "c1", {})).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updateAddress).not.toHaveBeenCalled();
    });

    it("allows updating your own address", async () => {
      repo.findAddressById.mockResolvedValue({ id: "addr1", customerId: "c1" } as never);
      repo.updateAddress.mockResolvedValue({ id: "addr1" } as never);
      await service.updateAddress("addr1", "c1", { city: "Pune" });
      expect(repo.updateAddress).toHaveBeenCalledWith("addr1", "c1", { city: "Pune" });
    });
  });

  describe("removeAddress", () => {
    it("blocks deleting another customer's address", async () => {
      repo.findAddressById.mockResolvedValue({ id: "addr1", customerId: "someone-else" } as never);
      await expect(service.removeAddress("addr1", "c1")).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.deleteAddress).not.toHaveBeenCalled();
    });

    it("deletes your own address", async () => {
      repo.findAddressById.mockResolvedValue({ id: "addr1", customerId: "c1" } as never);
      await service.removeAddress("addr1", "c1");
      expect(repo.deleteAddress).toHaveBeenCalledWith("addr1");
    });
  });

  describe("suspend", () => {
    it("throws NotFoundException for a missing customer", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.suspend("missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("sets status to BLOCKED", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      await service.suspend("c1");
      expect(repo.setStatus).toHaveBeenCalledWith("c1", "BLOCKED");
    });
  });

  describe("activate", () => {
    it("throws NotFoundException for a missing customer", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.activate("missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("sets status to ACTIVE", async () => {
      repo.findById.mockResolvedValue({ id: "c1" } as never);
      await service.activate("c1");
      expect(repo.setStatus).toHaveBeenCalledWith("c1", "ACTIVE");
    });
  });
});
