import { fixture, html, expect } from "@open-wc/testing";
import sinon from "sinon";
import "../src/components/kepler-theme.js";

describe("KeplerTheme", () => {
    it("loads default theme when no theme-path is provided", async () => {
        const el = await fixture(html`<kp-theme></kp-theme>`);
        // The default theme should be rendered in the shadow DOM.
        // For example, check for a known default variable.
        expect(el.shadowRoot.innerHTML).to.contain(
            "--green-light-1: rgba(237, 250, 243, 1)"
        );
    });

    it("loads external theme when theme-path attribute is set", async () => {
        // Stub fetch so we can simulate fetching an external theme.
        const fakeCSS = "body { background: blue; }";
        const fetchStub = sinon
            .stub(window, "fetch")
            .resolves(new Response(fakeCSS, { status: 200 }));

        const el = await fixture(
            html`<kp-theme theme-path="fake-theme.css"></kp-theme>`
        );
        // Wait a tick for fetch to resolve.
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Verify that fetch was called with the expected URL.
        expect(fetchStub.called).to.be.true;
        // Check that the shadow DOM now includes the fetched CSS.
        expect(el.shadowRoot.innerHTML).to.contain(fakeCSS);

        fetchStub.restore();
    });

    it("updates theme-path when a theme-change event is dispatched", async () => {
        const el = await fixture(
            html`<kp-theme theme-path="old-theme.css"></kp-theme>`
        );
        el.dispatchEvent(
            new CustomEvent("theme-change", {
                detail: { themePath: "new-theme.css" },
                bubbles: true,
                composed: true,
            })
        );
        expect(el.getAttribute("theme-path")).to.equal("new-theme.css");
    });
});
