import { apiGet } from "../api-client";
import { REPORTS_ENDPOINTS } from "../api/endpoints";
import type { PaginatedResponse } from "../types/api.types";
import type { Report, ReportStatus } from "../types/reports.types";
import { handleApiError } from "../utils/api-helpers";
import { BaseService } from "./base.service";

class ReportsService extends BaseService {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Report>> {
    return this.getPaginated<Report>(REPORTS_ENDPOINTS.LIST, { ...params });
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    notes?: string,
  ): Promise<void> {
    return this.patch<void>(REPORTS_ENDPOINTS.UPDATE_STATUS(id), {
      status,
      ...(notes !== undefined && { resolution_notes: notes }),
    });
  }

  async getById(id: string): Promise<Report> {
    return this.get<Report>(REPORTS_ENDPOINTS.GET(id));
  }
}

export const reportsService = new ReportsService();
export default reportsService;
