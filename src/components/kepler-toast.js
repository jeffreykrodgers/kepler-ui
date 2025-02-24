class KeplerToast extends HTMLElement {
    constructor() {
        super();
        // We still use shadow DOM for container styling,
        // but toast notifications are added as light-DOM children.
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["position", "alignment"];
    }

    // Return the position ("top" or "bottom"). Default: bottom.
    get position() {
        return this.getAttribute("position") || "bottom";
    }

    // Return the alignment ("left", "center", "right"). Default: right.
    get alignment() {
        return this.getAttribute("alignment") || "right";
    }

    connectedCallback() {
        // Ensure the toast container is attached to document.body so that its fixed positioning is not affected by parent elements.
        if (this.parentNode !== document.body) {
            document.body.appendChild(this);
        }
    }

    render() {
        // The shadow DOM here only styles the toast container.
        // Toast notifications are projected via a default slot.
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              position: fixed;
              z-index: 9999;
              pointer-events: none;
            }
            /* Positioning based on attributes */
            :host([position="top"]) {
              top: var(--spacing-2x-large, 16px);
            }
            :host([position="bottom"]) {
              bottom: var(--spacing-2x-large, 16px);
            }
            :host([alignment="left"]) {
              left: var(--spacing-2x-large, 16px);
            }
            :host([alignment="center"]) {
              left: 50%;
              transform: translateX(-50%);
            }
            :host([alignment="right"]) {
              right: var(--spacing-2x-large, 16px);
            }
            .toast-container {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-medium, 8px);
              pointer-events: auto;
            }
            /* For bottom notifications, reverse order so new ones appear at the bottom */
            :host([position="bottom"]) .toast-container {
              flex-direction: column-reverse;
            }
            /* Styles for toast notifications (applied to slotted elements) */
            ::slotted(.toast) {
              min-width: 200px;
              max-width: 300px;
              padding: 10px 15px;
              border-radius: var(--border-radius-small, 1px);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              margin: 5px 0;
              pointer-events: auto;
              opacity: 0;
              transform: translateY(20px);
              transition: opacity 0.3s ease, transform 0.3s ease;
              color: var(--base-surface, rgba(241,246,250,1));
            }
            ::slotted(.toast.show) {
              opacity: 1;
              transform: translateY(0);
            }
            ::slotted(.toast.closable) {
              cursor: pointer;
            }
            /* Default style types */
            ::slotted(.toast.base) { background: var(--base-text--); }
            ::slotted(.toast.primary) { background: var(--primary--, rgba(4,134,209,1)); }
            ::slotted(.toast.secondary) { background: var(--secondary--, rgba(29,29,29,1)); }
            ::slotted(.toast.success) { background: var(--success--, rgba(45,186,115,1)); }
            ::slotted(.toast.warning) { background: var(--warning--, rgba(209,161,4,1)); }
            ::slotted(.toast.error) { background: var(--error--, rgba(217,4,40,1)); }
          </style>
          <div class="toast-container" part="toast-container">
            <slot></slot>
          </div>
        `;
    }

    /**
     * Public method to display a toast notification.
     * @param {Object} detail - Options for the toast:
     *  - color: one of [base, primary, secondary, success, warning, error] (default: base)
     *  - duration: duration in milliseconds (default: 3000)
     *  - closable: if true, clicking dismisses the toast (default: false)
     *  - template: string name of a slot on a <template> child for custom content
     *  - message: text to insert (replacing any element with data-message in the template)
     */
    pop(detail = {}) {
        const styleType = detail.color || "base";
        const duration = detail.duration || 3000;
        const closable = detail.closable || false;
        const templateName = detail.template;
        const message = detail.message || "";

        // Create a new toast element as a light-DOM element.
        const toast = document.createElement("div");
        toast.part = "toast";
        toast.classList.add("toast", styleType);
        if (closable) toast.classList.add("closable");

        // Use a template if provided; otherwise, set text content.
        if (templateName) {
            const templateElement = this.querySelector(
                `[slot="${templateName}"]`
            );
            if (templateElement && templateElement.content) {
                const clone = document.importNode(
                    templateElement.content,
                    true
                );
                // Replace the text of an element with data-message if present.
                const messagePlaceholder =
                    clone.querySelector("[data-message]");
                if (messagePlaceholder) {
                    messagePlaceholder.textContent = message;
                }
                toast.appendChild(clone);
            } else {
                toast.textContent = message;
            }
        } else {
            toast.textContent = message;
        }

        // If the toast is closable, remove it on click.
        if (closable) {
            toast.addEventListener("click", () => this.removeToast(toast));
        }

        // Append the new toast as a light-DOM child.
        this.appendChild(toast);
        // Force reflow so the transition is applied.
        void toast.offsetWidth;
        toast.classList.add("show");

        // Automatically remove the toast after the specified duration.
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        toast.classList.remove("show");
        toast.addEventListener(
            "transitionend",
            () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            },
            { once: true }
        );
    }
}

if (!customElements.get("kp-toast")) {
    customElements.define("kp-toast", KeplerToast);
}
