class KeplerDrawer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.attachEvents();
    }

    static get observedAttributes() {
        return ["position", "open", "grabber", "cover"];
    }

    get open() {
        return this.getAttribute("open") === "true";
    }

    set open(value) {
        this.setAttribute("open", value ? "true" : "false");
        this.handleCover();
    }

    attachEvents() {
        this.shadowRoot.addEventListener("click", (e) => {
            if (e.target.closest(".grab-bar")) {
                this.toggleDrawer();
            }
            if (e.target.classList.contains("drawer-cover")) {
                this.toggleDrawer();
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            if (name === "open" || name === "cover") {
                this.handleCover();
            }
        }
    }

    toggleDrawer() {
        this.open = !this.open;
    }

    handleCover() {
        if (this.hasAttribute("cover")) {
            if (this.open) {
                if (!this._externalCover) {
                    this._externalCover = document.createElement("div");
                    this._externalCover.className = "drawer-cover";
                    Object.assign(this._externalCover.style, {
                        position: "fixed",
                        top: "0",
                        left: "0",
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0, 0, 0, 0.5)",
                        opacity: "1",
                        pointerEvents: "auto",
                        transition: "opacity 0.3s ease-in-out",
                        zIndex: "99",
                    });
                    this._externalCover.addEventListener("click", () =>
                        this.toggleDrawer()
                    );
                    document.body.appendChild(this._externalCover);
                }
            } else {
                if (this._externalCover && this._externalCover.parentNode) {
                    this._externalCover.parentNode.removeChild(
                        this._externalCover
                    );
                    this._externalCover = null;
                }
            }
        }
    }

    render() {
        const position = this.getAttribute("position") || "left";
        const arrowDirections = {
            left: "left",
            right: "right",
            top: "up",
            bottom: "down",
        };
        const isOpen = this.open;
        const hasGrabber = this.hasAttribute("grabber");
        const arrowDirection = isOpen
            ? arrowDirections[position]
            : this.getOppositeDirection(position);

        this.shadowRoot.innerHTML = `
        <style>
          :host {
            position: fixed;
            ${this.getPositionStyles(position)}
            ${this.getSizeStyles(position)}
            background: var(--base-surface, rgba(241,246,250,1));
            transition: transform 0.3s ease-in-out;
            ${isOpen ? "transform: translate(0, 0);" : this.getHiddenTransform(position)}
            z-index: 100;
          }
          .drawer-content {
            position: absolute;
            z-index: 100;
            background: var(--base-surface, rgba(241,246,250,1));
            border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            border-width: ${this.getGrabberBorderWidth(position)};
            height: 100%;
            width: 100%;
          }
          .grab-bar {
            position: absolute;
            ${this.getGrabberStyles(position)}
            width: ${position === "top" || position === "bottom" ? "100%" : "30px"};
            height: ${position === "left" || position === "right" ? "100%" : "30px"};
            background: var(--base-surface, rgba(241,246,250,1));
            border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            border-width: ${this.getGrabberBorderWidth(position)};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 101;
          }
          .grab-bar svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
          }
        </style>
        ${
            hasGrabber
                ? `<div class="grab-bar" part="grab-bar">
                 ${this.getDoubleArrowSvg(arrowDirection)}
               </div>`
                : ""
        }
        <div class="drawer-content" part="drawer-content">
          <slot></slot>
        </div>
      `;
    }

    getPositionStyles(position) {
        switch (position) {
            case "right":
                return "right: 0; top: 0;";
            case "top":
                return "top: 0; left: 0;";
            case "bottom":
                return "bottom: 0; left: 0;";
            default:
                return "left: 0; top: 0;";
        }
    }

    getSizeStyles(position) {
        return position === "top" || position === "bottom"
            ? "width: 100vw; height: 250px;"
            : "width: 250px; height: 100vh;";
    }

    getHiddenTransform(position) {
        switch (position) {
            case "right":
                return "transform: translateX(100%);";
            case "top":
                return "transform: translateY(-100%);";
            case "bottom":
                return "transform: translateY(100%);";
            default:
                return "transform: translateX(-100%);";
        }
    }

    getGrabberBorderWidth(position) {
        switch (position) {
            case "right":
                return "0 0 0 var(--border-medium, 2px)";
            case "left":
                return "0 var(--border-medium, 2px) 0 0";
            case "top":
                return "0 0 var(--border-medium, 2px) 0";
            case "bottom":
                return "var(--border-medium, 2px) 0 0 0";
        }
    }

    getGrabberStyles(position) {
        switch (position) {
            case "right":
                return "left: -34px; height: 100%;";
            case "top":
                return "bottom: -34px; width: 100%; height: 32px;";
            case "bottom":
                return "top: -34px; width: 100%; height: 32px;";
            default:
                return "right: -34px; height: 100%;";
        }
    }

    getOppositeDirection(position) {
        switch (position) {
            case "right":
                return "left";
            case "left":
                return "right";
            case "top":
                return "down";
            case "bottom":
                return "up";
        }
    }

    getDoubleArrowSvg(direction) {
        const arrows = {
            left: "M4 10 L10 5 M4 10 L10 15 M10 10 L16 5 M10 10 L16 15",
            right: "M16 10 L10 5 M16 10 L10 15 M10 10 L4 5 M10 10 L4 15",
            up: "M10 4 L5 10 M10 4 L15 10 M10 10 L5 16 M10 10 L15 16",
            down: "M10 16 L5 10 M10 16 L15 10 M10 10 L5 4 M10 10 L15 4",
        };
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="${arrows[direction]}" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>`;
    }
}

if (!customElements.get("kp-drawer")) {
    customElements.define("kp-drawer", KeplerDrawer);
}
