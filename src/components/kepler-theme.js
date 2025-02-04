class KeplerTheme extends HTMLElement {
    static observedAttributes = ["theme"];

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.loadTheme();

        // Listen for the theme-change event
        this.addEventListener("theme-change", (event) => {
            const { theme } = event.detail;
            if (theme) {
                this.setAttribute("theme", theme);
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "theme" && oldValue !== newValue) {
            this.loadTheme();
        }
    }

    loadTheme() {
        const theme = this.getAttribute("theme") || "kepler-light";
        const variablesCSS = new URL("../styles/variables.css", import.meta.url)
            .href;
        const themeCSS = new URL(`../styles/${theme}.css`, import.meta.url)
            .href;
        const mainCSS = new URL("../styles/main.css", import.meta.url).href;

        // Inject styles into the shadow DOM
        this.shadowRoot.innerHTML = `
        <style>
            @import url('${variablesCSS}');
            @import url('${themeCSS}');
            @import url('${mainCSS}');
  
            :host {
                display: block;
                background: var(--base-background);
            }
        </style>
        <slot></slot>
      `;

        // Fetch both CSS files and apply variables to the host
        Promise.all([this.fetchCSS(variablesCSS), this.fetchCSS(themeCSS)])
            .then(([variablesContent, themeContent]) => {
                this.applyVariablesToHost(variablesContent + themeContent);
            })
            .catch((error) =>
                console.error("Failed to load theme or variables CSS:", error)
            );
    }

    fetchCSS(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch CSS from ${url}`);
            }
            return response.text();
        });
    }

    applyVariablesToHost(cssText) {
        const regex = /--([\w-]+):\s*([^;]+);/g;
        let match;

        // Extract and apply variables from the CSS
        while ((match = regex.exec(cssText)) !== null) {
            this.style.setProperty(`--${match[1]}`, match[2]);
        }
    }
}

customElements.define("kp-theme", KeplerTheme);
