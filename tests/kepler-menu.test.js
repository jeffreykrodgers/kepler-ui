import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
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
        // Manually show the menu.
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

    // TODO Fix this test
    // it("supports multi-select mode without auto-hiding", async () => {
    //     const el = await fixture(html`
    //         <kp-menu multiple items="${JSON.stringify(sampleItems)}"></kp-menu>
    //     `);
    //     el.style.display = "block";
    //     const container = el.shadowRoot.querySelector("#menuContainer");
    //     const items = container.querySelectorAll(".menu-item");

    //     // Click the first item.
    //     items[0].click();
    //     // In multi-select, the menu should remain open.
    //     expect(el.style.display).to.equal("block");
    //     expect(el.getAttribute("value")).to.equal(sampleItems[0].value);

    //     // Click the second item.
    //     items[1].click();
    //     // The value attribute should now have both values, comma-separated.
    //     expect(el.getAttribute("value")).to.equal(
    //         `${sampleItems[0].value},${sampleItems[1].value}`
    //     );
    // });

    it("hides the menu when clicking outside the component", async () => {
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify(sampleItems)}"></kp-menu>
        `);
        el.style.display = "block";
        // Simulate a click outside the element.
        document.body.click();
        await new Promise((r) => setTimeout(r, 0));
        expect(el.style.display).to.equal("none");
    });

    it("renders custom template for items", async () => {
        const templateItem = [
            { label: "Template Item", value: "tmpl", template: "customTpl" },
        ];
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify(templateItem)}">
                <template slot="customTpl">
                    <span data-label></span> - <span data-value></span>
                </template>
            </kp-menu>
        `);
        const renderedItem = el.shadowRoot.querySelector(".menu-item");
        expect(renderedItem.textContent).to.include("Template Item");
        expect(renderedItem.textContent).to.include("tmpl");
    });

    it("uses history navigation when history property is true", async () => {
        const historyItem = {
            label: "History Item",
            value: "hist",
            href: "/history",
            history: true,
        };
        const el = await fixture(html`
            <kp-menu items="${JSON.stringify([historyItem])}"></kp-menu>
        `);
        el.style.display = "block";
        const item = el.shadowRoot.querySelector(".menu-item");

        // Spy on history.pushState.
        const pushStateSpy = sinon.spy(history, "pushState");
        item.click();
        expect(pushStateSpy.calledOnce).to.be.true;
        // In history navigation, the menu should auto-hide.
        expect(el.style.display).to.equal("none");
        pushStateSpy.restore();
    });
});
