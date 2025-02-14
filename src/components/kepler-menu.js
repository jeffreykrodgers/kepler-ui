class KeplerMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.selectedValues = new Set();
    }

    static get observedAttributes() {
        return [
            "anchor",
            "position",
            "align",
            "items",
            "multiple",
            "value",
            "track-selection",
        ];
    }

    getContainer(selector, multiple) {
        const method = multiple ? "querySelectorAll" : "querySelector";
        return window.__routerShadowRoot
            ? window.__routerShadowRoot[method](selector)
            : document[method](selector);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                this.value = newValue; // Update property when the value attribute changes
            } else {
                this.updateComponent();
            }
        }
    }

    connectedCallback() {
        this.updateComponent();
        this.addEventListeners();

        // Observe the anchor for changes (e.g., when re-rendered dynamically)
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                this.anchorObserver = new MutationObserver(() => {
                    this.positionMenu(anchor);
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
        if (this.anchorObserver) {
            this.anchorObserver.disconnect();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: none;
                position: absolute;
                box-sizing: border-box;
                background: var(--base-text--, rgba(29,29,29,1));
                z-index: 10;
                max-height: 200px;
                overflow-y: auto;
                box-shadow: var(--shadow-medium, 0 4px 8px rgba(0, 0, 0, 0.2));
            }
            .menu-item {
                padding: var(--spacing-medium, 8px);
                font-size: var(--font-size, 16px);
                font-family: Tomorrow, sans-serif;
                color: var(--base-surface, rgba(241,246,250,1));
                background: var(--base-text--, rgba(29,29,29,1));
                cursor: pointer;
                transition: background-color 0.2s ease, color 0.2s ease;
            }
            .menu-item:hover {
                background: var(--base-text-emphasize, rgba(56,56,57,1));
            }
            .menu-item.selected {
                background: var(--primary--, rgba(4,134,209,1));
                color: var(--primary-background--, rgba(245,250,250,1));
            }
        </style>
        <div id="menuContainer" part="menuContainer"></div>
      `;
    }

    updateComponent() {
        let items = [];
        try {
            items = JSON.parse(this.getAttribute("items") || "[]");
        } catch (err) {
            console.error("KeplerMenu: invalid items JSON", err);
        }

        const trackingEnabled =
            this.getAttribute("track-selection") !== "false";
        if (trackingEnabled && this.hasAttribute("value")) {
            const valueAttr = this.getAttribute("value");
            if (this.hasAttribute("multiple")) {
                this.selectedValues = new Set(
                    valueAttr.split(",").map((val) => val.trim())
                );
            } else {
                this.selectedValues = new Set([valueAttr.trim()]);
            }
        }

        const container = this.shadowRoot.querySelector("#menuContainer");
        container.innerHTML = items
            .map((item, index) => {
                const isSelected =
                    trackingEnabled &&
                    this.selectedValues.has(String(item.value));
                return `
                    <div class="menu-item ${isSelected ? "selected" : ""}" data-index="${index}" data-value="${item.value}">
                        <label>${item.label || ""}</label>
                    </div>
                `;
            })
            .join("");
    }

    addEventListeners() {
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                anchor.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (this.style.display === "block") {
                        this.hideMenu();
                    } else {
                        this.showMenu();
                        this.positionMenu(anchor);
                    }
                });
            }
        }

        this.shadowRoot.addEventListener("click", (e) => {
            const itemEl = e.target.closest(".menu-item");
            if (itemEl) {
                const value = itemEl.getAttribute("data-value");
                let items = [];
                try {
                    items = JSON.parse(this.getAttribute("items") || "[]");
                } catch (err) {
                    console.error("KeplerMenu: invalid items JSON", err);
                }
                const index = itemEl.getAttribute("data-index");
                const selectedItem = items[index];

                if (selectedItem && selectedItem.href) {
                    window.location.href = selectedItem.href;
                    return;
                }

                const trackingEnabled =
                    this.getAttribute("track-selection") !== "false";
                const isMultiple = this.hasAttribute("multiple");

                if (trackingEnabled) {
                    if (isMultiple) {
                        if (this.selectedValues.has(value)) {
                            this.selectedValues.delete(value);
                            itemEl.classList.remove("selected");
                        } else {
                            this.selectedValues.add(value);
                            itemEl.classList.add("selected");
                        }
                    } else {
                        this.shadowRoot
                            .querySelectorAll(".menu-item.selected")
                            .forEach((el) => el.classList.remove("selected"));
                        itemEl.classList.add("selected");
                        this.selectedValues = new Set([value]);
                        this.hideMenu();
                    }
                    this.setAttribute("value", this.value);
                    this.updateComponent();

                    this.dispatchEvent(
                        new CustomEvent("select", {
                            detail: {
                                value,
                                item: selectedItem,
                                valueList: this.value,
                            },
                            bubbles: true,
                            composed: true,
                        })
                    );
                }
            }
        });

        document.addEventListener("click", (e) => {
            if (!this.contains(e.target)) {
                this.hideMenu();
            }
        });
    }

    toggleMenu() {
        if (this.style.display === "none" || this.style.display === "") {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    showMenu() {
        this.getContainer("kp-menu", true).forEach((menu) => {
            if (menu !== this) {
                menu.hideMenu();
            }
        });

        this.style.display = "block";

        const anchorSelector = this.getAttribute("anchor");
        const anchor = this.getContainer(anchorSelector);
        if (anchor) {
            this.positionMenu(anchor);
            this.scrollHandler = () =>
                requestAnimationFrame(() => this.positionMenu(anchor));
            window.addEventListener("scroll", this.scrollHandler, true);
            window.addEventListener("resize", this.scrollHandler);
        }
    }

    hideMenu() {
        this.style.display = "none";
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler, true);
            window.removeEventListener("resize", this.scrollHandler);
        }
    }

    positionMenu(anchor) {
        if (!anchor) return;

        const anchorRect = anchor.getBoundingClientRect();
        const menuRect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const position = this.getAttribute("position") || "bottom";
        const align = this.getAttribute("align") || "start";

        let top = anchorRect.bottom;
        let left = anchorRect.left;

        if (position === "top") {
            top = anchorRect.top - menuRect.height;
        }
        if (align === "end") {
            left = anchorRect.right - menuRect.width;
        } else if (align === "center") {
            left = anchorRect.left + (anchorRect.width - menuRect.width) / 2;
        }

        if (left + menuRect.width > viewportWidth) {
            left = viewportWidth - menuRect.width - 10;
        }
        if (top + menuRect.height > viewportHeight) {
            top = viewportHeight - menuRect.height - 10;
        }
        if (left < 10) left = 10;
        if (top < 10) top = 10;

        this.style.position = "fixed";
        this.style.top = `${top}px`;
        this.style.left = `${left}px`;

        if (!this.style.width) {
            let maxWidth = 0;
            this.shadowRoot.querySelectorAll(".menu-item").forEach((item) => {
                maxWidth = Math.max(maxWidth, item.offsetWidth);
            });
            this.style.width = `${maxWidth}px`;
        }
    }

    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            return this.selectedValues.size
                ? Array.from(this.selectedValues)[0]
                : "";
        }
    }

    set value(newVal) {
        if (this.hasAttribute("multiple")) {
            if (typeof newVal === "string") {
                this.selectedValues = new Set(
                    newVal.split(",").map((s) => s.trim())
                );
            } else if (Array.isArray(newVal)) {
                this.selectedValues = new Set(newVal);
            }
        } else {
            if (typeof newVal === "string") {
                this.selectedValues = new Set([newVal.trim()]);
            } else {
                this.selectedValues = new Set();
            }
        }
        this.updateComponent();
    }
}

if (!customElements.get("kp-menu")) {
    customElements.define("kp-menu", KeplerMenu);
}
