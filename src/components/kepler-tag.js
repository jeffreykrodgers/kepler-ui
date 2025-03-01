class KeplerTag extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["color", "closable", "size"];
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: inline-flex;
                align-items: center;
                border-radius: var(--radii-large);
                font-family: Tomorrow, monospace;
                background: var(--neutral-1, #e9ecef);
                transition: background 0.2s ease, color 0.2s ease;
                gap: var(--spacing-small);
            }
            
            /* Default size (medium) */
            :host(:not([size])),
            :host([size="medium"]) {
                font-size: var(--size-p, 16px);
                padding: var(--spacing-small, 8px) var(--spacing-medium, 12px);
            }

            /* Small size */
            :host([size="small"]) {
                font-size: var(--size-sm, 14px);
                padding: var(--spacing-2x-small, 4px) var(--spacing-small, 8px);
            }

            /* Large size */
            :host([size="large"]) {
                font-size: var(--size-h5, 20px);
                padding: var(--spacing-medium, 12px) var(--spacing-large, 16px);
            }

            /* Theme variants */
            :host(.primary) {
                background: var(--primary--, #007bff);
            }
            :host(.secondary) {
                background: var(--secondary--, #6c757d);
            }
            :host(.base) {
                background: var(--base-text--, #212529);
            }
            :host(.success) {
                background: var(--success--, #28a745);
            }
            :host(.warning) {
                background: var(--warning--, #ffc107);
            }
            :host(.error) {
                background: var(--error--, #dc3545);
            }

            .content {
                color: var(--base-surface, #212529);
            }

            .close {
                cursor: pointer;
                user-select: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            :host([size="small"]) .close {
                width: 12px;
                height: 12px;
            }

            :host(:not([size])) .close,
            :host([size="medium"]) .close {
                width: 16px;
                height: 16px;
            }

            :host([size="large"]) .close {
                width: 20px;
                height: 20px;
            }

            .close svg {
                width: 100%;
                height: 100%;
                stroke: currentColor;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
                fill: none;
                transition: stroke 0.2s ease;
            }

            .close.hidden {
                display: none;
            }
        </style>
        <span class="content"><slot></slot></span>
        <span class="close hidden">
            <svg viewBox="0 0 24 24">
                <line x1="5" y1="5" x2="19" y2="19"></line>
                <line x1="19" y1="5" x2="5" y2="19"></line>
            </svg>
        </span>
        `;
    }

    connectedCallback() {
        this.updateAppearance();
        if (this.hasAttribute("closable")) {
            this.shadowRoot.querySelector(".close").classList.remove("hidden");
        }
        this.shadowRoot
            .querySelector(".close")
            .addEventListener("click", () => {
                this.dispatchEvent(
                    new CustomEvent("remove", {
                        detail: { tag: this },
                        bubbles: true,
                        composed: true,
                    })
                );
                this.remove();
            });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateAppearance();
            if (name === "closable") {
                if (this.hasAttribute("closable")) {
                    this.shadowRoot
                        .querySelector(".close")
                        .classList.remove("hidden");
                } else {
                    this.shadowRoot
                        .querySelector(".close")
                        .classList.add("hidden");
                }
            }
        }
    }

    updateAppearance() {
        this.classList.remove(
            "primary",
            "secondary",
            "base",
            "success",
            "warning",
            "error"
        );

        const colorAttr = this.getAttribute("color");
        const contentEl = this.shadowRoot.querySelector(".content");
        const closeEl = this.shadowRoot.querySelector(".close");

        if (!contentEl || !closeEl) return; // Prevent errors if elements aren't available

        const knownVariants = [
            "primary",
            "secondary",
            "base",
            "success",
            "warning",
            "error",
        ];

        if (colorAttr && knownVariants.includes(colorAttr)) {
            // Apply theme-based colors
            this.classList.add(colorAttr);
            this.style.backgroundColor = "";
            contentEl.style.color = "var(--base-surface, #212529)";
            closeEl.style.color = "var(--base-surface, #212529)";
        } else if (colorAttr && colorAttr.startsWith("#")) {
            // Apply direct hex color
            this.style.backgroundColor = colorAttr;
            const isDark = this.isDarkColor(colorAttr);
            const textColor = isDark ? "#ffffff" : "#212529";
            contentEl.style.color = textColor;
            closeEl.style.color = textColor;
        } else {
            // If no color is provided, ensure close button is visible
            this.style.backgroundColor = "";
            contentEl.style.color = "var(--base-text, #212529)";
            closeEl.style.color = "var(--base-text, #212529)"; // Ensures close button is visible
        }
    }

    isDarkColor(color) {
        let r, g, b;
        color = color.trim();

        // Support for rgb() strings.
        if (color.startsWith("rgb(")) {
            const match = color.match(
                /rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/
            );
            if (match) {
                r = parseInt(match[1], 10);
                g = parseInt(match[2], 10);
                b = parseInt(match[3], 10);
            }
        }
        // Support for hex colors.
        else if (color.startsWith("#")) {
            let hex = color.slice(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        }

        // Fallback in case of an unsupported format.
        if (r === undefined || g === undefined || b === undefined) {
            return true; // default to dark text if parsing fails.
        }
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq < 128;
    }
}

if (!customElements.get("kp-tag")) {
    customElements.define("kp-tag", KeplerTag);
}
