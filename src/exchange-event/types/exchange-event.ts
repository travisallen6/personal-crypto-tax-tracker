export interface PaginatedExchangeResponse<T> {
  results: T;
  hasNextPage: boolean;
  currentPage: number;
  resultsCount: number;
}
