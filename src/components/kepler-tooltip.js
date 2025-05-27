import { injectGlobalFonts } from "../modules/helpers.js";

class KeplerTooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        injectGlobalFonts();
        this.render();
        this._timeoutId = null;
        this._boundReposition = this._reposition.bind(this);
    }

    static get observedAttributes() {
        return ["anchor", "position", "align", "trigger", "time"];
    }

    getContainer(selector, multiple) {
        const method = multiple ? "querySelectorAll" : "querySelector";
        return window.__routerShadowRoot
            ? window.__routerShadowRoot[method](selector)
            : document[method](selector);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.updateComponent();
        }
    }

    connectedCallback() {
        this.updateComponent();
        this.addEventListeners();

        // Listen for scroll/resize to reposition the tooltip.
        window.addEventListener("scroll", this._boundReposition, true);
        window.addEventListener("resize", this._boundReposition);

        // Observe the anchor for changes.
        const anchor = this.getAnchor();
        if (anchor) {
            this.anchorObserver = new MutationObserver(() => {
                this.positionTooltip(anchor);
            });
            this.anchorObserver.observe(anchor, {
                attributes: true,
                childList: true,
                subtree: true,
            });
        }
    }

    disconnectedCallback() {
        window.removeEventListener("scroll", this._boundReposition, true);
        window.removeEventListener("resize", this._boundReposition);

        if (this.anchorObserver) {
            this.anchorObserver.disconnect();
        }
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
        }
    }

    getAnchor() {
        const anchorSelector = this.getAttribute("anchor");
        return anchorSelector ? this.getContainer(anchorSelector) : null;
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: none;
            position: fixed;
            box-sizing: border-box;
            padding: var(--spacing-medium, 8px);
            background: var(--base-text--, rgba(29,29,29,1));
            max-width: 200px;
            z-index: 1000;
            font-family: Tomorrow, monospace;
            font-size: var(--size-p, 1em);
            line-height: 1.4;
          }
          .tooltip-content {
            display: block;
            color: var(--base-surface, rgba(241,246,250,1));
          }
          .tooltip-pointer {
            position: absolute;
            width: 10px;
            height: 10px;
            background: var(--tooltip-bg, var(--base-text--, rgba(29,29,29,1)));
            transform: rotate(45deg);
          }
        </style>
        <div class="tooltip-content" part="tooltip-content">
          <slot></slot>
        </div>
        <div class="tooltip-pointer" part="tooltip-pointer"></div>
      `;
        this.pointer = this.shadowRoot.querySelector(".tooltip-pointer");
    }

    updateComponent() {
        const anchor = this.getAnchor();
        if (anchor) {
            this.positionTooltip(anchor);
        }
    }

    addEventListeners() {
        const anchor = this.getAnchor();
        if (!anchor) return;
        const trigger = this.getAttribute("trigger") || "hover";
        if (trigger === "hover") {
            anchor.addEventListener("mouseover", () => {
                this.showTooltip();
            });
            anchor.addEventListener("mouseout", () => {
                this.hideTooltip();
            });
        } else if (trigger === "click") {
            anchor.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.style.display === "block") {
                    this.hideTooltip();
                } else {
                    this.showTooltip();
                }
            });
        }
    }

    showTooltip() {
        const anchor = this.getAnchor();
        if (!anchor) return;

        this.style.display = "block";
        this.positionTooltip(anchor);

        const timeAttr = this.getAttribute("time");

        if (timeAttr && !isNaN(parseInt(timeAttr, 10))) {
            const duration = parseInt(timeAttr, 10);

            if (this._timeoutId) clearTimeout(this._timeoutId);

            this._timeoutId = setTimeout(() => {
                this.hideTooltip();
            }, duration);
        }
    }

    hideTooltip() {
        this.style.display = "none";

        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }

    positionTooltip(anchor) {
        if (!anchor) return;
        const position = this.getAttribute("position") || "bottom";
        const align = this.getAttribute("align") || "start";
        const margin = 8; // 8px margin between anchor and tooltip.
        const anchorRect = anchor.getBoundingClientRect();
        const tooltipRect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let top = 0,
            left = 0;

        if (position === "top") {
            top = anchorRect.top - tooltipRect.height - margin;
            if (align === "start") {
                left = anchorRect.left;
            } else if (align === "center") {
                left =
                    anchorRect.left +
                    (anchorRect.width - tooltipRect.width) / 2;
            } else if (align === "end") {
                left = anchorRect.right - tooltipRect.width;
            }
        } else if (position === "bottom") {
            top = anchorRect.bottom + margin;
            if (align === "start") {
                left = anchorRect.left;
            } else if (align === "center") {
                left =
                    anchorRect.left +
                    (anchorRect.width - tooltipRect.width) / 2;
            } else if (align === "end") {
                left = anchorRect.right - tooltipRect.width;
            }
        } else if (position === "left") {
            left = anchorRect.left - tooltipRect.width - margin;
            if (align === "start") {
                top = anchorRect.top;
            } else if (align === "center") {
                top =
                    anchorRect.top +
                    (anchorRect.height - tooltipRect.height) / 2;
            } else if (align === "end") {
                top = anchorRect.bottom - tooltipRect.height;
            }
        } else if (position === "right") {
            left = anchorRect.right + margin;
            if (align === "start") {
                top = anchorRect.top;
            } else if (align === "center") {
                top =
                    anchorRect.top +
                    (anchorRect.height - tooltipRect.height) / 2;
            } else if (align === "end") {
                top = anchorRect.bottom - tooltipRect.height;
            }
        }

        // Constrain within viewport.
        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > viewportHeight) {
            top = viewportHeight - tooltipRect.height - 10;
        }
        if (left < 10) left = 10;
        if (top < 10) top = 10;

        this.style.top = `${top}px`;
        this.style.left = `${left}px`;

        // Update pointer position.
        this.updatePointer(position, align, tooltipRect);
    }

    updatePointer(position, align, tooltipRect) {
        const pointerSize = 10; // 10x10 square.
        // Reset pointer inline styles for all sides.
        this.pointer.style.top = "";
        this.pointer.style.bottom = "";
        this.pointer.style.left = "";
        this.pointer.style.right = "";

        if (position === "top") {
            // Tooltip above anchor: pointer along the bottom edge.
            this.pointer.style.bottom = `-5px`;
            if (align === "start") {
                this.pointer.style.left = `10px`;
            } else if (align === "center") {
                this.pointer.style.left = `${(tooltipRect.width - pointerSize) / 2}px`;
            } else if (align === "end") {
                this.pointer.style.left = `${tooltipRect.width - pointerSize - 10}px`;
            }
        } else if (position === "bottom") {
            // Tooltip below anchor: pointer along the top edge.
            this.pointer.style.top = `-5px`;
            if (align === "start") {
                this.pointer.style.left = `10px`;
            } else if (align === "center") {
                this.pointer.style.left = `${(tooltipRect.width - pointerSize) / 2}px`;
            } else if (align === "end") {
                this.pointer.style.left = `${tooltipRect.width - pointerSize - 10}px`;
            }
        } else if (position === "left") {
            // Tooltip to the left of anchor: pointer on the right edge.
            this.pointer.style.right = `-5px`;
            if (align === "start") {
                this.pointer.style.top = `10px`;
            } else if (align === "center") {
                this.pointer.style.top = `${(tooltipRect.height - pointerSize) / 2}px`;
            } else if (align === "end") {
                this.pointer.style.top = `${tooltipRect.height - pointerSize - 10}px`;
            }
        } else if (position === "right") {
            // Tooltip to the right of anchor: pointer on the left edge.
            this.pointer.style.left = `-5px`;
            if (align === "start") {
                this.pointer.style.top = `10px`;
            } else if (align === "center") {
                this.pointer.style.top = `${(tooltipRect.height - pointerSize) / 2}px`;
            } else if (align === "end") {
                this.pointer.style.top = `${tooltipRect.height - pointerSize - 10}px`;
            }
        }
    }

    _reposition() {
        const anchor = this.getAnchor();
        if (anchor && this.style.display === "block") {
            this.positionTooltip(anchor);
        }
    }
}

if (!customElements.get("kp-tooltip")) {
    customElements.define("kp-tooltip", KeplerTooltip);
}
