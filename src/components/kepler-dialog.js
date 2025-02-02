class KeplerDialog extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.attachEvents();
        this.updateVisibility();
    }

    static get observedAttributes() {
        return ["title", "closable", "visible", "cover"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "title" || name === "closable" || name === "cover") {
                this.render();
            }
            if (name === "visible") {
                this.updateVisibility();
            }
        }
    }

    get visible() {
        return this.getAttribute("visible") === "true";
    }

    set visible(val) {
        this.setAttribute("visible", val ? "true" : "false");
    }

    updateVisibility() {
        // When visible, add a "visible" class to fade in; otherwise fade out.
        if (this.getAttribute("visible") === "true") {
            this.classList.add("visible");
        } else {
            this.classList.remove("visible");
        }
    }

    render() {
        const title = this.getAttribute("title") || "";
        const isClosable = this.hasAttribute("closable");
        const hasCover = this.hasAttribute("cover");
        // The host covers the entire viewport.
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            /* For animation */
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.1s ease;
          }
          :host(.visible) {
            opacity: 1;
            pointer-events: auto;
          }
          .cover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1;
          }
          .dialog {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            width: 400px;
            background: var(--base-surface, #fff);
            border: var(--border-medium, 2px) solid var(--base-border, #ccc);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            font-family: Tomorrow, sans-serif;
          }
          .header, .footer {
            background: var(--base-border, #ccc);
            padding: var(--spacing-medium, 8px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: ProFontWindows, sans-serif;
            font-size: 20px;
            font-weight: 500;
          }
          .header {
            border-bottom: var(--border-medium, 2px) solid var(--base-border, #ccc);
          }
          .footer {
            border-top: var(--border-medium, 2px) solid var(--base-border, #ccc);
          }
          .content {
            position: relative;
            padding: 26px 16px;
            flex: 1;
            overflow-y: auto;
          }
          .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin: 0;
            line-height: 1;
            color: var(--base-text--, #333);
          }
          .close-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
          }
        </style>
        ${hasCover ? `<div class="cover"></div>` : ""}
        <div class="dialog">
          <div class="header" part="header">
            <span class="title">${title}</span>
            ${
                isClosable
                    ? `<button class="close-btn" aria-label="Close dialog">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M6 6 L14 14 M14 6 L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>`
                    : ""
            }
          </div>
          <div class="content" part="content">
            <slot></slot>
          </div>
          <div class="footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      `;
    }

    attachEvents() {
        // Close the dialog when the close button is clicked.
        this.shadowRoot.addEventListener("click", (e) => {
            if (e.target.closest(".close-btn")) {
                this.close();
            }
        });
        // Listen for the Escape key.
        this._keydownHandler = (e) => {
            if (e.key === "Escape") {
                this.close();
            }
        };
        document.addEventListener("keydown", this._keydownHandler);
    }

    close() {
        this.dispatchEvent(
            new CustomEvent("close", { bubbles: true, composed: true })
        );
        this.visible = false;
    }
}

customElements.define("kp-dialog", KeplerDialog);
