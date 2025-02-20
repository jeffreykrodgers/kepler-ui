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

    get items() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]");
        } catch (e) {
            console.error("Invalid JSON for items:", e);
            return [];
        }
    }
    set items(value) {
        if (Array.isArray(value)) {
            this.setAttribute("items", JSON.stringify(value));
        } else {
            console.error("items must be an array");
        }
        this.updateComponent();
    }

    /*
     * Utility to find an element in the document (or router shadow root).
     */
    getContainer(selector, multiple = false) {
        const method = multiple ? "querySelectorAll" : "querySelector";
        return window.__routerShadowRoot
            ? window.__routerShadowRoot[method](selector)
            : document[method](selector);
    }

    /*
     * Update the component when attributes change.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                this.value = newValue;
            } else {
                this.updateComponent();
            }
        }
    }

    /*
     * When the component is added to the DOM.
     */
    connectedCallback() {
        this.updateComponent();
        this.addEventListeners();
        this.setupAnchorObserver();
    }

    /*
     * When the component is removed from the DOM.
     */
    disconnectedCallback() {
        if (this.anchorObserver) {
            this.anchorObserver.disconnect();
        }
    }

    /*
     * Inject global fonts (if not already added).
     */
    injectGlobalFonts() {
        if (document.getElementById("kepler-fonts")) return;

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

    /*
     * Render the basic structure and styling of the menu.
     */
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

    /*
     * Template helper: clone a <template> element with a specific slot id.
     */
    _cloneTemplate(slotId) {
        const templateElement = this.querySelector(`[slot="${slotId}"]`);
        return templateElement && templateElement.content
            ? document.importNode(templateElement.content, true)
            : null;
    }

    /*
     * Template helper: render a custom template by replacing placeholders with item data.
     */
    _renderTemplate(slotId, item) {
        const clone = this._cloneTemplate(slotId);
        if (!clone) return null;

        Object.keys(item).forEach((key) => {
            const placeholder = clone.querySelector(`[data-${key}]`);
            if (placeholder) {
                placeholder.textContent = item[key];
            }
        });
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clone);
        return tempDiv.innerHTML;
    }

    /*
     * Update the menu's inner HTML based on the items and current selection.
     */
    updateComponent() {
        let items = this.items;
        const trackingEnabled =
            this.getAttribute("track-selection") !== "false";

        // Update selectedValues based on the "value" attribute.
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
                const content = item.template
                    ? this._renderTemplate(item.template, item)
                    : `<label>${item.label || ""}</label>`;
                return `
          <div class="menu-item ${isSelected ? "selected" : ""}" data-index="${index}" data-value="${item.value}">
            ${content}
          </div>
        `;
            })
            .join("");
    }

    /*
     * Add all required event listeners.
     */
    addEventListeners() {
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                anchor.addEventListener(
                    "click",
                    this.handleAnchorClick.bind(this)
                );
            }
        }
        this.shadowRoot.addEventListener(
            "click",
            this.handleItemClick.bind(this)
        );
        document.addEventListener("click", this.handleDocumentClick.bind(this));
    }

    /*
     * Observe mutations on the anchor element to reposition the menu.
     */
    setupAnchorObserver() {
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = this.getContainer(anchorSelector);
            if (anchor) {
                this.anchorObserver = new MutationObserver(() =>
                    this.positionMenu(anchor)
                );
                this.anchorObserver.observe(anchor, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                });
            }
        }
    }

    /*
     * Handler for clicks on the anchor element (toggles the menu).
     */
    handleAnchorClick(e) {
        e.stopPropagation();
        const anchor = this.getContainer(this.getAttribute("anchor"));
        if (this.style.display === "block") {
            this.hideMenu();
        } else {
            this.showMenu();
            if (anchor) this.positionMenu(anchor);
        }
    }

    /*
     * Handler for clicks on menu items.
     */
    handleItemClick(e) {
        const itemEl = e.target.closest(".menu-item");
        if (!itemEl) return;

        const value = itemEl.getAttribute("data-value");
        const index = itemEl.getAttribute("data-index");
        const items = this.items;
        const selectedItem = items[index];

        // If the menu item is a link, handle navigation.
        if (selectedItem && selectedItem.href) {
            if (selectedItem.history) {
                history.pushState({}, "", selectedItem.href);
                window.dispatchEvent(
                    new PopStateEvent("popstate", { state: {} })
                );
                this.hideMenu(); // Close menu even in multiselect mode.
            } else {
                window.location.href = selectedItem.href;
            }
            return;
        }

        // Process selection if tracking is enabled.
        const trackingEnabled =
            this.getAttribute("track-selection") !== "false";
        const isMultiple = this.hasAttribute("multiple");
        if (trackingEnabled) {
            if (isMultiple) {
                // Toggle selection in multiselect mode.
                if (this.selectedValues.has(value)) {
                    this.selectedValues.delete(value);
                    itemEl.classList.remove("selected");
                } else {
                    this.selectedValues.add(value);
                    itemEl.classList.add("selected");
                }
            } else {
                // For single select, clear previous selection and close menu.
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

    /*
     * Handler for clicks outside the menu (to close the menu).
     */
    handleDocumentClick(e) {
        if (!this.contains(e.target)) {
            this.hideMenu();
        }
    }

    /*
     * Toggle menu visibility.
     */
    toggleMenu() {
        if (this.style.display === "none" || this.style.display === "") {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    /*
     * Display the menu, reposition it relative to the anchor, and attach scroll/resize listeners.
     */
    showMenu() {
        // Hide any other kp-menu components.
        this.getContainer("kp-menu", true).forEach((menu) => {
            if (menu !== this) menu.hideMenu();
        });
        this.style.display = "block";
        const anchor = this.getContainer(this.getAttribute("anchor"));
        if (anchor) {
            this.positionMenu(anchor);
            this.scrollHandler = () =>
                requestAnimationFrame(() => this.positionMenu(anchor));
            window.addEventListener("scroll", this.scrollHandler, true);
            window.addEventListener("resize", this.scrollHandler);
        }
    }

    /*
     * Hide the menu and remove scroll/resize listeners.
     */
    hideMenu() {
        this.style.display = "none";
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler, true);
            window.removeEventListener("resize", this.scrollHandler);
        }
    }

    /*
     * Position the menu relative to its anchor.
     */
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

        // Optionally set the menu width to fit its content.
        if (!this.style.width) {
            let maxWidth = 0;
            this.shadowRoot.querySelectorAll(".menu-item").forEach((item) => {
                maxWidth = Math.max(maxWidth, item.offsetWidth);
            });
            this.style.width = `${maxWidth}px`;
        }
    }

    /*
     * Get and set the "value" property based on selected items.
     */
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
            this.selectedValues =
                typeof newVal === "string"
                    ? new Set([newVal.trim()])
                    : new Set();
        }
        this.updateComponent();
    }
}

if (!customElements.get("kp-menu")) {
    customElements.define("kp-menu", KeplerMenu);
}
