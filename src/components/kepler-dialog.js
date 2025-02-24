class KeplerDialog extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
        this.render();
        this.attachEvents();
        this.updateVisibility();
    }

    static get observedAttributes() {
        return ["title", "closable", "visible", "cover", "anchor"];
    }

    getContainer(selector, multiple) {
        const method = multiple ? "querySelectorAll" : "querySelector";
        return window.__routerShadowRoot
            ? window.__routerShadowRoot[method](selector)
            : document[method](selector);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "title" || name === "closable" || name === "cover") {
                this.render();
            }
            if (name === "visible") {
                this.updateVisibility();
            }
            if (name === "anchor") {
                this.setupAnchor();
            }
        }
    }

    connectedCallback() {
        this.setupAnchor();
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                this.anchorObserver = new MutationObserver(() => {
                    this.setupAnchor();
                });
                this.anchorObserver.observe(anchor, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                });
            }
        }
    }

    disconnectedCallback() {
        document.removeEventListener("keydown", this._keydownHandler);
        if (this._anchor && this._openHandler) {
            this._anchor.removeEventListener("click", this._openHandler);
        }
        if (this.anchorObserver) {
            this.anchorObserver.disconnect();
        }
    }

    get visible() {
        return this.getAttribute("visible") === "true";
    }

    set visible(val) {
        this.setAttribute("visible", val ? "true" : "false");
    }

    updateVisibility() {
        if (this.getAttribute("visible") === "true") {
            this.classList.add("visible");
        } else {
            this.classList.remove("visible");
        }
    }

    injectGlobalFonts() {
        if (document.getElementById("kepler-fonts")) return; // Prevent duplicate injection

        const fontCSS = `
            @font-face {
                font-family: "ProFontWindows";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/ProFontWindows.woff2") format("woff2");
                font-display: swap;
            }

            @font-face {
                font-family: "Tomorrow";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/Tomorrow-Regular.woff2") format("woff2");
                font-display: swap;
            }

            @font-face {
                font-family: "Tomorrow";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/Tomorrow-Bold.woff2") format("woff2");
                font-weight: bold;
                font-display: swap;
            }
        `;

        const styleTag = document.createElement("style");
        styleTag.id = "kepler-fonts";
        styleTag.textContent = fontCSS;
        document.head.appendChild(styleTag);
    }

    render() {
        const title = this.getAttribute("title") || "";
        const isClosable = this.hasAttribute("closable");
        const hasCover = this.hasAttribute("cover");
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
            background: var(--base-surface, var(--neutral-1, rgba(241,246,250,1)));
            border: var(--border-medium, 2px) solid var(--base-border, var(--neutral-2, rgba(215,219,222,1)));
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            font-family: Tomorrow, sans-serif;
          }
          .header, .footer {
            background: var(--base-border, var(--neutral-2, rgba(215,219,222,1)));
            padding: var(--spacing-medium, 8px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: ProFontWindows, sans-serif;
            font-size: 20px;
            font-weight: 500;
          }
          .header {
            border-bottom: var(--border-medium, 2px) solid var(--base-border, var(--neutral-2, rgba(215,219,222,1)));
          }
          .footer {
            border-top: var(--border-medium, 2px) solid var(--base-border, var(--neutral-2, rgba(215,219,222,1)));
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
            color: var(--base-text--, var(--neutral-9, rgba(29,29,29,1)));
          }
          .close-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
          }
        </style>
        ${hasCover ? `<div class="cover"></div>` : ""}
        <div class="dialog" part="dialog">
          <div class="header" part="header">
            <span class="title" part="title">${title}</span>
            ${
                isClosable
                    ? `<button class="close-btn" aria-label="Close dialog" part="close-btn">
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
        this.shadowRoot.addEventListener("click", (e) => {
            if (e.target.closest(".close-btn")) {
                this.close();
            } else if (e.target.classList.contains("cover")) {
                this.close();
            }
        });

        this._keydownHandler = (e) => {
            if (e.key === "Escape") {
                this.close();
            }
        };
        document.addEventListener("keydown", this._keydownHandler);
    }

    setupAnchor() {
        if (this._anchor && this._openHandler) {
            this._anchor.removeEventListener("click", this._openHandler);
            this._anchor = null;
        }
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                this._openHandler = this._openDialog.bind(this);
                anchor.addEventListener("click", this._openHandler);
                this._anchor = anchor;
            }
        }
    }

    _openDialog(e) {
        e.preventDefault();
        this.visible = true;
    }

    close() {
        this.dispatchEvent(
            new CustomEvent("close", { bubbles: true, composed: true })
        );
        this.visible = false;
    }
}

if (!customElements.get("kp-dialog")) {
    customElements.define("kp-dialog", KeplerDialog);
}
