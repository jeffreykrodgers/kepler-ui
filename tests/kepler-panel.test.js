import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "../src/components/kepler-panel.js";

describe("KeplerPanel", () => {
    it("renders header with icon and label slots", async () => {
        const el = await fixture(html`
            <kp-panel>
                <span slot="icon">🔔</span>
                <span slot="label">Notifications</span>
            </kp-panel>
        `);

        // Instead of reading the textContent of the header container,
        // we inspect the assigned nodes for each slot.
        const iconSlot = el.shadowRoot.querySelector('slot[name="icon"]');
        const labelSlot = el.shadowRoot.querySelector('slot[name="label"]');

        const iconNodes = iconSlot.assignedNodes({ flatten: true });
        const labelNodes = labelSlot.assignedNodes({ flatten: true });

        const iconText = iconNodes
            .map((node) => node.textContent)
            .join("")
            .trim();
        const labelText = labelNodes
            .map((node) => node.textContent)
            .join("")
            .trim();

        expect(iconText).to.equal("🔔");
        expect(labelText).to.equal("Notifications");
    });

    it("hides the arrow when no children are provided", async () => {
        const el = await fixture(html`
            <kp-panel>
                <span slot="icon">🔔</span>
                <span slot="label">Notifications</span>
            </kp-panel>
        `);
        const arrow = el.shadowRoot.querySelector("#arrow");
        // check that the arrow's visibility style is set to hidden
        expect(arrow.style.visibility).to.equal("hidden");
    });

    it("toggles expansion when header is clicked and children are present", async () => {
        const el = await fixture(html`
            <kp-panel>
                <span slot="icon">⚙️</span>
                <span slot="label">Settings</span>
                <div slot="children">
                    <p>Child content</p>
                </div>
            </kp-panel>
        `);
        const childrenContainer =
            el.shadowRoot.querySelector("#childrenContainer");
        // Initially not expanded.
        expect(childrenContainer.classList.contains("expanded")).to.be.false;

        // Click the header to expand.
        const header = el.shadowRoot.querySelector(".header");
        header.click();
        await new Promise((r) => setTimeout(r, 10));
        expect(childrenContainer.classList.contains("expanded")).to.be.true;

        // Click header again to collapse.
        header.click();
        await new Promise((r) => setTimeout(r, 10));
        expect(childrenContainer.classList.contains("expanded")).to.be.false;
    });

    it("uses history navigation when panel is a link with history enabled", async () => {
        const el = await fixture(html`
            <kp-panel href="/test-route" history>
                <span slot="icon">🏠</span>
                <span slot="label">Test Route</span>
            </kp-panel>
        `);
        // Spy on history.pushState.
        const pushStateSpy = sinon.spy(history, "pushState");

        // Simulate header click.
        const header = el.shadowRoot.querySelector(".header");
        header.click();

        expect(pushStateSpy.calledOnce).to.be.true;
        pushStateSpy.restore();
    });

    it("dispatches a select event when header is clicked without children and without href", async () => {
        const el = await fixture(html`
            <kp-panel>
                <span slot="icon">⭐</span>
                <span slot="label">Favorite</span>
            </kp-panel>
        `);
        // Click the header; since there's no href and no children, it should dispatch "select".
        setTimeout(() => el.shadowRoot.querySelector(".header").click());
        const event = await oneEvent(el, "select");
        expect(event).to.exist;
        expect(event.detail.selected).to.be.true;
    });

    it("marks the panel as selected when the URL matches its href", async () => {
        // Set the current URL (simulate a SPA route change).
        history.pushState({}, "", "/match-route");
        const el = await fixture(html`
            <kp-panel href="/match-route" history>
                <span slot="icon">🏠</span>
                <span slot="label">Matched Route</span>
            </kp-panel>
        `);
        // Allow any connectedCallback or popstate event to update selection.
        await new Promise((r) => setTimeout(r, 10));
        // The panel should now be selected.
        expect(el.selected).to.be.true;
        expect(el.classList.contains("selected")).to.be.true;
    });
});
