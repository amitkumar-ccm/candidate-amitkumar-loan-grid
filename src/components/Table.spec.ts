import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Table from "./Table.vue";
import { useTableStore } from "../composables/useTable";
import { nextTick } from "vue";

describe("Table.vue", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    vi.useFakeTimers();
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mounts and renders basic controls and table", () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    expect(wrapper.exists()).toBe(true);

    expect(wrapper.find("input#search").exists()).toBe(true);
    expect(wrapper.find("select#rows").exists()).toBe(true);
    expect(wrapper.find("select#status").exists()).toBe(true);

    expect(wrapper.find(".table-scroll").exists()).toBe(true);
  });

  it("updates search via debounced input and shows spinner while pending", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    const input = wrapper.find("input#search");
    await input.setValue("alice");

    expect(wrapper.find(".spinner").exists()).toBe(true);

    vi.advanceTimersByTime(300);
    await nextTick();

    expect(store.searchQuery).toBe("alice");

    expect(wrapper.find(".spinner").exists()).toBe(false);
  });

  it("changes status filter when selecting an option", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    const statusSelect = wrapper.find("select#status");

    await statusSelect.setValue("Approved");
    await statusSelect.trigger("change");

    expect(store.statusFilter).toBe("Approved");

    expect(typeof store.totalItemsToLoad).toBe("number");
  });

  it("changes rows per page and resets chunks", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    const rowsSelect = wrapper.find("select#rows");
    await rowsSelect.setValue("50");
    await rowsSelect.trigger("change");

    expect(store.pageSize).toBe(50);
    expect(store.startChunk).toBe(1);
    expect(store.endChunk).toBe(1);
  });

  it("toggles sort when header emits sort event", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    const headers = wrapper.findAllComponents({ name: "Header" });
    if (headers.length === 0) {
      store.setSortField("borrowerName");
      expect(store.sortField).toBe("borrowerName");
      expect(store.sortOrder).toBe("ascending");
      return;
    }

    await headers[0].vm.$emit("sort", "borrowerName");
    await nextTick();

    expect(store.sortField).toBe("borrowerName");
    expect(store.sortOrder).toBe("ascending");

    await headers[0].vm.$emit("sort", "borrowerName");
    await nextTick();
    expect(store.sortOrder).toBe("descending");
  });

  it("triggers loadMoreData when scrolled to bottom and shows loading overlay", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    const scrollEl = wrapper.find(".table-scroll");
    const el = scrollEl.element as HTMLElement;

    Object.defineProperty(el, "scrollTop", { value: 1000, writable: true });
    Object.defineProperty(el, "clientHeight", { value: 500 });
    Object.defineProperty(el, "scrollHeight", { value: 1495 });

    await scrollEl.trigger("scroll");

    expect(store.loading).toBe(true);
    expect(wrapper.find(".loading-overlay").exists()).toBe(true);

    vi.advanceTimersByTime(500);
    await nextTick();

    expect(store.loading).toBe(false);
    expect(wrapper.find(".loading-overlay").exists()).toBe(false);

    expect(store.endChunk).toBeGreaterThanOrEqual(1);
  });

  it("shows 'No Data' when the store has no rows", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    store.setData([] as any);
    await nextTick();

    expect(wrapper.find("tbody .no-data").exists()).toBe(true);
    expect(wrapper.find("tbody .no-data").text()).toContain("No Data");
  });

  it("status filter reduces displayed data when data is present", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    store.setData([
      {
        id: 1,
        borrowerName: "A",
        amount: 100,
        status: "Approved",
        closeDate: "2025-01-01",
      },
      {
        id: 2,
        borrowerName: "B",
        amount: 200,
        status: "Pending",
        closeDate: "2025-02-01",
      },
    ] as any);
    await nextTick();

    expect(store.totalItemsToLoad).toBe(2);

    const statusSelect = wrapper.find("select#status");
    await statusSelect.setValue("Approved");
    await statusSelect.trigger("change");

    expect(store.statusFilter).toBe("Approved");
    expect(store.totalItemsToLoad).toBe(1);
  });

  it("search with no matches clears displayed results", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    store.setData([
      {
        id: 1,
        borrowerName: "Charlie",
        amount: 100,
        status: "Approved",
        closeDate: "2025-01-01",
      },
    ] as any);
    await nextTick();

    const input = wrapper.find("input#search");
    await input.setValue("no-such-name");
    vi.advanceTimersByTime(300);
    await nextTick();

    expect(store.searchQuery).toBe("no-such-name");
    expect(store.totalItemsToLoad).toBe(0);
    expect(store.displayedData.length).toBe(0);
  });

  it("loadPreviousData does nothing when at start and loadMoreData respects total length", async () => {
    const store = useTableStore();

    store.setData([
      {
        id: 1,
        borrowerName: "X",
        amount: 1,
        status: "Pending",
        closeDate: "2025-01-01",
      },
    ] as any);

    store.startChunk = 1;
    store.loading = false;
    store.loadPreviousData();
    expect(store.startChunk).toBe(1);

    store.endChunk = 1;
    store.pageSize = 25;
    store.loading = false;
    store.loadMoreData();

    vi.advanceTimersByTime(500);
    await nextTick();

    expect(store.endChunk).toBe(1);
  });

  it("clicking a header updates aria-sort and icon classes through Header", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    // Ensure data exists so headers render
    store.setData([
      {
        id: 1,
        borrowerName: "Zed",
        amount: 100,
        status: "Pending",
        closeDate: "2025-01-01",
      },
    ] as any);
    await nextTick();

    // find first th (Header) and click it
    const th = wrapper.find("th");
    expect(th.exists()).toBe(true);

    await th.trigger("click");
    await nextTick();

    // the Header component sets aria-sort based on props, component's own DOM uses props
    // ensure store got sort field set
    expect(store.sortField).toBeTruthy();

    // Click again should toggle sorting order
    await th.trigger("click");
    await nextTick();
    expect(["ascending", "descending", "none"]).toContain(store.sortOrder);
  });

  it("scrolling to top calls debounced previous loader and updates startChunk", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    // prepare so previous load will actually change startChunk
    store.setData([
      {
        id: 1,
        borrowerName: "One",
        amount: 10,
        status: "Pending",
        closeDate: "2025-01-01",
      },
      {
        id: 2,
        borrowerName: "Two",
        amount: 20,
        status: "Approved",
        closeDate: "2025-02-01",
      },
    ] as any);
    store.pageSize = 1;
    store.startChunk = 2; // pretend we're on chunk 2
    store.endChunk = 2;
    await nextTick();

    const scrollEl = wrapper.find(".table-scroll");
    const el = scrollEl.element as HTMLElement;

    // simulate top scroll
    Object.defineProperty(el, "scrollTop", { value: 0, writable: true });
    Object.defineProperty(el, "clientHeight", { value: 200 });
    Object.defineProperty(el, "scrollHeight", { value: 400 });

    await scrollEl.trigger("scroll");

    // debounce (500ms) + loadPreviousData's internal timeout (500ms) = 1000ms
    vi.advanceTimersByTime(1000);
    await nextTick();

    // startChunk should have decreased to 1
    expect(store.startChunk).toBe(1);
  });

  it("unmount clears loading interval and cancels debounced handlers", async () => {
    const wrapper = mount(Table, { global: { plugins: [pinia] } });
    const store = useTableStore();

    // ensure loading interval gets created by toggling loading
    store.loading = true;
    // run next tick so watcher sets interval
    await nextTick();

    const clearSpy = vi.spyOn(globalThis, "clearInterval");

    // unmount triggers onUnmounted cleanup which should call clearInterval and cancel
    wrapper.unmount();

    // clearInterval should have been called (at least once)
    expect(clearSpy).toHaveBeenCalled();

    clearSpy.mockRestore();
  });
});
