import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/kepler-progress.js";

// Global error handler to ignore ResizeObserver loop warnings.
window.addEventListener("error", (e) => {
    if (e.message.includes("ResizeObserver loop completed")) {
        e.stopImmediatePropagation();
    }
});

describe("kp-progress", () => {
    it('renders in determinate mode when "value" is set', async () => {
        // Wrap in a container with fixed width (600px)
        const wrapper = await fixture(html`
            <div style="width:600px; border:1px solid black;">
                <kp-progress
                    value="50"
                    max="100"
                    size="medium"
                    style="width:100%;"
                ></kp-progress>
            </div>
        `);
        const progressEl = wrapper.querySelector("kp-progress");
        // Wait 100ms for ResizeObserver and updates to take effect.
        await new Promise((resolve) => setTimeout(resolve, 100));

        const segments = Array.from(
            progressEl.shadowRoot.querySelectorAll(".progress-segment")
        );
        // Expect more than one segment to have been created.
        expect(segments.length).to.be.greaterThan(1);

        const filledSegments = segments.filter((s) =>
            s.classList.contains("filled")
        );
        const fillRatio = filledSegments.length / segments.length;
        expect(fillRatio).to.be.closeTo(0.5, 0.2);
    });

    it('renders in indeterminate mode when no "value" attribute is set', async () => {
        const wrapper = await fixture(html`
            <div style="width:600px; border:1px solid black;">
                <kp-progress size="medium" style="width:100%;"></kp-progress>
            </div>
        `);
        const progressEl = wrapper.querySelector("kp-progress");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const container = progressEl.shadowRoot.querySelector(
            ".progress-container"
        );
        expect(container.classList.contains("indeterminate")).to.be.true;
    });

    it("does not expand infinitely when container width is constrained", async () => {
        const wrapper = await fixture(html`
            <div style="width:600px;">
                <kp-progress
                    value="25"
                    max="100"
                    size="medium"
                    style="width:100%;"
                ></kp-progress>
            </div>
        `);
        const progressEl = wrapper.querySelector("kp-progress");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const container = progressEl.shadowRoot.querySelector(
            ".progress-container"
        );
        const parentWidth = wrapper.getBoundingClientRect().width;
        const containerWidth = container.getBoundingClientRect().width;
        expect(containerWidth).to.be.at.most(parentWidth);
    });
});
