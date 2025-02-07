class KeplerCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: flex;
              flex-direction: column;
              border: var(--border-medium, 2px) solid var(--base-border, #ccc);
              overflow: hidden;
            }
            .header,
            .footer {
              background: var(--base-border, #ccc);
              padding: var(--spacing-x-large, 8px);
            }
            .header {
              border-bottom: var(--border-medium, 2px) solid var(--base-border, #ccc);
            }
            .footer {
              border-top: var(--border-medium, 2px) solid var(--base-border, #ccc);
            }
            .content {
              position: relative;
              /* Increase top and bottom padding to account for the 10px high pattern */
              padding: 26px 16px 26px 16px;
              flex: 1;
            }
            /* Diagonal pattern at the top of the content */
            .content::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 10px;
              background: repeating-linear-gradient(
                -45deg,
                var(--base-border, #ccc) 0,
                var(--base-border, #ccc) 2px,
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
                var(--base-border, #ccc) 0,
                var(--base-border, #ccc) 2px,
                transparent 3px,
                transparent 10px
              );
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
        // After rendering, set up slotchange listeners on the header and footer slots.
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

    // Checks if the given slot (by name) has meaningful content.
    checkSlot(slotName) {
        const slotElement = this.shadowRoot.querySelector(
            `slot[name="${slotName}"]`
        );
        const assignedNodes = slotElement
            .assignedNodes({ flatten: true })
            .filter((node) => {
                // Filter out empty text nodes.
                return (
                    node.nodeType !== Node.TEXT_NODE ||
                    node.textContent.trim() !== ""
                );
            });
        const container = this.shadowRoot.querySelector(`.${slotName}`);
        if (assignedNodes.length === 0) {
            // Hide the container if no content.
            container.style.display = "none";
        } else {
            container.style.display = "";
        }
    }
}

if (!customElements.get("kp-card")) {
    customElements.define("kp-card", KeplerCard);
}
