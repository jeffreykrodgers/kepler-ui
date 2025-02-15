class KeplerTheme extends HTMLElement {
    static observedAttributes = ["theme-path"];

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.loadTheme();

        // Listen for the theme-change event that can supply a new theme-path.
        this.addEventListener("theme-change", (event) => {
            const { themePath } = event.detail;
            if (themePath) {
                this.setAttribute("theme-path", themePath);
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "theme-path" && oldValue !== newValue) {
            this.loadTheme();
        }
    }

    loadTheme() {
        // Define your default CSS (including variables and base styles)
        const defaultCSS = `
        <style>
            /* Colors */
            :root {
                --green-light-1: rgba(237, 250, 243, 1);
                --green-dark-1: rgba(5, 5, 5, 1);
                --green-dark-2: rgba(10, 28, 19, 1);
                --green-dark-3: rgba(15, 50, 33, 1);
                --green-dark-4: rgba(20, 73, 46, 1);
                --green-dark-5: rgba(25, 96, 60, 1);
                --green-dark-6: rgba(30, 118, 74, 1);
                --green-dark-7: rgba(35, 141, 88, 1);
                --green-dark-8: rgba(40, 163, 101, 1);
                --green-light-2: rgba(213, 242, 227, 1);
                --green-light-3: rgba(189, 234, 211, 1);
                --green-light-4: rgba(165, 226, 195, 1);
                --green-light-5: rgba(141, 218, 179, 1);
                --green-light-6: rgba(117, 210, 163, 1);
                --green-light-7: rgba(93, 202, 147, 1);
                --green-light-8: rgba(69, 194, 131, 1);
                --neutral-black: rgba(0, 0, 0, 1);
                --neutral-white: rgba(255, 255, 255, 1);
                --neutral-1: rgba(241, 246, 250, 1);
                --neutral-2: rgba(215, 219, 222, 1);
                --neutral-3: rgba(188, 192, 195, 1);
                --neutral-4: rgba(162, 165, 167, 1);
                --neutral-5: rgba(135, 138, 140, 1);
                --neutral-6: rgba(109, 110, 112, 1);
                --neutral-7: rgba(82, 83, 84, 1);
                --neutral-8: rgba(56, 56, 57, 1);
                --neutral-9: rgba(29, 29, 29, 1);
                --green--: rgba(45, 186, 115, 1);
                --teal--: rgba(4, 178, 209, 1);
                --teal-light-1: rgba(245, 249, 250, 1);
                --teal-dark-1: rgba(5, 5, 5, 1);
                --teal-light-2: rgba(215, 240, 245, 1);
                --teal-light-3: rgba(185, 231, 240, 1);
                --teal-light-4: rgba(155, 222, 235, 1);
                --teal-light-5: rgba(125, 214, 230, 1);
                --teal-light-6: rgba(94, 205, 224, 1);
                --teal-light-7: rgba(64, 196, 219, 1);
                --teal-light-8: rgba(34, 187, 214, 1);
                --teal-dark-2: rgba(5, 27, 31, 1);
                --teal-dark-3: rgba(5, 48, 56, 1);
                --teal-dark-4: rgba(5, 70, 82, 1);
                --teal-dark-5: rgba(5, 92, 107, 1);
                --teal-dark-6: rgba(4, 113, 133, 1);
                --teal-dark-7: rgba(4, 135, 158, 1);
                --teal-dark-8: rgba(4, 156, 184, 1);
                --blue-dark-1: rgba(4, 5, 5, 1);
                --blue-dark-2: rgba(4, 21, 31, 1);
                --blue-dark-3: rgba(4, 37, 56, 1);
                --blue-dark-4: rgba(4, 53, 82, 1);
                --blue-dark-5: rgba(4, 70, 107, 1);
                --blue-dark-6: rgba(4, 86, 133, 1);
                --blue-dark-7: rgba(4, 102, 158, 1);
                --blue-dark-8: rgba(4, 118, 184, 1);
                --blue--: rgba(4, 134, 209, 1);
                --blue-light-1: rgba(245, 250, 250, 1);
                --blue-light-2: rgba(215, 236, 245, 1);
                --blue-light-3: rgba(185, 221, 240, 1);
                --blue-light-4: rgba(155, 207, 235, 1);
                --blue-light-5: rgba(125, 192, 230, 1);
                --blue-light-6: rgba(94, 178, 224, 1);
                --blue-light-7: rgba(64, 163, 219, 1);
                --blue-light-8: rgba(34, 149, 214, 1);
                --purple-dark-1: rgba(5, 4, 5, 1);
                --purple-dark-2: rgba(21, 4, 31, 1);
                --purple-dark-3: rgba(37, 4, 56, 1);
                --purple-dark-4: rgba(53, 4, 82, 1);
                --purple-dark-5: rgba(70, 4, 107, 1);
                --purple-dark-6: rgba(86, 4, 133, 1);
                --purple-dark-7: rgba(102, 4, 158, 1);
                --purple-dark-8: rgba(118, 4, 184, 1);
                --purple--: rgba(134, 4, 209, 1);
                --purple-light-1: rgba(250, 245, 250, 1);
                --purple-light-2: rgba(236, 215, 245, 1);
                --purple-light-3: rgba(221, 185, 240, 1);
                --purple-light-4: rgba(207, 155, 235, 1);
                --purple-light-5: rgba(192, 125, 230, 1);
                --purple-light-6: rgba(178, 94, 224, 1);
                --purple-light-7: rgba(163, 64, 219, 1);
                --purple-light-8: rgba(149, 34, 214, 1);
                --pink-dark-1: rgba(5, 4, 5, 1);
                --pink-dark-2: rgba(31, 4, 23, 1);
                --pink-dark-3: rgba(56, 4, 42, 1);
                --pink-dark-4: rgba(82, 4, 60, 1);
                --pink-dark-5: rgba(107, 4, 78, 1);
                --pink-dark-6: rgba(133, 4, 96, 1);
                --pink-dark-7: rgba(158, 4, 115, 1);
                --pink-dark-8: rgba(184, 4, 133, 1);
                --pink--: rgba(209, 4, 151, 1);
                --pink-light-1: rgba(250, 245, 248, 1);
                --pink-light-2: rgba(245, 215, 236, 1);
                --pink-light-3: rgba(240, 185, 224, 1);
                --pink-light-4: rgba(235, 155, 212, 1);
                --pink-light-5: rgba(230, 125, 200, 1);
                --pink-light-6: rgba(224, 94, 187, 1);
                --pink-light-7: rgba(219, 64, 175, 1);
                --pink-light-8: rgba(214, 34, 163, 1);
                --red-dark-1: rgba(5, 0, 0, 1);
                --red-dark-2: rgba(31, 1, 5, 1);
                --red-dark-3: rgba(56, 1, 10, 1);
                --red-dark-4: rgba(82, 2, 14, 1);
                --red-dark-5: rgba(107, 2, 19, 1);
                --red-dark-6: rgba(133, 3, 24, 1);
                --red-dark-7: rgba(158, 3, 29, 1);
                --red-dark-8: rgba(184, 4, 33, 1);
                --red--: rgba(217, 4, 40, 1);
                --red-light-1: rgba(250, 245, 246, 1);
                --red-light-2: rgba(246, 215, 220, 1);
                --red-light-3: rgba(242, 185, 195, 1);
                --red-light-4: rgba(238, 155, 169, 1);
                --red-light-5: rgba(234, 125, 143, 1);
                --red-light-6: rgba(229, 94, 117, 1);
                --red-light-7: rgba(225, 64, 92, 1);
                --red-light-8: rgba(221, 34, 66, 1);
                --orange-dark-1: rgba(5, 5, 4, 1);
                --orange-dark-2: rgba(31, 11, 4, 1);
                --orange-dark-3: rgba(56, 18, 4, 1);
                --orange-dark-4: rgba(82, 24, 4, 1);
                --orange-dark-5: rgba(107, 30, 4, 1);
                --orange-dark-6: rgba(133, 36, 4, 1);
                --orange-dark-7: rgba(158, 43, 4, 1);
                --orange-dark-8: rgba(184, 49, 4, 1);
                --orange--: rgba(209, 55, 4, 1);
                --orange-light-1: rgba(250, 246, 245, 1);
                --orange-light-2: rgba(245, 222, 215, 1);
                --orange-light-3: rgba(240, 198, 185, 1);
                --orange-light-4: rgba(235, 174, 155, 1);
                --orange-light-5: rgba(230, 151, 125, 1);
                --orange-light-6: rgba(224, 127, 94, 1);
                --orange-light-7: rgba(219, 103, 64, 1);
                --orange-light-8: rgba(214, 79, 34, 1);
                --yellow-dark-1: rgba(5, 5, 4, 1);
                --yellow-dark-2: rgba(31, 25, 4, 1);
                --yellow-dark-3: rgba(56, 44, 4, 1);
                --yellow-dark-4: rgba(82, 64, 4, 1);
                --yellow-dark-5: rgba(107, 83, 4, 1);
                --yellow-dark-6: rgba(133, 103, 4, 1);
                --yellow-dark-7: rgba(158, 122, 4, 1);
                --yellow-dark-8: rgba(184, 142, 4, 1);
                --yellow--: rgba(209, 161, 4, 1);
                --yellow-light-1: rgba(250, 250, 245, 1);
                --yellow-light-2: rgba(245, 239, 215, 1);
                --yellow-light-3: rgba(240, 228, 185, 1);
                --yellow-light-4: rgba(235, 217, 155, 1);
                --yellow-light-5: rgba(230, 206, 125, 1);
                --yellow-light-6: rgba(224, 194, 94, 1);
                --yellow-light-7: rgba(219, 183, 64, 1);
                --yellow-light-8: rgba(214, 172, 34, 1);
                --pumpkin-dark-1: rgba(5, 3, 0, 1);
                --pumpkin-dark-2: rgba(36, 21, 1, 1);
                --pumpkin-dark-3: rgba(66, 39, 1, 1);
                --pumpkin-dark-4: rgba(97, 57, 2, 1);
                --pumpkin-dark-5: rgba(128, 76, 3, 1);
                --pumpkin-dark-6: rgba(158, 94, 3, 1);
                --pumpkin-dark-7: rgba(189, 112, 4, 1);
                --pumpkin-dark-8: rgba(219, 130, 4, 1);
                --pumpkin--: rgba(250, 148, 5, 1);
                --pumpkin-light-1: rgba(250, 248, 245, 1);
                --pumpkin-light-2: rgba(250, 236, 215, 1);
                --pumpkin-light-3: rgba(250, 223, 185, 1);
                --pumpkin-light-4: rgba(250, 211, 155, 1);
                --pumpkin-light-5: rgba(250, 198, 125, 1);
                --pumpkin-light-6: rgba(250, 186, 95, 1);
                --pumpkin-light-7: rgba(250, 173, 65, 1);
                --pumpkin-light-8: rgba(250, 161, 35, 1);
                --size-display3: 84px;
                --size-sm: 12px;
                --size-xs: 10px;
                --size-display2: 98px;
                --size-display4: 70px;
                --size-h3: 35px;
                --size-h6: 14px;
                --size-h1: 56px;
                --size-display1: 112px;
                --size-h5: 21px;
                --size-h2: 42px;
                --size-h4: 28px;
                --size-p: 1em;
                --border-none: 0px;
                --border-small: 1px;
                --border-medium: 2px;
                --border-large: 4px;
                --radii-none: 0px;
                --radii-small: 0.5px;
                --radii-medium: 1px;
                --radii-large: 2px;
                --radii-full: 9999px;
                --spacing-none: 0px;
                --spacing-2x-small: 1px;
                --spacing-x-small: 2px;
                --spacing-small: 4px;
                --spacing-medium: 8px;
                --spacing-large: 10px;
                --spacing-x-large: 12px;
                --spacing-2x-large: 16px;
                --font-family: "ProFontWindows", monospace;
            }

            @font-face {
                font-family: ProFontWindows;
                src: url("/src/assets/ProFontWindows.ttf");
            }

            @font-face {
                font-family: Tomorrow;
                src: url("/src/assets/Tomorrow-Medium.ttf");
            }

            /* Default Light Theme */
            /* Themes - Kepler Light */
            :root {
                --base-background: var(--neutral-white);
                --base-text--: var(--neutral-9);
                --base-text-emphasize: var(--neutral-8);
                --base-text-light: var(--neutral-7);
                --base-text-subtle: var(--neutral-6);
                --base-surface: var(--neutral-1);
                --base-hover: var(--neutral-2);
                --base-focus: var(--neutral-3);
                --base-border: var(--neutral-2);
                --primary--: var(--blue--);
                --primary-hover: var(--blue-light-8);
                --primary-active: var(--blue-light-7);
                --primary-background--: var(--blue-light-1);
                --primary-background-hover: var(--blue-light-2);
                --primary-background-active: var(--blue-light-3);
                --primary-background-border: var(--blue-light-4);
                --secondary--: var(--neutral-9);
                --secondary-background--: var(--neutral-1);
                --secondary-hover: var(--neutral-8);
                --secondary-active: var(--neutral-7);
                --secondary-background-hover: var(--neutral-2);
                --secondary-background-active: var(--neutral-3);
                --secondary-background-border: var(--neutral-6);
                --error--: var(--red--);
                --error-hover: var(--red-light-8);
                --error-active: var(--red-light-7);
                --error-background--: var(--red-light-1);
                --error-background-hover: var(--red-light-2);
                --error-background-active: var(--red-light-3);
                --error-background-border: var(--red-light-4);
                --warning--: var(--yellow--);
                --warning-hover: var(--yellow-light-8);
                --warning-active: var(--yellow-light-7);
                --warning-background--: var(--yellow-light-1);
                --warning-background-hover: var(--yellow-light-2);
                --warning-background-active: var(--yellow-light-3);
                --warning-background-border: var(--yellow-light-4);
                --success--: var(--green--);
                --success-hover: var(--green-light-8);
                --success-active: var(--green-light-7);
                --success-background--: var(--green-light-1);
                --success-background-hover: var(--green-light-2);
                --success-background-active: var(--green-light-3);
                --success-background-border: var(--green-light-4);
            }

            ::slotted(*) {
                color: var(--base-text--, rgba(29, 29, 29, 1));
            }

  
            :host {
                display: block;
                background: var(--base-background);
            }

            html,
            body {
                margin: 0;
                padding: 0;
                color: var(--base-text--, #333);
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            label,
            button {
                font-family: "ProFontWindows", sans-serif;
            }

            p,
            a,
            span,
            small,
            strong {
                font-family: "Tomorrow", sans-serif;
            }

            .display-1 {
                color: var(--base-text--, rgba(29, 29, 29, 1));
                font-size: var(--size-display1);
            }

            .display-2 {
                color: var(--primary--, rgba(4, 134, 209, 1));
                font-size: var(--size-display2);
                text-transform: uppercase;
            }

            .display-3 {
                color: var(--base-text-light);
                font-size: var(--size-display3);
            }

            .display-4 {
                color: var(--base-text-subtle);
                font-size: var(--size-display4);
                text-transform: uppercase;
            }

            h1 {
                color: var(--base-text--, rgba(29, 29, 29, 1));
                font-size: var(--size-h1);
            }

            h2 {
                color: var(--primary--, rgba(4, 134, 209, 1));
                font-size: var(--size-h2);
                text-transform: uppercase;
            }

            h3 {
                color: var(--base-text-light);
                font-size: var(--size-h3);
            }

            h4 {
                color: var(--base-text-subtle);
                font-size: var(--size-h4);
                text-transform: uppercase;
            }

            h5 {
                color: var(--base-text--, rgba(29, 29, 29, 1));
                font-size: var(--size-h5);
            }

            h6 {
                color: var(--primary--, rgba(4, 134, 209, 1));
                font-size: var(--size-h6);
            }

            p {
                color: var(--base-text--, rgba(29, 29, 29, 1));
                font-size: var(--size-p);
            }

            small {
                color: var(--base-text-emphasize);
                font-size: var(--size-small);
            }
        </style>
      `;

        // Get the theme stylesheet path from the attribute.
        const themePathAttr = this.getAttribute("theme-path");

        if (themePathAttr) {
            // Use document.baseURI as the base so that the URL is relative to the served page.
            const themeCSSUrl = new URL(themePathAttr, document.baseURI).href;
            fetch(themeCSSUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch CSS from ${themeCSSUrl}`
                        );
                    }
                    return response.text();
                })
                .then((fetchedCSS) => {
                    // Combine default CSS and fetched CSS.
                    const combinedCSS = `
                    ${defaultCSS}
                    <style>
                        ${fetchedCSS}
                    </style>
                `;
                    // Inject combined styles into the shadow DOM along with a slot.
                    this.shadowRoot.innerHTML = `${combinedCSS}<slot></slot>`;
                    // Apply CSS variables from both default and fetched CSS.
                    this.applyVariablesToHost(defaultCSS + fetchedCSS);
                })
                .catch((err) => {
                    console.error("Error loading theme:", err);
                    // Fall back to default CSS if fetch fails.
                    this.shadowRoot.innerHTML = `${defaultCSS}<slot></slot>`;
                    this.applyVariablesToHost(defaultCSS);
                });
        } else {
            // No theme file provided; use default CSS only.
            this.shadowRoot.innerHTML = `${defaultCSS}<slot></slot>`;
            this.applyVariablesToHost(defaultCSS);
        }
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
        // Extract CSS custom properties from the CSS text using a regex.
        const regex = /--([\w-]+):\s*([^;]+);/g;
        let match;

        while ((match = regex.exec(cssText)) !== null) {
            this.style.setProperty(`--${match[1]}`, match[2].trim());
        }
    }
}

if (!customElements.get("kp-theme")) {
    customElements.define("kp-theme", KeplerTheme);
}
