class KeplerMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        // Internal storage for selected values (as strings).
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

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // When the "value" attribute changes, update the internal value.
            if (name === "value") {
                this.value = newValue;
            } else {
                this.updateComponent();
            }
        }
    }

    connectedCallback() {
        this.updateComponent();
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: none;
            position: fixed;
            box-sizing: border-box;
            background: var(--base-text--);
            z-index: 10;
            max-height: 200px;
            overflow-y: auto;
            box-shadow: var(--shadow-medium, 0 4px 8px rgba(0, 0, 0, 0.2));
          }
          .menu-item {
            padding: var(--spacing-medium, 8px);
            font-size: var(--font-size, 16px);
            font-family: Tomorrow, sans-serif;
            color: var(--base-background, #000);
            background: var(--base-text--);
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          .menu-item:hover {
            background: var(--base-text-emphasize);
          }
          .menu-item.selected {
            background: var(--primary--);
            color: var(--primary-background--);
          }
        </style>
        <div id="menuContainer" part="menuContainer"></div>
      `;
    }

    updateComponent() {
        // Parse items attribute (JSON array)
        let items = [];
        try {
            items = JSON.parse(this.getAttribute("items") || "[]");
        } catch (err) {
            console.error("KeplerMenu: invalid items JSON", err);
        }

        // If a "value" attribute is provided and tracking is enabled, update our internal selectedValues.
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

        // Populate the menu container with items.
        // Each menu item will get a "selected" class if its data-value is in this.selectedValues (if tracking is enabled).
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
        // If an anchor attribute is provided, attach a click event to toggle the menu.
        const anchorSelector = this.getAttribute("anchor");
        if (anchorSelector) {
            const anchor = document.querySelector(anchorSelector);
            if (anchor) {
                anchor.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // Toggle the menu.
                    if (this.style.display === "block") {
                        this.hideMenu();
                    } else {
                        this.showMenu();
                        this.positionMenu(anchor);
                    }
                });
            }
        }

        // Handle clicks on menu items.
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

                // NEW: If the selected item has an href property, navigate to that URL.
                if (selectedItem && selectedItem.href) {
                    window.location.href = selectedItem.href;
                    return;
                }

                const trackingEnabled =
                    this.getAttribute("track-selection") !== "false";
                const isMultiple = this.hasAttribute("multiple");

                if (trackingEnabled) {
                    if (isMultiple) {
                        // In multiple selection mode, toggle the selection.
                        if (this.selectedValues.has(value)) {
                            this.selectedValues.delete(value);
                            itemEl.classList.remove("selected");
                            // Dispatch a "deselect" event.
                            this.dispatchEvent(
                                new CustomEvent("deselect", {
                                    detail: {
                                        value,
                                        item: selectedItem,
                                        valueList: this.value,
                                    },
                                    bubbles: true,
                                    composed: true,
                                })
                            );
                        } else {
                            this.selectedValues.add(value);
                            itemEl.classList.add("selected");
                            // Dispatch a "select" event.
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
                        // In multiple mode, do not close the menu automatically.
                    } else {
                        // Single selection mode: clear any previous selection.
                        this.shadowRoot
                            .querySelectorAll(".menu-item.selected")
                            .forEach((el) => el.classList.remove("selected"));
                        itemEl.classList.add("selected");
                        this.selectedValues = new Set([value]);
                        // Close the menu.
                        this.hideMenu();
                        // Dispatch a "select" event.
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
                    // Reflect the new value in the "value" attribute.
                    this.setAttribute("value", this.value);
                    // Update component to ensure classes are in sync.
                    this.updateComponent();
                } else {
                    // If tracking is disabled, simply dispatch a "select" event.
                    this.dispatchEvent(
                        new CustomEvent("select", {
                            detail: { value, item: selectedItem },
                            bubbles: true,
                            composed: true,
                        })
                    );
                    // Optionally, you may choose to hide the menu in single select mode.
                    if (!isMultiple) {
                        this.hideMenu();
                    }
                }
            }
        });

        // Hide the menu if a click occurs outside the menu.
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
        this.style.display = "block";
    }

    hideMenu() {
        this.style.display = "none";
    }

    positionMenu(anchor) {
        // Get the anchor’s position relative to the viewport.
        const anchorRect = anchor.getBoundingClientRect();

        // Use requestAnimationFrame to ensure the menu is rendered.
        requestAnimationFrame(() => {
            // Temporarily force display block if not already visible.
            const prevDisplay = this.style.display;
            if (prevDisplay !== "block") {
                this.style.display = "block";
            }
            const menuRect = this.getBoundingClientRect();

            // Use "start" as default for align.
            const position = this.getAttribute("position") || "bottom"; // top, bottom, left, right
            const align = this.getAttribute("align") || "start";
            // For top/bottom: "start" = left, "center" = center, "end" = right.
            // For left/right: "start" = top, "center" = center, "end" = bottom.

            let top, left;
            if (position === "top" || position === "bottom") {
                // Vertical positioning.
                top =
                    position === "top"
                        ? anchorRect.top - menuRect.height
                        : anchorRect.bottom;
                // Horizontal alignment.
                if (align === "start") {
                    left = anchorRect.left;
                } else if (align === "center") {
                    left =
                        anchorRect.left +
                        (anchorRect.width - menuRect.width) / 2;
                } else if (align === "end") {
                    left = anchorRect.right - menuRect.width;
                }
            } else if (position === "left" || position === "right") {
                // Horizontal positioning.
                left =
                    position === "left"
                        ? anchorRect.left - menuRect.width
                        : anchorRect.right;
                // Vertical alignment.
                if (align === "start") {
                    top = anchorRect.top;
                } else if (align === "center") {
                    top =
                        anchorRect.top +
                        (anchorRect.height - menuRect.height) / 2;
                } else if (align === "end") {
                    top = anchorRect.bottom - menuRect.height;
                }
            } else {
                // Fallback.
                top = anchorRect.bottom;
                left = anchorRect.left;
            }

            // Adjust for page scrolling.
            this.style.top = `${top + window.scrollY}px`;
            this.style.left = `${left + window.scrollX}px`;
        });
    }

    // Getter for the "value" property.
    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            return this.selectedValues.size
                ? Array.from(this.selectedValues)[0]
                : "";
        }
    }

    // Setter for the "value" property.
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
        // Reflect the new value in the rendered menu.
        this.updateComponent();
    }
}

customElements.define("kp-menu", KeplerMenu);
