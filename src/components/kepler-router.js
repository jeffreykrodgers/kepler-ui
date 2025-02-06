// In your kp-router component (or an extended version)
class KeplerRouter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Allow dynamic routes to be set via a property
        this.routes = [];
        this.render = this.render.bind(this);
    }

    connectedCallback() {
        window.addEventListener("popstate", this.render);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("popstate", this.render);
    }

    // Simple route matching (modify as needed)
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

    // Allow setting routes dynamically
    setRoutes(routes) {
        this.routes = routes;
        this.render();
    }

    // Modified render to support external HTML content
    render() {
        const path = window.location.pathname;
        let matchedRoute = null;

        // Search through routes for a match
        for (const route of this.routes) {
            const params = this.matchRoute(path, route.route);
            if (params !== null) {
                matchedRoute = route;
                break;
            }
        }

        // Clear current content
        this.shadowRoot.innerHTML = "";

        // If a match is found, check if it should load external content
        if (matchedRoute) {
            if (matchedRoute.src) {
                // If there's an external HTML file, fetch and insert it
                fetch(matchedRoute.src)
                    .then((response) => response.text())
                    .then((html) => {
                        this.shadowRoot.innerHTML = html;
                    })
                    .catch((err) => {
                        this.shadowRoot.innerHTML = `<div>Error loading route content</div>`;
                    });
            } else if (matchedRoute.slot) {
                // Otherwise, fallback to rendering the assigned slot
                const slot = document.createElement("slot");
                slot.name = matchedRoute.slot;
                this.shadowRoot.appendChild(slot);
            }
        } else {
            // Render a simple Not Found message if no route matches
            this.shadowRoot.innerHTML = `<div>Not Found</div>`;
        }
    }
}

customElements.define("kp-router", KeplerRouter);
