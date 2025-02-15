class KeplerPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._expanded = false;
        this.render();
    }

    static get observedAttributes() {
        return ["selected", "expanded"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "selected" && oldValue !== newValue) {
            this.updateSelectedState();
        }
        if (name === "expanded" && oldValue !== newValue) {
            if (this.hasAttribute("expanded")) {
                if (!this._expanded) {
                    this.expand();
                }
            } else {
                if (this._expanded) {
                    this.collapse();
                }
            }
        }
    }

    get selected() {
        return this.hasAttribute("selected");
    }

    set selected(val) {
        if (val) {
            this.setAttribute("selected", "");
        } else {
            this.removeAttribute("selected");
        }
    }

    get expanded() {
        return this.hasAttribute("expanded");
    }

    set expanded(val) {
        if (val) {
            this.setAttribute("expanded", "");
        } else {
            this.removeAttribute("expanded");
        }
    }

    updateSelectedState() {
        // Apply the "selected" class if the attribute is present.
        if (this.selected) {
            this.classList.add("selected");
        } else {
            this.classList.remove("selected");
        }
    }

    connectedCallback() {
        this.addHeaderListeners();
        // Check for children; if none, hide the arrow.
        this.checkForChildren();
        // Apply selected styling based on the "selected" attribute.
        this.updateSelectedState();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background: var(--base-surface, rgba(241,246,250,1));
            color: var(--base-text--, rgba(29,29,29,1));
            z-index: 10;
            border-left: var(--border-medium, 2px) solid var(--base-surface, rgba(241,246,250,1));
          }
          :host(.expanded) {
            background: var(--base-text--, rgba(29,29,29,1));
            color: var(--base-surface, rgba(241,246,250,1));
            border-left: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
          }
          :host(.selected) {
            color: var(--primary--, rgba(4,134,209,1));
            background: var(--primary-background-hover, rgba(245,250,250,1));
            border-left: var(--border-medium, 2px) solid var(--primary--, rgba(4,134,209,1));
            margin-left: calc(var(--border-medium, 2px) * -1);
            padding-left: var(--border-medium, 2px);
            z-index: 11;
          }
          :host(.expanded) .header {
            padding-left: calc(var(--spacing-medium, 8px) - var(--border-small, 1px));
          }
          :host(.expanded) .header:hover {
            background: var(--base-text-emphasize, rgba(56,56,57,1));
          }
          :host(.selected) .header:hover {
            background: var(--primary-background-active, rgba(225,64,92,1));
          }
          .header {
            display: flex;
            align-items: center;
            padding: var(--spacing-medium, 8px);
            padding-left: var(--spacing-large, 10px);
            cursor: pointer;
            transition: background 0.2s ease;
            gap: var(--spacing-medium, 8px);
          }
          .header:hover {
            background: var(--base-hover, rgba(215,219,222,1));
          }
          .header:not(.clickable) {
            cursor: default;
          }
          .header ::slotted([slot="icon"]) {
            margin-right: 8px;
          }
          .header ::slotted([slot="label"]) {
            flex-grow: 1;
            cursor: inherit;
            font-size: 21px;
          }
          .arrow {
            display: inline-block;
            width: 20px;
            height: 20px;
            transition: transform 0.2s ease;
          }
          .arrow.expanded {
            transform: rotate(180deg);
          }
          .children {
            display: none;
          }
          .children.expanded {
            display: block;
          }
        </style>
        <div class="header">
          <slot name="icon"></slot>
          <slot name="label"></slot>
          <span class="arrow" id="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
              <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
            </svg>
          </span>
        </div>
        <div class="children" id="childrenContainer">
          <slot name="children"></slot>
        </div>
      `;
    }

    addHeaderListeners() {
        const header = this.shadowRoot.querySelector(".header");

        header.addEventListener("click", () => {
            if (this.hasAttribute("href")) {
                window.location.href = this.getAttribute("href");
                return;
            }

            if (this.hasChildren()) {
                this.toggle();
            } else {
                this.dispatchEvent(
                    new CustomEvent("select", {
                        detail: { selected: true },
                        bubbles: true,
                        composed: true,
                    })
                );
            }
        });
        const childrenSlot = this.shadowRoot.querySelector(
            'slot[name="children"]'
        );

        childrenSlot.addEventListener("slotchange", () =>
            this.checkForChildren()
        );
    }

    hasChildren() {
        const childrenSlot = this.shadowRoot.querySelector(
            'slot[name="children"]'
        );
        const nodes = childrenSlot.assignedNodes({ flatten: true });
        return nodes && nodes.length > 0;
    }

    checkForChildren() {
        const header = this.shadowRoot.querySelector(".header");
        const arrow = this.shadowRoot.querySelector("#arrow");

        if (this.hasChildren()) {
            arrow.style.visibility = "visible";
            header.classList.add("clickable");
        } else {
            arrow.style.visibility = "hidden";
            header.classList.remove("clickable");
        }
    }

    toggle() {
        if (!this.hasChildren()) return;
        if (!this._expanded) {
            const parentBar = this.closest("kp-panelbar");
            if (parentBar && parentBar.hasAttribute("exclusive")) {
                const siblingPanels = parentBar.querySelectorAll("kp-panel");
                siblingPanels.forEach((panel) => {
                    if (panel !== this && panel._expanded) {
                        panel.collapse();
                    }
                });
            }
            this.expand();
        } else {
            this.collapse();
        }

        this.dispatchEvent(
            new CustomEvent("toggle", {
                detail: { expanded: this._expanded },
                bubbles: true,
                composed: true,
            })
        );
    }

    expand() {
        const childrenContainer =
            this.shadowRoot.querySelector("#childrenContainer");
        const arrow = this.shadowRoot.querySelector("#arrow");

        childrenContainer.classList.add("expanded");
        arrow.classList.add("expanded");
        this._expanded = true;
        this.classList.add("expanded");
        this.dispatchEvent(
            new CustomEvent("expand", {
                detail: { expanded: true },
                bubbles: true,
                composed: true,
            })
        );
    }

    collapse() {
        const childrenContainer =
            this.shadowRoot.querySelector("#childrenContainer");
        const arrow = this.shadowRoot.querySelector("#arrow");

        childrenContainer.classList.remove("expanded");
        arrow.classList.remove("expanded");
        this._expanded = false;
        this.classList.remove("expanded");
        this.dispatchEvent(
            new CustomEvent("collapse", {
                detail: { expanded: false },
                bubbles: true,
                composed: true,
            })
        );
    }
}

if (!customElements.get("kp-panel")) {
    customElements.define("kp-panel", KeplerPanel);
}
