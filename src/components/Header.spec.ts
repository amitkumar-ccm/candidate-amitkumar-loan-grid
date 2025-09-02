import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Header from "./Header.vue";

describe("Header.vue", () => {
  it("renders title capitalized and has correct default icon class for none", () => {
    const wrapper = mount(Header, {
      props: {
        headerTitle: "borrower name",
        fieldName: "borrowerName",
        sortOrder: "none",
      },
    });

    expect(wrapper.text()).toContain("Borrower name");
    const icon = wrapper.find("i.header-icon");
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain("fa-sort");
    expect(icon.classes()).toContain("text-light-grey");
  });

  it("emits sort event when clicked", async () => {
    const wrapper = mount(Header, {
      props: { headerTitle: "Amount", fieldName: "amount", sortOrder: "none" },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted()).toHaveProperty("sort");
    expect(wrapper.emitted()!.sort[0]).toEqual(["amount"]);
  });
});
