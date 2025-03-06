class KeplerBadge extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["value", "position", "alignment", "color", "size"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const value = this.getAttribute("value") || "";
        const position = this.getAttribute("position") || "top";
        const alignment = this.getAttribute("alignment") || "right";
        const color = this.getAttribute("color") || "primary";
        const badgeColor = this.getBadgeColor(color);
        const size = this.getAttribute("size") || "small";
        const { fontSize, padding, minSize } = this.getSizeAttributes(size);

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: relative;
                display: inline-block;
            }
            .badge {
                position: absolute;
                ${this.getBadgePosition(position, alignment)}
                background: ${badgeColor};
                color: var(--base-text, rgba(33, 37, 41, 1));
                font-size: ${fontSize};
                font-weight: bold;
                padding: ${padding};
                border-radius: var(--radii-full, 9999px);
                border: var(--border-large) solid var(--base-surface, #fff);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: ProFontWindows, monospace;
                min-width: ${minSize};
                height: ${minSize};
            }
            ::slotted(*) {
                position: relative;
                display: inline-block;
            }
        </style>
        <slot></slot>
        <div class="badge">${value}</div>
      `;
    }

    getBadgePosition(position, alignment) {
        let posStyles = "";
        if (position === "top") {
            posStyles += "top: -10px; var(--badge-offset-y, -50%);";
        } else {
            posStyles += "bottom: -10px; var(--badge-offset-y, 50%);";
        }
        if (alignment === "right") {
            posStyles += "right: -10px; var(--badge-offset-x, 50%);";
        } else {
            posStyles += "left: -10px; var(--badge-offset-x, -50%);";
        }
        return posStyles;
    }

    getBadgeColor(color) {
        const colorMap = {
            primary: "var(--primary--, rgba(0, 123, 255, 1))",
            secondary: "var(--secondary--, rgba(108, 117, 125, 1))",
            base: "var(--base-text, rgba(33, 37, 41, 1))",
            success: "var(--success, rgba(40, 167, 69, 1))",
            warning: "var(--warning, rgba(255, 193, 7, 1))",
            error: "var(--error, rgba(220, 53, 69, 1))",
        };
        return colorMap[color] || color; // Use custom hex if provided
    }

    getSizeAttributes(size) {
        const sizeMap = {
            small: {
                fontSize: "var(--size-p, 16px)",
                padding: "var(--spacing-small, 2px)",
                minSize: "15px",
            },
            medium: {
                fontSize: "var(--size-h5, 18px)",
                padding: "var(--spacing-small, 2px)",
                minSize: "18px",
            },
            large: {
                fontSize: "var(--size-h4, 20px)",
                padding: "var(--spacing-small, 2px)",
                minSize: "22px",
            },
        };
        return sizeMap[size] || sizeMap.small;
    }
}

if (!customElements.get("kp-badge")) {
    customElements.define("kp-badge", KeplerBadge);
}
