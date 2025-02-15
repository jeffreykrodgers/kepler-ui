import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/kepler-dialog.js";

describe("KeplerDialog", () => {
    it("renders a dialog with title and content", async () => {
        const el = await fixture(html`
            <kp-dialog title="Test Dialog" closable>
                <p>Dialog Content</p>
            </kp-dialog>
        `);
        const header = el.shadowRoot.querySelector(".header");

        expect(header.textContent).to.contain("Test Dialog");

        const slot = el.shadowRoot.querySelector("slot");
        const assigned = slot.assignedNodes({ flatten: true });
        const assignedText = assigned.map((n) => n.textContent).join(" ");

        expect(assignedText).to.contain("Dialog Content");
    });

    it('applies visible class when visible attribute is "true"', async () => {
        const el = await fixture(html`
            <kp-dialog visible="true" title="Visible Dialog">
                <p>Content</p>
            </kp-dialog>
        `);
        // The updateVisibility method should add the "visible" class.
        expect(el.classList.contains("visible")).to.be.true;
    });

    it("dispatches a close event and sets visible to false when close button is clicked", async () => {
        const el = await fixture(html`
            <kp-dialog visible="true" title="Closable Dialog" closable>
                <p>Content</p>
            </kp-dialog>
        `);
        const closeBtn = el.shadowRoot.querySelector(".close-btn");
        // Simulate a click on the close button.
        setTimeout(() => closeBtn.click());

        const event = await oneEvent(el, "close");
        expect(event).to.exist;
        // After close, the getter for visible should return false.
        expect(el.visible).to.be.false;
    });

    it("closes when Escape key is pressed", async () => {
        const el = await fixture(html`
            <kp-dialog visible="true" title="Closable Dialog" closable>
                <p>Content</p>
            </kp-dialog>
        `);
        // Simulate an Escape key press on the document.
        setTimeout(() => {
            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);
        });

        const event = await oneEvent(el, "close");
        expect(event).to.exist;
        expect(el.visible).to.be.false;
    });

    it("renders a cover when the cover attribute is present", async () => {
        const el = await fixture(html`
            <kp-dialog visible="true" cover>
                <p>Content</p>
            </kp-dialog>
        `);
        const cover = el.shadowRoot.querySelector(".cover");
        expect(cover).to.exist;
    });
});
