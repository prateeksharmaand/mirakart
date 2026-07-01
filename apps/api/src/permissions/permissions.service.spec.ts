import type { PermissionsRepository } from "./permissions.repository";
import { PermissionsService } from "./permissions.service";

describe("PermissionsService", () => {
  it("groups permissions by module", async () => {
    const repo = {
      findAll: jest.fn().mockResolvedValue([
        { id: "1", module: "product", action: "VIEW", code: "product.view" },
        { id: "2", module: "product", action: "CREATE", code: "product.create" },
        { id: "3", module: "order", action: "VIEW", code: "order.view" },
      ]),
    } as unknown as jest.Mocked<PermissionsRepository>;
    const service = new PermissionsService(repo);

    const grouped = await service.listGroupedByModule();

    expect(Object.keys(grouped)).toEqual(["product", "order"]);
    expect(grouped.product).toHaveLength(2);
    expect(grouped.order).toHaveLength(1);
  });
});
