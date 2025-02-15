import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-button.js";

describe("KeplerButton", () => {
    it("renders a button with default attributes and slotted label", async () => {
        const el = await fixture(html`<kp-button>Click Me</kp-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton).to.exist;
        expect(shadowButton.getAttribute("role")).to.equal("button");

        // Check that the default slot renders the label.
        const labelSlot = el.shadowRoot.querySelector("slot:not([name])");
        const assigned = labelSlot.assignedNodes({ flatten: true });
        expect(assigned.some((node) => node.textContent.trim() === "Click Me"))
            .to.be.true;
    });

    it("reflects the disabled attribute to the inner button", async () => {
        const el = await fixture(html`<kp-button disabled>Test</kp-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.hasAttribute("disabled")).to.be.true;
        expect(shadowButton.getAttribute("aria-disabled")).to.equal("true");
    });

    it("updates styles when the color attribute changes", async () => {
        const el = await fixture(
            html`<kp-button color="primary">Test</kp-button>`
        );
        // Change color attribute to "success"
        el.setAttribute("color", "success");
        // Allow time for attributeChangedCallback to run.
        await new Promise((r) => setTimeout(r, 0));
        const shadowButton = el.shadowRoot.querySelector("button");
        // Check the inline custom property value instead.
        const bgVar = shadowButton.style.getPropertyValue("--background-color");
        expect(bgVar).to.contain("--success-background--");
    });

    it("dispatches a click event when clicked", async () => {
        const el = await fixture(html`<kp-button>Click Me</kp-button>`);
        setTimeout(() => el.button.click());
        const event = await oneEvent(el, "click");
        expect(event).to.exist;
    });
});
