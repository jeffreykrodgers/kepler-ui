class KeplerMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
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

                // Use template if provided, otherwise default to label
                const content = item.template
                    ? this._renderTemplate(item.template, item)
                    : `<label>${item.label || ""}</label>`;

                return `
            <div class="menu-item ${isSelected ? "selected" : ""}" 
                data-index="${index}" 
                data-value="${item.value}">
                ${content}
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
            this.handleItemClick(e);
        });

        document.addEventListener("click", (e) => {
            if (!this.contains(e.target)) {
                this.hideMenu();
            }
        });
    }

    handleItemClick(e) {
        const itemEl = e.target.closest(".menu-item");
        if (!itemEl) return;

        const value = itemEl.getAttribute("data-value");
        const index = parseInt(itemEl.getAttribute("data-index"), 10);
        const items = this.items;

        // Ensure items is an array and index is within range
        if (
            !Array.isArray(items) ||
            isNaN(index) ||
            index < 0 ||
            index >= items.length
        ) {
            console.error("Invalid menu item index:", index, items);
            return;
        }

        const selectedItem = items[index];

        // Handle history-based navigation
        if (selectedItem && selectedItem.href) {
            if (selectedItem.history) {
                history.pushState({}, "", selectedItem.href);
                window.dispatchEvent(
                    new PopStateEvent("popstate", { state: {} })
                );
                this.hideMenu();
            } else {
                window.location.href = selectedItem.href;
            }
            return;
        }

        // Selection handling
        const trackingEnabled =
            this.getAttribute("track-selection") !== "false";
        if (trackingEnabled) {
            if (this.hasAttribute("multiple")) {
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

    _renderTemplate(slotId, item) {
        const clone = this._cloneTemplate(slotId);
        if (!clone) return "";

        Object.keys(item).forEach((key) => {
            const placeholder = clone.querySelector(`[data-${key}]`);
            if (placeholder) placeholder.textContent = item[key];
        });

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clone);
        return tempDiv.innerHTML;
    }

    _cloneTemplate(slotId) {
        const templateElement = this.querySelector(`[slot="${slotId}"]`);
        return templateElement && templateElement.content
            ? document.importNode(templateElement.content, true)
            : null;
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

    get items() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]") || [];
        } catch (e) {
            console.error("Invalid JSON for items:", e);
            return [];
        }
    }

    set items(value) {
        if (Array.isArray(value)) {
            this.setAttribute("items", JSON.stringify(value));
            this.updateComponent(); // Ensure UI updates when items change
        } else {
            console.error("KeplerMenu: items must be an array.");
        }
    }
}

if (!customElements.get("kp-menu")) {
    customElements.define("kp-menu", KeplerMenu);
}
