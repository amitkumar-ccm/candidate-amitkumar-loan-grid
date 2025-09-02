import { defineStore } from "pinia";
import type { TableData } from "../types/table";

const applyFilters = (
  data: TableData[],
  searchQuery: string,
  statusFilter: string
): TableData[] => {
  const q = (searchQuery || "").toLowerCase().trim();

  const bySearch = !q
    ? data
    : data.filter((item) => item.borrowerName.toLowerCase().includes(q));

  const filtered =
    statusFilter && statusFilter !== "All"
      ? bySearch.filter((item) => item.status === statusFilter)
      : bySearch;

  return filtered;
};

const compareValues = (a: any, b: any, ascending: boolean) => {
  const dir = ascending ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return -1 * dir;
  if (b == null) return 1 * dir;

  if (typeof a === "number" && typeof b === "number") {
    return a === b ? 0 : a < b ? -1 * dir : 1 * dir;
  }

  const sa = String(a);
  const sb = String(b);
  return sa.localeCompare(sb) * dir;
};

export const useTableStore = defineStore("tableStore", {
  state: () => ({
    data: [] as TableData[],
    pageSize: 25,
    pageSizeOptions: [25, 50, 100],
    startChunk: 1,
    endChunk: 1,
    statusFilter: "All",
    sortField: "",
    sortOrder: "none" as "none" | "ascending" | "descending",
    searchQuery: "",
    loading: false,
  }),

  getters: {
    getData(state) {
      return state.data;
    },

    statusOptions() {
      return ["All", "Pending", "Approved", "Rejected"];
    },

    filteredData(state) {
      return applyFilters(state.data, state.searchQuery, state.statusFilter);
    },

    displayedData(state) {
      const start = (state.startChunk - 1) * state.pageSize;
      const end = state.endChunk * state.pageSize;
      const sorted = (() => {
        const base = applyFilters(
          state.data,
          state.searchQuery,
          state.statusFilter
        );
        if (!state.sortField || state.sortOrder === "none") return base;
        const ascending = state.sortOrder === "ascending";
        return [...base].sort((a, b) =>
          compareValues(
            a[state.sortField as keyof TableData],
            b[state.sortField as keyof TableData],
            ascending
          )
        );
      })();

      return sorted.slice(start, end);
    },

    totalItemsToLoad(state) {
      return applyFilters(state.data, state.searchQuery, state.statusFilter)
        .length;
    },
  },

  actions: {
    setData(data: TableData[]): void {
      this.data = data;
      this.startChunk = 1;
      this.endChunk = 1;
    },

    loadMoreData() {
      if (this.loading) return;

      const totalLoaded = this.endChunk * this.pageSize;
      const filteredLength = applyFilters(
        this.data,
        this.searchQuery,
        this.statusFilter
      ).length;

      if (totalLoaded >= filteredLength) return;

      this.loading = true;

      setTimeout(() => {
        this.endChunk++;
        this.loading = false;
      }, 500);
    },

    loadPreviousData() {
      if (this.loading) return;
      if (this.startChunk <= 1) return;

      this.loading = true;

      setTimeout(() => {
        this.startChunk = Math.max(1, this.startChunk - 1);
        this.loading = false;
      }, 500);
    },

    setRows(rows: number): void {
      this.pageSize = rows;
      this.startChunk = 1;
      this.endChunk = 1;
      this.loading = false;
    },

    setStatusFilter(status: string) {
      this.statusFilter = status;
      this.startChunk = 1;
      this.endChunk = 1;
    },

    setSortField(field: string) {
      if (this.sortField === field) {
        if (this.sortOrder === "ascending") {
          this.sortOrder = "descending";
        } else if (this.sortOrder === "descending") {
          this.sortOrder = "none";
        } else {
          this.sortOrder = "ascending";
        }
      } else {
        this.sortField = field;
        this.sortOrder = "ascending";
      }
    },

    setSearchQuery(query: string): void {
      this.searchQuery = query;
      this.startChunk = 1;
      this.endChunk = 1;
      this.loading = false;
    },
  },
});
