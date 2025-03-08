import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/kepler-drawer.js";

describe("KeplerDrawer", () => {
    afterEach(() => {
        // Clean up any cover element that may have been added to document.body
        const cover = document.body.querySelector(".drawer-cover");
        if (cover) {
            cover.remove();
        }
    });

    it("renders the drawer content with a slot", async () => {
        const el = await fixture(html`<kp-drawer>Drawer Content</kp-drawer>`);
        const slot = el.shadowRoot.querySelector("slot");
        const assignedNodes = slot.assignedNodes({ flatten: true });
        const hasContent = assignedNodes.some(
            (node) =>
                node.textContent && node.textContent.trim() === "Drawer Content"
        );
        expect(hasContent).to.be.true;
    });

    it("toggles the open attribute when the grab bar is clicked", async () => {
        const el = await fixture(
            html`<kp-drawer grabber>Drawer Content</kp-drawer>`
        );
        // Initially, the drawer should be closed (open === false)
        expect(el.open).to.be.false;

        // Get the grab bar and click it to open the drawer
        let grabBar = el.shadowRoot.querySelector(".grab-bar");
        grabBar.click();
        // Wait a short time for the attribute change and re-render
        await new Promise((r) => setTimeout(r, 50));
        expect(el.open).to.be.true;

        // After re-render, re-query the grab bar element before clicking again
        grabBar = el.shadowRoot.querySelector(".grab-bar");
        grabBar.click();
        await new Promise((r) => setTimeout(r, 50));
        expect(el.open).to.be.false;
    });

    it("creates and removes a cover element when cover attribute is present", async () => {
        const el = await fixture(
            html`<kp-drawer grabber cover>Drawer Content</kp-drawer>`
        );
        // Initially no cover should be in the document
        expect(document.body.querySelector(".drawer-cover")).to.be.null;

        // Open the drawer by clicking the grab bar
        let grabBar = el.shadowRoot.querySelector(".grab-bar");
        grabBar.click();
        await new Promise((r) => setTimeout(r, 50));
        expect(el.open).to.be.true;

        // A cover element should now be appended to document.body
        let cover = document.body.querySelector(".drawer-cover");
        expect(cover).to.exist;
        expect(getComputedStyle(cover).position).to.equal("fixed");

        // Clicking the cover should close the drawer and remove the cover element
        cover.click();
        await new Promise((r) => setTimeout(r, 50));
        expect(el.open).to.be.false;
        expect(document.body.querySelector(".drawer-cover")).to.be.null;
    });

    it("does not create a cover element when cover attribute is not present", async () => {
        const el = await fixture(
            html`<kp-drawer grabber>Drawer Content</kp-drawer>`
        );
        // Open the drawer by clicking the grab bar
        let grabBar = el.shadowRoot.querySelector(".grab-bar");
        grabBar.click();
        await new Promise((r) => setTimeout(r, 50));
        expect(el.open).to.be.true;
        // No cover element should be added
        expect(document.body.querySelector(".drawer-cover")).to.be.null;
    });

    it("applies correct position styles based on the position attribute", async () => {
        const elLeft = await fixture(
            html`<kp-drawer position="left">Content</kp-drawer>`
        );
        const elRight = await fixture(
            html`<kp-drawer position="right">Content</kp-drawer>`
        );
        const elTop = await fixture(
            html`<kp-drawer position="top">Content</kp-drawer>`
        );
        const elBottom = await fixture(
            html`<kp-drawer position="bottom">Content</kp-drawer>`
        );

        // We can test a few computed styles. For instance, the left-positioned drawer should have "left: 0"
        const csLeft = getComputedStyle(elLeft);
        expect(csLeft.left).to.equal("0px");

        const csRight = getComputedStyle(elRight);
        expect(csRight.right).to.equal("0px");

        const csTop = getComputedStyle(elTop);
        expect(csTop.top).to.equal("0px");

        const csBottom = getComputedStyle(elBottom);
        expect(csBottom.bottom).to.equal("0px");
    });
});
