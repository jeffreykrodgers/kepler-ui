import { injectGlobalFonts } from "../modules/helpers.js";

class KeplerMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        injectGlobalFonts();
        this.selectedValues = new Set();
        this.render();
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
            name === "value" ? (this.value = newValue) : this.updateComponent();
        }
    }

    connectedCallback() {
        this.updateComponent();
        this._bindAnchorEvents();
        this._bindMenuEvents();
        this._observeAnchor();
    }

    disconnectedCallback() {
        if (this.anchorObserver) this.anchorObserver.disconnect();
    }

    get items() {
        return this._parseItems();
    }

    set items(value) {
        if (Array.isArray(value)) {
            this.setAttribute("items", JSON.stringify(value));
            this.updateComponent();
        } else {
            console.error("KeplerMenu: items must be an array.");
        }
    }

    get value() {
        return this.hasAttribute("multiple")
            ? Array.from(this.selectedValues).join(",")
            : Array.from(this.selectedValues)[0] || "";
    }

    set value(newVal) {
        if (this.hasAttribute("multiple")) {
            this.selectedValues = new Set(
                typeof newVal === "string"
                    ? newVal.split(",").map((v) => v.trim())
                    : newVal
            );
        } else {
            this.selectedValues = new Set([String(newVal).trim()]);
        }
        this.updateComponent();
    }

    _bindAnchorEvents() {
        const anchor = this._anchorElement();
        if (!anchor) return;
        anchor.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleMenu(anchor);
        });
    }

    _bindMenuEvents() {
        this.shadowRoot.addEventListener("click", (e) =>
            this._handleItemClick(e)
        );
        document.addEventListener("click", (e) => {
            if (!e.composedPath().includes(this)) this.hideMenu();
        });
    }

    _anchorElement() {
        const selector = this.getAttribute("anchor");
        if (!selector) return null;
        const root = this.getRootNode();
        return root instanceof ShadowRoot
            ? root.querySelector(selector)
            : document.querySelector(selector);
    }

    _cloneTemplate(slotId) {
        const tpl = this.querySelector(`[slot="${slotId}"]`);
        return tpl?.content ? document.importNode(tpl.content, true) : null;
    }

    _getContainer(selector, multiple) {
        const method = multiple ? "querySelectorAll" : "querySelector";
        return window.__routerShadowRoot
            ? window.__routerShadowRoot[method](selector)
            : document[method](selector);
    }

    _handleItemClick(e) {
        const itemEl = e.target.closest(".menu-item");
        if (!itemEl) return;

        const index = Number(itemEl.dataset.index);
        const items = this.items;
        const selectedItem = items[index];
        if (!selectedItem) return;

        if (selectedItem.href) {
            if (selectedItem.history) {
                history.pushState({}, "", selectedItem.href);
                window.dispatchEvent(
                    new PopStateEvent("popstate", { state: {} })
                );
            } else {
                window.location.href = selectedItem.href;
            }
            this.hideMenu();
            return;
        }

        if (this._isTracking()) {
            const value = itemEl.dataset.value;
            if (this.hasAttribute("multiple")) {
                this.selectedValues.has(value)
                    ? this.selectedValues.delete(value)
                    : this.selectedValues.add(value);
            } else {
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

    _isTracking() {
        return this.getAttribute("track-selection") !== "false";
    }

    _observeAnchor() {
        const anchor = this._anchorElement();
        if (!anchor) return;

        this.anchorObserver = new MutationObserver(() =>
            this._positionMenu(anchor)
        );

        this.anchorObserver.observe(anchor, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }

    _parseItems() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]");
        } catch (err) {
            console.error("KeplerMenu: invalid items JSON", err);
            return [];
        }
    }

    _parseValue() {
        const val = this.getAttribute("value") || "";
        this.selectedValues = this.hasAttribute("multiple")
            ? new Set(val.split(",").map((v) => v.trim()))
            : new Set([val.trim()]);
    }

    _positionMenu(anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const menuRect = this.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const position = this.getAttribute("position") || "bottom";
        const align = this.getAttribute("align") || "start";

        let top =
            position === "top"
                ? anchorRect.top - menuRect.height
                : anchorRect.bottom;
        let left =
            align === "center"
                ? anchorRect.left + (anchorRect.width - menuRect.width) / 2
                : align === "end"
                  ? anchorRect.right - menuRect.width
                  : anchorRect.left;

        top = Math.min(Math.max(top, 10), vh - menuRect.height - 10);
        left = Math.min(Math.max(left, 10), vw - menuRect.width - 10);

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

        Object.entries(item).forEach(([key, val]) => {
            const el = clone.querySelector(`[data-${key}]`);
            if (el) el.textContent = val;
        });

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clone);
        return tempDiv.innerHTML;
    }

    hideMenu() {
        this.style.display = "none";
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler, true);
            window.removeEventListener("resize", this.scrollHandler);
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

    showMenu(anchor) {
        this._getContainer("kp-menu", true).forEach((menu) => {
            if (menu !== this) menu.hideMenu();
        });

        this.style.display = "block";
        if (!anchor) anchor = this._anchorElement();
        if (!anchor) return;

        this._positionMenu(anchor);

        this.scrollHandler = () =>
            requestAnimationFrame(() => this._positionMenu(anchor));
        window.addEventListener("scroll", this.scrollHandler, true);
        window.addEventListener("resize", this.scrollHandler);
    }

    toggleMenu(anchor) {
        this.style.display === "block"
            ? this.hideMenu()
            : this.showMenu(anchor);
    }

    updateComponent() {
        const items = this._parseItems();
        if (this._isTracking() && this.hasAttribute("value"))
            this._parseValue();

        const container = this.shadowRoot.querySelector("#menuContainer");
        container.innerHTML = items
            .map((item, i) => this._renderItem(item, i))
            .join("");
    }

    _renderItem(item, index) {
        const isSelected =
            this._isTracking() && this.selectedValues.has(String(item.value));

        const content = item.template
            ? this._renderTemplate(item.template, item)
            : `<label>${item.label || ""}</label>`;

        return `<div class="menu-item ${isSelected ? "selected" : ""}" data-index="${index}" data-value="${item.value}" part="menu-item">${content}</div>`;
    }
}

if (!customElements.get("kp-menu")) {
    customElements.define("kp-menu", KeplerMenu);
}
