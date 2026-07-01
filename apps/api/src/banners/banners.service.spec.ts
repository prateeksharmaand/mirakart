import { NotFoundException } from "@nestjs/common";
import { BannersRepository } from "./banners.repository";
import { BannersService } from "./banners.service";

describe("BannersService", () => {
  let service: BannersService;
  let repo: jest.Mocked<BannersRepository>;

  beforeEach(() => {
    repo = {
      findActiveForPosition: jest.fn(),
      findAllForAdmin: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<BannersRepository>;
    service = new BannersService(repo);
  });

  it("converts ISO date strings to Date objects on create", async () => {
    await service.create({
      title: "Sale",
      mediaId: "m1",
      position: "HOME_HERO",
      startAt: "2026-01-01T00:00:00.000Z",
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ startAt: new Date("2026-01-01T00:00:00.000Z") }),
    );
  });

  it("throws NotFoundException when updating a missing banner", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.update("missing", {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it("clears startAt/endAt when explicitly set to null", async () => {
    repo.findById.mockResolvedValue({ id: "b1" } as never);
    await service.update("b1", { startAt: null, endAt: null });
    expect(repo.update).toHaveBeenCalledWith("b1", expect.objectContaining({ startAt: null, endAt: null }));
  });
});
