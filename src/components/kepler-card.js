class KeplerCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["basic", "color"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get basic() {
        return this.hasAttribute("basic");
    }

    set basic(value) {
        if (value) {
            this.setAttribute("basic", "");
        } else {
            this.removeAttribute("basic");
        }
    }

    // New "color" property
    get color() {
        return this.getAttribute("color") || "base";
    }

    set color(val) {
        this.setAttribute("color", val);
    }

    // Check whether a given slot (header or footer) has content.
    checkSlot(slotName) {
        const slotElement = this.shadowRoot.querySelector(
            `slot[name="${slotName}"]`
        );
        if (slotElement) {
            const assignedNodes = slotElement
                .assignedNodes({ flatten: true })
                .filter(
                    (node) =>
                        node.nodeType !== Node.TEXT_NODE ||
                        node.textContent.trim() !== ""
                );
            const container = this.shadowRoot.querySelector(`.${slotName}`);
            if (container) {
                container.style.display =
                    assignedNodes.length === 0 ? "none" : "";
            }
        }
    }

    render() {
        // Determine colors based on the "color" property.
        const colorAttr = this.color;
        const borderColorMap = {
            base: "var(--base-border--, var(--base-border, rgba(215,219,222,1)))",
            primary:
                "var(--primary-background-border, var(--primary--, rgba(4,134,209,1)))",
            secondary:
                "var(--secondary-background-border, var(--neutral-9, rgba(29,29,29,1)))",
            success:
                "var(--success-background-border, var(--success--, rgba(45,186,115,1)))",
            warning:
                "var(--warning-background-border, var(--yellow--, rgba(209,161,4,1)))",
            error: "var(--error-background-border, var(--error--, rgba(217,4,40,1)))",
        };
        const backgroundColorMap = {
            base: "var(--base-surface, rgba(241,246,250,1))",
            primary:
                "var(--primary-background--, var(--blue-light-1, rgba(245,250,250,1)))",
            secondary:
                "var(--secondary-background--, var(--neutral-1, rgba(241,246,250,1)))",
            success:
                "var(--success-background--, var(--green-light-1, rgba(213,242,227,1)))",
            warning:
                "var(--warning-background--, var(--yellow-light-1, rgba(250,250,245,1)))",
            error: "var(--error-background--, var(--red-light-1, rgba(250,245,246,1)))",
        };

        const borderColor = borderColorMap[colorAttr] || borderColorMap.base;
        const backgroundColor =
            backgroundColorMap[colorAttr] || backgroundColorMap.base;
        const showPatterns = !this.basic;

        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            border: var(--border-medium, 2px) solid ${borderColor};
          }
          .header,
          .footer {
            background: ${borderColor};
            padding: var(--spacing-x-large, 12px);
          }
          .header {
            border-bottom: var(--border-medium, 2px) solid ${borderColor};
          }
          .footer {
            border-top: var(--border-medium, 2px) solid ${borderColor};
          }
          .content {
            position: relative;
            padding: 26px 16px 26px 16px;
            flex: 1;
            background: ${backgroundColor};
          }
          ${
              showPatterns
                  ? `
          .content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 10px;
            background: repeating-linear-gradient(
              -45deg,
              ${borderColor} 0,
              ${borderColor} 2px,
              transparent 3px,
              transparent 10px
            );
          }
          .content::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 10px;
            background: repeating-linear-gradient(
              -45deg,
              ${borderColor} 0,
              ${borderColor} 2px,
              transparent 3px,
              transparent 10px
            );
          }
          `
                  : ""
          }
        </style>
        <div class="header" part="header">
          <slot name="header"></slot>
        </div>
        <div class="content" part="content">
          <slot></slot>
        </div>
        <div class="footer" part="footer">
          <slot name="footer"></slot>
        </div>
      `;
    }

    connectedCallback() {
        // After rendering, check the header and footer slots.
        const headerSlot = this.shadowRoot.querySelector('slot[name="header"]');
        const footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
        if (headerSlot) {
            headerSlot.addEventListener("slotchange", () =>
                this.checkSlot("header")
            );
            this.checkSlot("header");
        }
        if (footerSlot) {
            footerSlot.addEventListener("slotchange", () =>
                this.checkSlot("footer")
            );
            this.checkSlot("footer");
        }
    }
}

if (!customElements.get("kp-card")) {
    customElements.define("kp-card", KeplerCard);
}
