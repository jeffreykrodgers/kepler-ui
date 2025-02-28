import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import "../src/components/kepler-toast.js"; // Update path to your component

describe("kp-toast component", () => {
    it("should be defined", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        expect(el).to.exist;
    });

    it("should default to position='bottom' and alignment='right'", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        expect(el.getAttribute("position")).to.equal("bottom");
        expect(el.getAttribute("alignment")).to.equal("right");
    });

    it("should allow setting position and alignment attributes", async () => {
        const el = await fixture(
            html`<kp-toast position="top" alignment="center"></kp-toast>`
        );
        expect(el.getAttribute("position")).to.equal("top");
        expect(el.getAttribute("alignment")).to.equal("center");
    });

    it("should render a toast with default settings when pop() is called", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        el.pop({ message: "Hello World!" });

        await waitUntil(
            () => el.querySelector(".toast"),
            "Toast was not rendered"
        );

        const toast = el.querySelector(".toast");
        expect(toast).to.exist;
        expect(toast.textContent).to.include("Hello World!");
        expect(toast.classList.contains("base")).to.be.true; // Default color
    });

    it("should render a toast with a specific color", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        el.pop({ message: "Success!", color: "success" });

        await waitUntil(
            () => el.querySelector(".toast"),
            "Toast was not rendered"
        );

        const toast = el.querySelector(".toast");
        expect(toast.classList.contains("success")).to.be.true;
    });

    it("should remove the toast after the specified duration", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        el.pop({ message: "Temporary Toast", duration: 100 });

        // Wait for the toast to appear
        await waitUntil(
            () => el.querySelector(".toast"),
            "Toast was not rendered"
        );
        expect(el.querySelector(".toast")).to.exist;

        // Wait slightly longer than duration + transition time
        await new Promise((resolve) => setTimeout(resolve, 700)); // 100ms duration + 500ms transition buffer

        // Ensure the toast is removed
        expect(el.querySelector(".toast")).to.not.exist;
    });

    it("should remove the toast when clicked if closable is true", async () => {
        const el = await fixture(html`<kp-toast></kp-toast>`);
        el.pop({ message: "Click to Close", closable: true });

        await waitUntil(
            () => el.querySelector(".toast"),
            "Toast was not rendered"
        );

        const toast = el.querySelector(".toast");
        expect(toast.classList.contains("closable")).to.be.true;

        // Simulate user click
        toast.click();

        // Wait for transitionend to fire
        await new Promise((resolve) => setTimeout(resolve, 700)); // 500ms transition buffer

        // Ensure the toast is removed
        expect(el.querySelector(".toast")).to.not.exist;
    });

    it("should use a template slot if specified", async () => {
        const el = await fixture(html`
            <kp-toast>
                <template slot="custom-toast">
                    <div class="custom-content">
                        <span data-message></span>
                    </div>
                </template>
            </kp-toast>
        `);

        el.pop({ message: "Templated Message", template: "custom-toast" });

        await waitUntil(
            () => el.querySelector(".toast"),
            "Toast was not rendered"
        );

        const toast = el.querySelector(".toast");
        expect(toast.querySelector(".custom-content")).to.exist;
        expect(
            toast.querySelector(".custom-content span").textContent
        ).to.equal("Templated Message");
    });
});
