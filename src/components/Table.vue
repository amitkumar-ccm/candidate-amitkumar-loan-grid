<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { useTableStore } from "../composables/useTable";
import debounce from "lodash/debounce";
import Data from "../../data/loans.json";
import Header from "./Header.vue";
import type { TableData } from "../types/table";

const tableStore = useTableStore();
const search = ref("");
const searchPending = ref(false);

const handleSort = (field: string) => tableStore.setSortField(field);

const handleRowsChange = (event: Event) => {
  const selectElement = event.target as HTMLSelectElement;
  const newRowsPerPage = parseInt(selectElement.value);
  tableStore.setRows(newRowsPerPage);
};

const handleStatusChange = (event: Event) => {
  const selectElement = event.target as HTMLSelectElement;
  const status = selectElement.value;
  tableStore.setStatusFilter(status);
};

const tableContainer = ref<HTMLElement | null>(null);

const debouncedSetSearch = debounce((val: string) => {
  tableStore.setSearchQuery(val);
  searchPending.value = false;
}, 300);

const debouncedLoadPrev = debounce(() => tableStore.loadPreviousData(), 500);

const handleScroll = () => {
  const table = tableContainer.value;
  if (!table) return;
  const { scrollTop, scrollHeight, clientHeight } = table;

  if (scrollTop + clientHeight >= scrollHeight - 5) {
    tableStore.loadMoreData();
  }

  if (scrollTop <= 5) {
    debouncedLoadPrev();
  }
};

onMounted(() => tableStore.setData(Data as TableData[]));

watch(
  search,
  (val) => {
    searchPending.value = true;
    debouncedSetSearch(val);
  },
  { flush: "sync" }
);

onUnmounted(() => {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }

  debouncedLoadPrev.cancel?.();
  debouncedSetSearch.cancel?.();
});

const headers = computed(() =>
  tableStore.data.length ? Object.keys(tableStore.data[0]) : []
);

const displayedData = computed(() => tableStore.displayedData as TableData[]);

const totalItemsToLoad = computed(() => tableStore.totalItemsToLoad as number);

const loading = computed(() => tableStore.loading);
const sortField = computed(() => tableStore.sortField);
const sortOrder = computed(() => tableStore.sortOrder);
const pageSizeOptions = computed(() => tableStore.pageSizeOptions);

