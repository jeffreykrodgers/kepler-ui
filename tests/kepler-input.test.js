import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-input.js";

describe("KeplerInput", () => {
    it("renders an input element and displays the label when provided", async () => {
        const el = await fixture(
            html`<kp-input label="Test Label"></kp-input>`
        );
        const shadow = el.shadowRoot;
        const input = shadow.querySelector("input");
        expect(input).to.exist;

        const labelText = shadow.querySelector(".label-text");
        expect(labelText).to.exist;
        expect(labelText.textContent).to.equal("Test Label");

        // The label wrapper should be visible when a label is provided.
        const labelWrapper = shadow.querySelector(".label-wrapper");
        expect(labelWrapper.style.display).to.equal("flex");
    });

    it("hides the label wrapper when no label is provided", async () => {
        const el = await fixture(html`<kp-input></kp-input>`);
        const labelWrapper = el.shadowRoot.querySelector(".label-wrapper");
        // With no label, the label wrapper is set to "none".
        expect(labelWrapper.style.display).to.equal("none");
    });

    it("passes placeholder attribute to the inner input", async () => {
        const el = await fixture(
            html`<kp-input placeholder="Enter text"></kp-input>`
        );
        const input = el.shadowRoot.querySelector("input");
        expect(input.getAttribute("placeholder")).to.equal("Enter text");
    });

    it('updates value property on user input and dispatches an "input" event', async () => {
        const el = await fixture(html`<kp-input></kp-input>`);
        const input = el.shadowRoot.querySelector("input");
        // Simulate user typing.
        input.value = "Hello";
        setTimeout(() =>
            input.dispatchEvent(
                new Event("input", { bubbles: true, composed: true })
            )
        );

        const event = await oneEvent(el, "input");
        expect(event.detail.value).to.equal("Hello");
        // The component’s value getter should now return "Hello".
        expect(el.value).to.equal("Hello");
    });

    it('updates the "value" attribute and dispatches a "change" event on change', async () => {
        const el = await fixture(html`<kp-input></kp-input>`);
        const input = el.shadowRoot.querySelector("input");
        input.value = "World";
        setTimeout(() =>
            input.dispatchEvent(
                new Event("change", { bubbles: true, composed: true })
            )
        );

        const event = await oneEvent(el, "change");
        // The host's "value" attribute should update.
        expect(el.getAttribute("value")).to.equal("World");
    });

    it('adds "selected" class on label-wrapper on focus and removes it on blur', async () => {
        const el = await fixture(
            html`<kp-input label="Focus Test"></kp-input>`
        );
        const labelWrapper = el.shadowRoot.querySelector(".label-wrapper");
        const input = el.shadowRoot.querySelector("input");
        // Simulate focus.
        input.dispatchEvent(
            new Event("focus", { bubbles: true, composed: true })
        );
        expect(labelWrapper.classList.contains("selected")).to.be.true;
        // Simulate blur.
        input.dispatchEvent(
            new Event("blur", { bubbles: true, composed: true })
        );
        expect(labelWrapper.classList.contains("selected")).to.be.false;
    });
});
