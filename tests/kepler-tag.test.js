import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-tag.js"; // Update path to your component

describe("kp-tag component", () => {
    it("should be defined", async () => {
        const el = await fixture(html`<kp-tag></kp-tag>`);
        expect(el).to.exist;
    });

    it("should render default size (medium) when no size is provided", async () => {
        const el = await fixture(html`<kp-tag>Test</kp-tag>`);
        const computedStyle = getComputedStyle(el);
        expect(computedStyle.fontSize).to.equal("16px"); // Medium size (default)
    });

    it("should apply small size styles when size='small'", async () => {
        const el = await fixture(html`<kp-tag size="small">Small Tag</kp-tag>`);
        const computedStyle = getComputedStyle(el);
        expect(computedStyle.fontSize).to.equal("14px"); // Small size
    });

    it("should apply large size styles when size='large'", async () => {
        const el = await fixture(html`<kp-tag size="large">Large Tag</kp-tag>`);
        const computedStyle = getComputedStyle(el);
        expect(computedStyle.fontSize).to.equal("20px"); // Large size
    });

    it("should apply color when using a theme-based variant", async () => {
        const el = await fixture(
            html`<kp-tag color="primary">Primary</kp-tag>`
        );
        expect(el.classList.contains("primary")).to.be.true;
    });

    it("should apply custom hex color", async () => {
        const el = await fixture(
            html`<kp-tag color="#ff0000">Red Tag</kp-tag>`
        );
        expect(el.style.backgroundColor).to.equal("rgb(255, 0, 0)");
    });

    it("should adjust text color based on background brightness", async () => {
        const darkTag = await fixture(
            html`<kp-tag color="#000000">Dark Tag</kp-tag>`
        );
        expect(
            darkTag.shadowRoot.querySelector(".content").style.color
        ).to.equal("rgb(255, 255, 255)");

        const lightTag = await fixture(
            html`<kp-tag color="#ffffff">Light Tag</kp-tag>`
        );
        expect(
            lightTag.shadowRoot.querySelector(".content").style.color
        ).to.equal("rgb(33, 37, 41)"); // Assuming default fallback
    });

    it("should render a close button when closable is set", async () => {
        const el = await fixture(html`<kp-tag closable>Closable</kp-tag>`);
        const closeButton = el.shadowRoot.querySelector(".close");
        expect(closeButton).to.exist;
        expect(closeButton.classList.contains("hidden")).to.be.false;
    });

    it("should hide close button when closable is not set", async () => {
        const el = await fixture(html`<kp-tag>Non-Closable</kp-tag>`);
        const closeButton = el.shadowRoot.querySelector(".close");
        expect(closeButton.classList.contains("hidden")).to.be.true;
    });

    it("should dispatch a 'remove' event when close button is clicked", async () => {
        const el = await fixture(html`<kp-tag closable>Closable</kp-tag>`);
        const closeButton = el.shadowRoot.querySelector(".close");

        setTimeout(() => closeButton.click());
        const event = await oneEvent(el, "remove");

        expect(event).to.exist;
        expect(event.detail.tag).to.equal(el);
    });
});