const loadingText = ref("Loading");
let loadingInterval: ReturnType<typeof setInterval> | null = null;
watch(
  () => loading.value,
  (val) => {
    if (val) {
      loadingText.value = "Loading";
      loadingInterval = setInterval(() => {
        loadingText.value =
          loadingText.value.length >= 10 ? "Loading" : loadingText.value + ".";
      }, 400);
    } else {
      if (loadingInterval) clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
);
</script>

<template>
  <div class="table-root">
    <div class="controls">
      <div class="search">
        <label for="search">Search Borrower Name:</label>
        <div class="search-input-wrap">
          <input
            id="search"
            type="text"
            v-model="search"
            placeholder="Search by borrower name"
          />
          <span v-if="searchPending" class="spinner" aria-hidden="true"></span>
        </div>
      </div>

      <div class="rows">
        <label for="rows">Rows per page:</label>
        <select id="rows" @change="handleRowsChange">
          <option
            v-for="option in pageSizeOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>

      <div class="status">
        <label for="status">Status:</label>
        <select id="status" @change="handleStatusChange">
          <option
            v-for="opt in tableStore.statusOptions"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
      </div>

      <p class="summary">
        Showing {{ displayedData.length }} of {{ totalItemsToLoad }} items
      </p>
    </div>

    <div class="table-wrapper">
      <div class="table-scroll" ref="tableContainer" @scroll="handleScroll">
        <table>
          <thead>
            <tr>
              <Header
                v-if="headers.length"
                v-for="key in headers"
                :key="key"
                :header-title="key"
                :field-name="key"
                :sort-order="sortField === key ? sortOrder : 'none'"
                @sort="handleSort"
              />
            </tr>
          </thead>

          <tbody>
            <td
              :colspan="headers.length"
              v-if="displayedData.length === 0"
              class="no-data"
            >
              No Data
            </td>
            <tr v-for="item in displayedData" :key="item.id">
              <td v-for="(value, key) in item" :key="key">{{ value }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="loading" class="loading-overlay">Loading...</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.table-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background-color: rgba(255, 255, 255, 1);
}

.controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 1);
  border-bottom: 2px solid rgba(229, 231, 235, 1);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  flex-wrap: wrap;

  .search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;

    label {
      font-weight: 500;
      color: rgba(55, 65, 81, 1);
      white-space: nowrap;
    }

    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid rgba(229, 231, 235, 1);
        border-radius: 0.375rem;
        font-size: 0.875rem;
        min-width: 200px;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          outline: none;
          border-color: rgba(37, 99, 235, 1);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        &::placeholder {
          color: rgba(156, 163, 175, 1);
        }
      }

      .spinner {
        position: absolute;
        right: 0.5rem;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(229, 231, 235, 1);
        border-top: 2px solid rgba(37, 99, 235, 1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }
  }

  .rows {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    label {
      font-weight: 500;
      color: rgba(55, 65, 81, 1);
      white-space: nowrap;
    }

    select {
      padding: 0.5rem;
      border: 1px solid rgba(229, 231, 235, 1);
      border-radius: 0.375rem;
      background-color: rgba(255, 255, 255, 1);
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: rgba(37, 99, 235, 1);
      }
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    label {
      font-weight: 500;
      color: rgba(55, 65, 81, 1);
      white-space: nowrap;
    }

    select {
      padding: 0.5rem;
      border: 1px solid rgba(229, 231, 235, 1);
      border-radius: 0.375rem;
      background-color: rgba(255, 255, 255, 1);
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: rgba(37, 99, 235, 1);
      }
    }
  }

  .summary {
    margin-left: auto;
    font-size: 0.875rem;
    color: rgba(55, 65, 81, 1);
    font-weight: 500;
  }
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.table-scroll {
  height: 100%;
  overflow: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(241, 241, 241, 1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(193, 193, 193, 1);
    border-radius: 4px;

    &:hover {
      background: rgba(168, 168, 168, 1);
    }
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(255, 255, 255, 1);
  min-width: 600px;

  thead {
    position: sticky;
    top: 0;
    background-color: rgba(255, 255, 255, 1);
    z-index: 10;

    tr {
      border-bottom: 2px solid rgba(229, 231, 235, 1);
    }

    th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: rgba(55, 65, 81, 1);
      background-color: rgba(248, 250, 252, 1);
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
      position: relative;

      &:hover {
        background-color: rgba(241, 245, 249, 1);
      }

      &:not(:last-child) {
        border-right: 1px solid rgba(229, 231, 235, 1);
      }

      .header-class {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .header-icon {
        flex-shrink: 0;
        font-size: 0.875rem;
        transition: color 0.2s;

        &.text-light-grey {
          color: rgba(156, 163, 175, 1);
        }

        &.fas {
          &.fa-sort-up {
            color: rgba(37, 99, 235, 1);
          }

          &.fa-sort-down {
            color: rgba(37, 99, 235, 1);
          }

          &.fa-sort {
            color: rgba(156, 163, 175, 1);
          }
        }
      }

      &[aria-sort="ascending"] .header-icon {
        color: rgba(37, 99, 235, 1);
      }

      &[aria-sort="descending"] .header-icon {
        color: rgba(37, 99, 235, 1);
      }
    }
  }

  tbody {
    .no-data {
      text-align: center;
      padding: 20px;
      font-size: 1.2rem;
      color: rgba(55, 65, 81, 1);
      font-weight: 500;
    }
    tr {
      border-bottom: 1px solid rgba(229, 231, 235, 1);
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(249, 250, 251, 1);
      }

      &:last-child {
        border-bottom: none;
      }

      td {
        padding: 1rem;
        color: rgba(55, 65, 81, 1);
        vertical-align: middle;

        &:not(:last-child) {
          border-right: 1px solid rgba(229, 231, 235, 1);
        }
      }
    }
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 500;
  color: rgba(55, 65, 81, 1);
  z-index: 20;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.text-light-grey {
  color: rgba(156, 163, 175, 1) !important;
}

*:focus {
  outline: 2px solid rgba(37, 99, 235, 1);
  outline-offset: 2px;
}

select:focus,
input:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 1);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
</style>
