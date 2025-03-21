export interface PaginatedExchangeResponse<T> {
  currentPage: number;
  hasNextPage: boolean;
  result: T;
}
