class KeplerRouter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.routes = [];
        this.cache = new Map(); // Cache for external route responses.
        this.render = this.render.bind(this);
    }

    static get observedAttributes() {
        return ["routes"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "routes") {
            try {
                const rawRoutes = JSON.parse(newValue);
                // Precompile each route's regex and parameter names.
                this.routes = rawRoutes.map((route) => {
                    const { regex, paramNames } = this.compileRoutePattern(
                        route.route
                    );
                    return { ...route, regex, paramNames };
                });
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
                const rawRoutes = JSON.parse(this.getAttribute("routes"));
                this.routes = rawRoutes.map((route) => {
                    const { regex, paramNames } = this.compileRoutePattern(
                        route.route
                    );
                    return { ...route, regex, paramNames };
                });
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
                // Push both pathname and hash to update the URL.
                history.pushState(null, "", url.pathname + url.hash);
                const router = document.querySelector("kp-router");
                if (router) {
                    router.render();
                }
            }
        }
    }

    // Precompile the regex pattern and extract parameter names from a route pattern.
    compileRoutePattern(routePattern) {
        const paramNames = [];
        // Escape regex special characters.
        const escapedPattern = routePattern.replace(
            /[-[\]{}()*+?.,\\^$|#\s]/g,
            "\\$&"
        );
        // Replace parameters (e.g., ":id") with a regex capture group.
        const regexPattern = escapedPattern.replace(/:([^\/]+)/g, (_, key) => {
            paramNames.push(key);
            return "([^\\/]+)";
        });
        const regex = new RegExp(`^${regexPattern}$`);
        return { regex, paramNames };
    }

    // Find a route that matches the current path using the precompiled regex.
    findMatchedRoute(currentPath) {
        for (const route of this.routes) {
            const match = currentPath.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                return { ...route, params };
            }
        }
        return null;
    }

    // New method: Render the loader slot.
    renderLoader() {
        this.clearShadowRoot();
        const loaderSlot = document.createElement("slot");
        loaderSlot.name = "loader";
        this.shadowRoot.appendChild(loaderSlot);
    }

    // Fetch and render external HTML content.
    renderExternalContent(route) {
        const cacheKey = route.src;
        // Show the loader while fetching external content.
        this.renderLoader();

        const processHTML = (htmlText) => {
            // Parse the fetched HTML using DOMParser.
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            let content;
            const template = doc.querySelector("template");
            if (template) {
                content = template.content.cloneNode(true);
            } else {
                content = doc.body.cloneNode(true);
            }

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
            fragment.appendChild(content);

            // Clear the shadow root and append the new content.
            this.clearShadowRoot();
            this.shadowRoot.appendChild(fragment);

            // Process any inline <script> elements.
            this.processScripts();
        };

        // Use cached content if available.
        if (this.cache.has(cacheKey)) {
            processHTML(this.cache.get(cacheKey));
        } else {
            fetch(route.src)
                .then((response) => response.text())
                .then((htmlText) => {
                    this.cache.set(cacheKey, htmlText);
                    processHTML(htmlText);
                })
                .catch((err) => {
                    console.error("Error loading route content:", err);
                    this.shadowRoot.innerHTML = `<div>Error loading route content</div>`;
                });
        }
    }

    // Render content from a named slot.
    renderSlotContent(route) {
        const slot = document.createElement("slot");
        slot.name = route.slot;
        this.clearShadowRoot();
        this.shadowRoot.appendChild(slot);
    }

    // Clear all content from the shadow DOM.
    clearShadowRoot() {
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
    }

    // Process and re-execute any inline or module scripts in the new content.
    processScripts() {
        const scripts = this.shadowRoot.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            // For module scripts with a src, use dynamic import with a cache-busting query.
            if (oldScript.getAttribute("type") === "module" && oldScript.src) {
                const moduleUrl =
                    oldScript.src +
                    (oldScript.src.includes("?") ? "&" : "?") +
                    "t=" +
                    Date.now();
                import(moduleUrl).catch((err) =>
                    console.error(
                        "Error dynamically importing module script:",
                        err
                    )
                );
                oldScript.remove();
            } else {
                // Recreate classic or inline scripts.
                const newScript = document.createElement("script");
                if (oldScript.hasAttribute("type")) {
                    newScript.setAttribute(
                        "type",
                        oldScript.getAttribute("type")
                    );
                }
                if (oldScript.hasAttribute("async")) {
                    newScript.async = true;
                }
                if (oldScript.hasAttribute("defer")) {
                    newScript.defer = true;
                }
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                oldScript.parentNode.replaceChild(newScript, oldScript);
            }
        });
    }

    // Main render method: determine the current route and load its content.
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

        window.__routerShadowRoot = this.shadowRoot;
    }

    setRoutes(routes) {
        this.routes = routes.map((route) => {
            const { regex, paramNames } = this.compileRoutePattern(route.route);
            return { ...route, regex, paramNames };
        });
        this.render();
    }
}

if (!customElements.get("kp-router")) {
    customElements.define("kp-router", KeplerRouter);
}
