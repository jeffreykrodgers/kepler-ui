class KeplerRouter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.routes = [];
        this.render = this.render.bind(this);
    }

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

    // Render external HTML content into the shadow DOM.
    renderExternalContent(route) {
        fetch(route.src)
            .then((response) => response.text())
            .then((htmlText) => {
                // Parse the fetched HTML using DOMParser.
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, "text/html");
                let content;
                // If a <template> exists, use its content; otherwise, use the full document body.
                const template = doc.querySelector("template");
                if (template) {
                    content = template.content.cloneNode(true);
                } else {
                    content = doc.body.cloneNode(true);
                }

                // Create a document fragment.
                const fragment = document.createDocumentFragment();

                // If propagateStyles is enabled, clone global style elements from document.head.
                if (route.propagateStyles) {
                    const headStyles = document.head.querySelectorAll(
                        'link[rel="stylesheet"], style'
                    );
                    headStyles.forEach((el) => {
                        fragment.appendChild(el.cloneNode(true));
                    });
                }

                // Append the content.
                fragment.appendChild(content);

                // Clear the shadow root and append the fragment.
                this.shadowRoot.innerHTML = "";
                this.shadowRoot.appendChild(fragment);

                // Process any inline <script> elements in the shadow DOM.
                const scripts = this.shadowRoot.querySelectorAll("script");
                scripts.forEach((oldScript) => {
                    const newScript = document.createElement("script");
                    // Copy the type attribute if it exists (e.g., type="module")
                    if (oldScript.hasAttribute("type")) {
                        newScript.setAttribute(
                            "type",
                            oldScript.getAttribute("type")
                        );
                    }
                    // Copy any other attributes you might need (like async or defer)
                    if (oldScript.hasAttribute("async")) {
                        newScript.setAttribute(
                            "async",
                            oldScript.getAttribute("async")
                        );
                    }
                    if (oldScript.hasAttribute("defer")) {
                        newScript.setAttribute(
                            "defer",
                            oldScript.getAttribute("defer")
                        );
                    }
                    // If there's a src, assign it; otherwise, copy inline code.
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            })
            .catch((err) => {
                this.shadowRoot.innerHTML = `<div>Error loading route content</div>`;
            });
    }

    renderSlotContent(route) {
        const slot = document.createElement("slot");
        slot.name = route.slot;
        this.shadowRoot.appendChild(slot);
    }

    clearShadowRoot() {
        this.shadowRoot.innerHTML = "";
    }

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

    setRoutes(routes) {
        this.routes = routes;
        this.render();
    }
}

if (!customElements.get("kp-router")) {
    customElements.define("kp-router", KeplerRouter);
}
