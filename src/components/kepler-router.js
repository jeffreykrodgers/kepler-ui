class KeplerRouter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.routes = [];
        this.render = this.render.bind(this);
    }

    // Observe the "routes" attribute
    static get observedAttributes() {
        return ["routes"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "routes") {
            try {
                this.routes = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error("Invalid routes JSON:", e);
            }
        }
    }

    connectedCallback() {
        window.addEventListener("popstate", this.render);

        if (!KeplerRouter._globalClickAttached) {
            document.addEventListener("click", KeplerRouter.handleGlobalClick);
            KeplerRouter._globalClickAttached = true;
        }
        if (this.hasAttribute("routes")) {
            try {
                this.routes = JSON.parse(this.getAttribute("routes"));
            } catch (e) {
                console.error("Invalid routes attribute:", e);
            }
        }
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("popstate", this.render);
    }

    static handleGlobalClick(e) {
        const anchor = e.composedPath().find((el) => el.tagName === "A");
        if (anchor && anchor.href) {
            const url = new URL(anchor.href);
            if (url.origin === location.origin) {
                e.preventDefault();
                history.pushState(null, "", url.pathname);
                const router = document.querySelector("kp-router");
                if (router) {
                    router.render();
                }
            }
        }
    }

    // Helper to match current path against routes
    findMatchedRoute(currentPath) {
        for (const route of this.routes) {
            const params = this.matchRoute(currentPath, route.route);
            if (params !== null) {
                return route;
            }
        }
        return null;
    }

    matchRoute(path, routePattern) {
        const paramNames = [];
        const regexPattern = routePattern.replace(/:([^\/]+)/g, (_, key) => {
            paramNames.push(key);
            return "([^\\/]+)";
        });
        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);
        if (match) {
            const params = {};
            paramNames.forEach((name, index) => {
                params[name] = match[index + 1];
            });
            return params;
        }
        return null;
    }

    // Render external HTML content into the shadow DOM
    renderExternalContent(route) {
        fetch(route.src)
            .then((response) => response.text())
            .then((html) => {
                const container = document.createElement("div");
                container.innerHTML = html;
                const fragment = document.createDocumentFragment();

                if (route.propagateStyles) {
                    if (
                        document.adoptedStyleSheets &&
                        document.adoptedStyleSheets.length > 0
                    ) {
                        this.shadowRoot.adoptedStyleSheets =
                            document.adoptedStyleSheets;
                    } else {
                        const headStyles = document.querySelectorAll(
                            'link[rel="stylesheet"], style'
                        );
                        headStyles.forEach((el) => {
                            fragment.appendChild(el.cloneNode(true));
                        });
                    }
                }

                // Append all remaining content
                while (container.firstChild) {
                    fragment.appendChild(container.firstChild);
                }
                this.shadowRoot.appendChild(fragment);
            })
            .catch((err) => {
                this.shadowRoot.innerHTML = `<div>Error loading route content</div>`;
            });
    }

    // Render slot content based on a route
    renderSlotContent(route) {
        const slot = document.createElement("slot");
        slot.name = route.slot;
        this.shadowRoot.appendChild(slot);
    }

    // Clear the shadow root (helper method)
    clearShadowRoot() {
        this.shadowRoot.innerHTML = "";
    }

    // Main render method
    render() {
        const currentPath = window.location.pathname;
        const matchedRoute = this.findMatchedRoute(currentPath);
        this.clearShadowRoot();

        if (matchedRoute) {
            if (matchedRoute.src) {
                this.renderExternalContent(matchedRoute);
            } else if (matchedRoute.slot) {
                this.renderSlotContent(matchedRoute);
            }
        } else {
            this.shadowRoot.innerHTML = `<div>Not Found</div>`;
        }
    }

    // Allow setting routes dynamically via a method
    setRoutes(routes) {
        this.routes = routes;
        this.render();
    }
}

customElements.define("kp-router", KeplerRouter);
