export type paginateprops<T> = {
  limit: number;
  page: number;
  sortBy: { id: keyof T; desc?: boolean }[];
  conditions?: Partial<T> | null;
  filters?: { id: keyof T; value: string }[];
  globalFilter?: string | null;
};
export type customquerypaginateprops<T> = {
  query: string;
  queryParams: (string | number)[];
  limit: number;
  page: number;
  sortBy: { id: keyof T; desc?: boolean }[];
  filters?: { id: keyof T; value: string }[];
  globalFilter?: string | null;
};

export interface PaginationResults<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
}
