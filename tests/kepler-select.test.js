import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-select.js";

const sampleOptions = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry" },
];

// Utility to wait for a specified delay (in ms)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("KeplerSelect", () => {
    it("renders with a placeholder when no value is provided", async () => {
        const el = await fixture(html`
            <kp-select
                placeholder="Select an option"
                options="${JSON.stringify(sampleOptions)}"
            ></kp-select>
        `);
        // Wait for rendering to complete.
        await delay(100);
        const selectedValueEl = el.shadowRoot.querySelector(".selected-value");
        expect(selectedValueEl).to.exist;
        expect(selectedValueEl.textContent.trim()).to.equal("Select an option");
    });

    it("updates value on single selection", async () => {
        const el = await fixture(html`
            <kp-select
                placeholder="Select an option"
                options="${JSON.stringify(sampleOptions)}"
            ></kp-select>
        `);
        await delay(100);
        // Open the dropdown.
        const selectWrapper = el.shadowRoot.querySelector(".select-wrapper");
        expect(selectWrapper).to.exist;
        selectWrapper.click();
        await delay(100);
        const dropdown = el.shadowRoot.querySelector(".dropdown");
        expect(dropdown).to.exist;
        expect(dropdown.classList.contains("open")).to.be.true;

        // Click on the item with data-value="banana".
        const item = dropdown.querySelector(
            '.dropdown-item[data-value="banana"]'
        );
        expect(item).to.exist;
        item.click();
        await delay(100);
        // In single-selection mode, dropdown should auto-close.
        expect(dropdown.classList.contains("open")).to.be.false;
        const hiddenInput = el.querySelector('input[type="hidden"]');
        expect(hiddenInput).to.exist;
        expect(hiddenInput.value).to.equal("banana");
        const selectedValueEl = el.shadowRoot.querySelector(".selected-value");
        expect(selectedValueEl).to.exist;
        expect(selectedValueEl.textContent.trim()).to.equal("Banana");
    });

    it("allows multiple selection in combined mode", async () => {
        const el = await fixture(html`
            <kp-select
                options="${JSON.stringify(sampleOptions)}"
                multiple
                selection-mode="combined"
                placeholder="Select an option"
            >
            </kp-select>
        `);
        await delay(100);
        // Open the dropdown.
        const selectWrapper = el.shadowRoot.querySelector(".select-wrapper");
        expect(selectWrapper).to.exist;
        selectWrapper.click();
        await delay(100);
        const dropdown = el.shadowRoot.querySelector(".dropdown");
        expect(dropdown).to.exist;
        expect(dropdown.classList.contains("open")).to.be.true;

        // Click on the first ("Apple") and third ("Cherry") items.
        const item1 = dropdown.querySelector(
            '.dropdown-item[data-value="apple"]'
        );
        expect(item1).to.exist;
        item1.click();
        await delay(100);
        const item3 = dropdown.querySelector(
            '.dropdown-item[data-value="cherry"]'
        );
        expect(item3).to.exist;
        item3.click();
        await delay(100);
        const selectedValueEl = el.shadowRoot.querySelector(".selected-value");
        expect(selectedValueEl).to.exist;
        expect(selectedValueEl.textContent.trim()).to.equal("2 Items Selected");
        const hiddenInput = el.querySelector('input[type="hidden"]');
        expect(hiddenInput).to.exist;
        expect(hiddenInput.value).to.equal("apple,cherry");
    });

    it('toggles "selected" class on label-wrapper on focus and blur', async () => {
        const el = await fixture(html`
            <kp-select
                label="Fruit"
                options="${JSON.stringify(sampleOptions)}"
            ></kp-select>
        `);
        await delay(100);
        const labelWrapper = el.shadowRoot.querySelector(".label-wrapper");
        const selectWrapper = el.shadowRoot.querySelector(".select-wrapper");
        expect(labelWrapper).to.exist;
        expect(selectWrapper).to.exist;
        // Simulate focus.
        selectWrapper.dispatchEvent(
            new Event("focus", { bubbles: true, composed: true })
        );
        await delay(50);
        expect(labelWrapper.classList.contains("selected")).to.be.true;
        // Simulate blur.
        selectWrapper.dispatchEvent(
            new Event("blur", { bubbles: true, composed: true })
        );
        await delay(50);
        expect(labelWrapper.classList.contains("selected")).to.be.false;
    });
});
