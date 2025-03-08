import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/kepler-sidebar.js";

describe("KeplerSidebar", () => {
    it("renders the sidebar with provided items in collapsed state", async () => {
        const items = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
            },
            {
                label: "Settings",
                value: "settings",
                iconTemplate: "settings-icon",
            },
        ];
        const el = await fixture(
            html`<kp-sidebar items="${JSON.stringify(items)}"></kp-sidebar>`
        );
        // There should be two rendered kp-button elements for items.
        const buttons = el.shadowRoot.querySelectorAll(".sidebar-item");
        expect(buttons.length).to.equal(2);

        // Verify the first item's label is "Dashboard".
        const firstLabel = buttons[0].querySelector("span").textContent.trim();
        expect(firstLabel).to.equal("Dashboard");
    });

    it('applies "filled" style-type to items with a selected property', async () => {
        const items = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
                selected: true,
            },
            {
                label: "Settings",
                value: "settings",
                iconTemplate: "settings-icon",
            },
        ];
        const el = await fixture(
            html`<kp-sidebar items="${JSON.stringify(items)}"></kp-sidebar>`
        );
        const buttons = el.shadowRoot.querySelectorAll(".sidebar-item");
        expect(buttons[0].getAttribute("style-type")).to.equal("filled");
        expect(buttons[1].getAttribute("style-type")).to.equal("flat");
        // Also check that the border override is applied on the selected item.
        expect(buttons[0].getAttribute("style")).to.contain(
            "--border-medium: 0"
        );
    });

    it("toggles the expanded attribute when the toggle button is clicked", async () => {
        const items = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
            },
        ];
        const el = await fixture(
            html`<kp-sidebar items="${JSON.stringify(items)}"></kp-sidebar>`
        );
        const toggleButton = el.shadowRoot.querySelector(".toggle-button");

        // Initially, the sidebar should be collapsed.
        expect(el.hasAttribute("expanded")).to.be.false;

        // Click the toggle button to expand.
        toggleButton.click();
        // Wait for the transition to complete (e.g., 350ms)
        await new Promise((r) => setTimeout(r, 350));
        expect(el.hasAttribute("expanded")).to.be.true;

        // Click again to collapse.
        toggleButton.click();
        await new Promise((r) => setTimeout(r, 350));
        expect(el.hasAttribute("expanded")).to.be.false;
    });

    it("re-renders when the items attribute is updated", async () => {
        const items = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
            },
        ];
        const el = await fixture(
            html`<kp-sidebar items="${JSON.stringify(items)}"></kp-sidebar>`
        );
        // Initially, only one item is rendered.
        let buttons = el.shadowRoot.querySelectorAll(".sidebar-item");
        expect(buttons.length).to.equal(1);

        // Update the items attribute.
        const newItems = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
            },
            {
                label: "Settings",
                value: "settings",
                iconTemplate: "settings-icon",
            },
        ];
        el.setAttribute("items", JSON.stringify(newItems));
        // Allow time for attributeChangedCallback to run.
        await new Promise((r) => setTimeout(r, 0));

        buttons = el.shadowRoot.querySelectorAll(".sidebar-item");
        expect(buttons.length).to.equal(2);
    });

    it("applies external custom properties for collapsed and expanded widths", async () => {
        const items = [
            {
                label: "Dashboard",
                value: "dashboard",
                iconTemplate: "dashboard-icon",
            },
        ];
        const el = await fixture(html`
            <kp-sidebar
                style="--sidebar-collapsed-width: 60px; --sidebar-expanded-width: 250px;"
                items="${JSON.stringify(items)}"
            ></kp-sidebar>
        `);
        // Verify collapsed width.
        const collapsedWidth = getComputedStyle(el).width;
        expect(collapsedWidth).to.equal("60px");

        // Set expanded attribute.
        el.setAttribute("expanded", "");
        // Wait for transition duration (e.g., 350ms)
        await new Promise((r) => setTimeout(r, 350));
        const expandedWidth = getComputedStyle(el).width;
        expect(expandedWidth).to.equal("250px");
    });
});
