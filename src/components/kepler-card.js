class KeplerCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["basic"];
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

    render() {
        const showPatterns = !this.basic;

        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: flex;
              flex-direction: column;
              border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            }
            .header,
            .footer {
              background: var(--base-border, rgba(215,219,222,1));
              padding: var(--spacing-x-large, 12px);
            }
            .header {
              border-bottom: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            }
            .footer {
              border-top: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            }
            .content {
              position: relative;
              padding: 26px 16px 26px 16px;
              flex: 1;
            }
            /* Diagonal pattern at the top of the content */
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
                var(--base-border, rgba(215,219,222,1)) 0,
                var(--base-border, rgba(215,219,222,1)) 2px,
                transparent 3px,
                transparent 10px
              );
            }
            /* Diagonal pattern at the bottom of the content */
            .content::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 10px;
              background: repeating-linear-gradient(
                -45deg,
                var(--base-border, rgba(215,219,222,1)) 0,
                var(--base-border, rgba(215,219,222,1)) 2px,
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

    checkSlot(slotName) {
        const slotElement = this.shadowRoot.querySelector(
            `slot[name="${slotName}"]`
        );
        const assignedNodes = slotElement
            .assignedNodes({ flatten: true })
            .filter((node) => {
                return (
                    node.nodeType !== Node.TEXT_NODE ||
                    node.textContent.trim() !== ""
                );
            });
        const container = this.shadowRoot.querySelector(`.${slotName}`);
        if (assignedNodes.length === 0) {
            container.style.display = "none";
        } else {
            container.style.display = "";
        }
    }
}

if (!customElements.get("kp-card")) {
    customElements.define("kp-card", KeplerCard);
}
