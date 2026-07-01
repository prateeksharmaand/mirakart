import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findForPrincipal: jest.fn(),
      findById: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      upsertDeviceToken: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;
    service = new NotificationsService(repo);
  });

  describe("markRead", () => {
    it("throws NotFoundException for a missing notification", async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.markRead("n1", "CUSTOMER", "c1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks reading another customer's notification", async () => {
      repo.findById.mockResolvedValue({ id: "n1", customerId: "someone-else", isRead: false } as never);
      await expect(service.markRead("n1", "CUSTOMER", "c1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("blocks reading another admin's notification", async () => {
      repo.findById.mockResolvedValue({ id: "n1", adminUserId: "someone-else", isRead: false } as never);
      await expect(service.markRead("n1", "ADMIN", "a1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("marks the owner's notification as read", async () => {
      repo.findById.mockResolvedValue({ id: "n1", customerId: "c1", isRead: false } as never);
      repo.markRead.mockResolvedValue({ id: "n1", isRead: true } as never);
      const result = await service.markRead("n1", "CUSTOMER", "c1");
      expect(repo.markRead).toHaveBeenCalledWith("n1");
      expect(result.isRead).toBe(true);
    });

    it("is idempotent for an already-read notification", async () => {
      repo.findById.mockResolvedValue({ id: "n1", customerId: "c1", isRead: true } as never);
      await service.markRead("n1", "CUSTOMER", "c1");
      expect(repo.markRead).not.toHaveBeenCalled();
    });
  });
});
