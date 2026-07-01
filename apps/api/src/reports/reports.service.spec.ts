import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  let service: ReportsService;
  let repo: jest.Mocked<ReportsRepository>;

  beforeEach(() => {
    repo = {
      adminSalesSummary: jest.fn(),
      merchantSalesSummary: jest.fn(),
      topProducts: jest.fn(),
    } as unknown as jest.Mocked<ReportsRepository>;
    service = new ReportsService(repo);
  });

  it("converts ISO date-range query strings into Date objects for the admin summary", async () => {
    await service.adminSalesSummary({ dateFrom: "2026-01-01", dateTo: "2026-01-31" });
    expect(repo.adminSalesSummary).toHaveBeenCalledWith({
      dateFrom: new Date("2026-01-01"),
      dateTo: new Date("2026-01-31"),
    });
  });

  it("scopes the merchant summary to the given merchantId", async () => {
    await service.merchantSalesSummary("m1", {});
    expect(repo.merchantSalesSummary).toHaveBeenCalledWith("m1", { dateFrom: undefined, dateTo: undefined });
  });

  it("defaults topProducts limit to 10 and omits merchantId for the admin view", async () => {
    await service.topProducts({});
    expect(repo.topProducts).toHaveBeenCalledWith(undefined, expect.any(Object), 10);
  });

  it("passes a custom limit and merchantId through for the merchant view", async () => {
    await service.topProducts({ limit: 5 }, "m1");
    expect(repo.topProducts).toHaveBeenCalledWith("m1", expect.any(Object), 5);
  });
});
