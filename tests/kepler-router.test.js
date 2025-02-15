import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "../src/components/kepler-router.js";

describe("KeplerRouter", () => {
    // Reset location between tests.
    afterEach(() => {
        history.pushState(null, "", "/");
    });

    it('renders "Not Found" when no route matches the current path', async () => {
        history.pushState(null, "", "/nonexistent");
        const routes = [{ route: "/test", slot: "default" }];
        const el = await fixture(html`
            <kp-router routes="${JSON.stringify(routes)}"></kp-router>
        `);
        // Allow a tick for render() to complete.
        await new Promise((r) => setTimeout(r, 0));
        expect(el.shadowRoot.innerHTML).to.contain("Not Found");
    });

    it("renders slot content when a matching route is found", async () => {
        history.pushState(null, "", "/");
        const routes = [{ route: "/", slot: "default" }];
        const el = await fixture(html`
            <kp-router routes="${JSON.stringify(routes)}"></kp-router>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const slotEl = el.shadowRoot.querySelector('slot[name="default"]');
        expect(slotEl).to.exist;
    });

    it("renders external content when a matching route with src is found", async () => {
        history.pushState(null, "", "/external");
        const fakeHtml = `<html><body><template><div id="external">External Content</div></template></body></html>`;
        const routes = [{ route: "/external", src: "fake.html" }];
        // Stub fetch so that each call returns a new Response instance.
        const fetchStub = sinon.stub(window, "fetch").callsFake((url) => {
            return Promise.resolve(new Response(fakeHtml, { status: 200 }));
        });
        const el = await fixture(html`
            <kp-router routes="${JSON.stringify(routes)}"></kp-router>
        `);
        // Allow time for fetch and renderExternalContent to complete.
        await new Promise((r) => setTimeout(r, 50));
        expect(el.shadowRoot.innerHTML).to.contain("External Content");
        fetchStub.restore();
    });

    it("prevents default navigation for same-origin anchors via handleGlobalClick", async () => {
        // Create a dummy anchor that points to the same origin.
        const anchor = document.createElement("a");
        anchor.href = window.location.origin + "/test";
        // Create a fake event whose composedPath includes the anchor.
        const fakeEvent = new Event("click", { bubbles: true, composed: true });
        fakeEvent.composedPath = () => [anchor];
        const preventDefaultSpy = sinon.spy(fakeEvent, "preventDefault");
        // Use the static method from the defined element.
        const RouterClass = customElements.get("kp-router");
        RouterClass.handleGlobalClick(fakeEvent);
        expect(preventDefaultSpy.called).to.be.true;
    });

    it("calls render() on popstate event", async () => {
        const el = await fixture(html` <kp-router routes="[]"></kp-router> `);

        // Get the originally bound render function.
        const boundRender = el.render.bind(el);

        // Remove the existing listener.
        window.removeEventListener("popstate", boundRender);

        // Wrap render in a function that sets a flag.
        let wasCalled = false;
        const newRender = (...args) => {
            wasCalled = true;
            return boundRender(...args);
        };

        // Add our wrapped version as the popstate listener.
        window.addEventListener("popstate", newRender);

        // Dispatch a popstate event.
        window.dispatchEvent(new PopStateEvent("popstate", {}));

        // Wait a tick.
        await new Promise((r) => setTimeout(r, 0));

        expect(wasCalled).to.be.true;

        // Restore original listener.
        window.removeEventListener("popstate", newRender);
        window.addEventListener("popstate", boundRender);
    });
});
