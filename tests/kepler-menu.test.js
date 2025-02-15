import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-menu.js";

describe("KeplerMenu", () => {
    const sampleItems = [
        { label: "Item 1", value: "1" },
        { label: "Item 2", value: "2" },
        { label: "Item 3", value: "3" },
    ];

    it("renders menu items based on the items attribute", async () => {
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify(sampleItems)}"></kp-menu>
        `);
        const container = el.shadowRoot.querySelector("#menuContainer");
        const items = container.querySelectorAll(".menu-item");
        expect(items.length).to.equal(sampleItems.length);
        sampleItems.forEach((item, index) => {
            const labelEl = items[index].querySelector("label");
            expect(labelEl.textContent.trim()).to.equal(item.label);
        });
    });

    it("selects a menu item and dispatches a select event on click (single selection)", async () => {
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify(sampleItems)}"></kp-menu>
        `);
        // Manually show the menu (simulate that it was opened)
        el.style.display = "block";
        const container = el.shadowRoot.querySelector("#menuContainer");
        const items = container.querySelectorAll(".menu-item");

        // Click the second item.
        setTimeout(() => items[1].click());
        const event = await oneEvent(el, "select");
        expect(event.detail.value).to.equal(sampleItems[1].value);
        // The value attribute should now be updated.
        expect(el.getAttribute("value")).to.equal(sampleItems[1].value);
        // In single-selection mode, the menu should auto-hide.
        expect(el.style.display).to.equal("none");
    });

    // TODO: This test is not working
    // it("allows multiple selection when multiple attribute is set", async () => {
    //     const el = await fixture(html`
    //         <kp-menu
    //             items="${JSON.stringify(sampleItems)}"
    //             multiple
    //             track-selection
    //         ></kp-menu>
    //     `);

    //     el.style.display = "block";
    //     const container = el.shadowRoot.querySelector("#menuContainer");
    //     const items = container.querySelectorAll(".menu-item");

    //     // Debug: Listen for events
    //     el.addEventListener("select", (e) => {
    //         console.log("DEBUG: Event detected", e.detail);
    //     });

    //     // Click on the first item.
    //     items[0].click();
    //     await new Promise((resolve) => setTimeout(resolve, 50));

    //     // Click on the third item.
    //     items[2].click();
    //     await new Promise((resolve) => setTimeout(resolve, 50));

    //     // Debugging output before assertion
    //     console.log("DEBUG: Final value:", el.getAttribute("value"));

    //     // The value attribute should now be "1,3".
    //     expect(el.getAttribute("value")).to.equal("1,3");
    // });

    it("hides the menu when clicking outside the component", async () => {
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify(sampleItems)}"></kp-menu>
        `);
        // Show the menu.
        el.style.display = "block";
        // Simulate a click outside the element.
        document.body.click();
        // Wait for the click event to propagate.
        await new Promise((r) => setTimeout(r, 0));
        expect(el.style.display).to.equal("none");
    });
});
