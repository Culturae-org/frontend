export interface SuccessResponse<T = unknown> {
  message?: string;
  data: T;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorWrapper {
  error: ErrorResponse;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: ErrorResponse | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export class ApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UsersQueryParams extends PaginationParams {
  role?: string;
  rank?: string;
  account_status?: string;
  status?: string;
  query?: string;
  has_avatar?: boolean;
}
