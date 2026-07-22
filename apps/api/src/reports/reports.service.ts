import { Injectable } from "@nestjs/common";
import { ReportsRepository, type DateRange } from "./reports.repository";
import type { ReportQueryDto, TopProductsQueryDto } from "./dto/report-query.dto";

function toRange(query: ReportQueryDto): DateRange {
  return {
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
    dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
  };
}

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  adminSalesSummary(query: ReportQueryDto) {
    return this.repo.adminSalesSummary(toRange(query));
  }

  merchantSalesSummary(merchantId: string, query: ReportQueryDto) {
    return this.repo.merchantSalesSummary(merchantId, toRange(query));
  }

  topProducts(query: TopProductsQueryDto, merchantId?: string) {
    return this.repo.topProducts(merchantId, toRange(query), query.limit ?? 10);
  }

  codOrderStats() {
    return this.repo.codOrderStats();
  }

  adminOrderStats() {
    return this.repo.adminOrderStats();
  }

  merchantOrderStatusSummary(merchantId: string) {
    return this.repo.merchantOrderStatusSummary(merchantId);
  }

  merchantStockSummary(merchantId: string) {
    return this.repo.merchantStockSummary(merchantId);
  }
}
