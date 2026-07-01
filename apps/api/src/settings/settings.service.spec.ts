import { BadRequestException } from "@nestjs/common";
import { SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";

describe("SettingsService", () => {
  let service: SettingsService;
  let repo: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findByKey: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<SettingsRepository>;
    service = new SettingsService(repo);
  });

  it("requires a group when creating a new setting", async () => {
    repo.findByKey.mockResolvedValue(null);
    await expect(service.update("new.key", { value: "x" }, "a1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates a new setting when a group is provided", async () => {
    repo.findByKey.mockResolvedValue(null);
    await service.update("new.key", { value: "x", group: "general" }, "a1");
    expect(repo.upsert).toHaveBeenCalledWith("new.key", "x", "general", "a1");
  });

  it("reuses the existing group when updating without one", async () => {
    repo.findByKey.mockResolvedValue({ key: "existing.key", group: "payment" } as never);
    await service.update("existing.key", { value: "y" }, "a1");
    expect(repo.upsert).toHaveBeenCalledWith("existing.key", "y", "payment", "a1");
  });
});
