import { html, fixture, expect } from "@open-wc/testing";
import "../src/components/kepler-badge.js";

describe("KeplerBadge", () => {
    it("should be defined", async () => {
        const el = await fixture(html`<kp-badge></kp-badge>`);
        expect(el).to.exist;
    });

    it("should render with default attributes", async () => {
        const el = await fixture(html`<kp-badge></kp-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal("");
        expect(getComputedStyle(badge).backgroundColor).to.equal(
            "rgb(0, 123, 255)"
        ); // Primary color
    });

    it("should render with a specified value", async () => {
        const el = await fixture(html`<kp-badge value="5"></kp-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(badge.textContent.trim()).to.equal("5");
    });

    it("should apply correct color class", async () => {
        const el = await fixture(html`<kp-badge color="error"></kp-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).backgroundColor).to.equal(
            "rgb(220, 53, 69)"
        );
    });

    it("should position badge correctly for top-right", async () => {
        const el = await fixture(
            html`<kp-badge position="top" alignment="right"></kp-badge>`
        );
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).top).to.equal("-10px");
        expect(getComputedStyle(badge).right).to.equal("-10px");
    });

    it("should position badge correctly for bottom-left", async () => {
        const el = await fixture(
            html`<kp-badge position="bottom" alignment="left"></kp-badge>`
        );
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).bottom).to.equal("-10px");
        expect(getComputedStyle(badge).left).to.equal("-10px");
    });

    it("should adjust size correctly", async () => {
        const el = await fixture(html`<kp-badge size="large"></kp-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).fontSize).to.equal("20px");
        expect(getComputedStyle(badge).minWidth).to.equal("22px");
    });

    it("should render a child element and position badge over it", async () => {
        const el = await fixture(
            html`<kp-badge value="7"><kp-avatar></kp-avatar></kp-badge>`
        );
        const avatar = el.querySelector("kp-avatar");
        const badge = el.shadowRoot.querySelector(".badge");
        expect(avatar).to.exist;
        expect(badge).to.exist;
        expect(el.children.length).to.equal(1);
    });
});
