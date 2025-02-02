class KeplerTabs extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Internal state: parsed tabs array and current active tab id.
        this.tabs = [];
        this.activeTab = null;
        this.render();
    }

    static get observedAttributes() {
        return ["tabs"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "tabs" && oldValue !== newValue) {
            try {
                this.tabs = JSON.parse(newValue);
            } catch (e) {
                console.error("Invalid JSON for tabs:", newValue);
                this.tabs = [];
            }
            // Set a default active tab if none exists.
            if (!this.activeTab && this.tabs.length) {
                const firstEnabled = this.tabs.find((tab) => !tab.disabled);
                this.activeTab = firstEnabled ? firstEnabled.tab : null;
            }
            this.render();
        }
    }

    connectedCallback() {
        // If no active tab is set, default to first enabled tab.
        if (!this.activeTab && this.tabs.length) {
            const firstEnabled = this.tabs.find((tab) => !tab.disabled);
            this.activeTab = firstEnabled ? firstEnabled.tab : null;
        }
        this.render();
    }

    renderHeader() {
        let headerHTML = "";
        this.tabs.forEach((tab) => {
            const isActive = this.activeTab === tab.tab;
            const disabledClass = tab.disabled ? " disabled" : "";
            // Optionally render left/right icons if provided.
            const leftIconHTML = tab.leftIcon
                ? `<span class="left-icon">${tab.leftIcon}</span>`
                : "";
            const rightIconHTML = tab.rightIcon
                ? `<span class="right-icon">${tab.rightIcon}</span>`
                : "";
            headerHTML += `
          <div class="tab-header${isActive ? " active" : ""}${disabledClass}" data-tab="${tab.tab}">
            <div class="tab-header-content">
              ${leftIconHTML}
              <span class="tab-name">${tab.name}</span>
              ${rightIconHTML}
            </div>
          </div>
        `;
        });
        return headerHTML;
    }

    renderBody() {
        // For each tab, render a named slot.
        let slotsHTML = "";
        this.tabs.forEach((tab) => {
            // Only the active tab gets an "active" class.
            const activeClass = this.activeTab === tab.tab ? " active" : "";
            slotsHTML += `<slot name="${tab.tab}" class="${activeClass}"></slot>`;
        });
        return slotsHTML;
    }

    render() {
        const headerHTML = this.renderHeader();
        const bodyHTML = this.renderBody();
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: inherit;
            }
            .tabs-header {
                display: flex;
                font-family: ProFontWindows, sans-serif;
            }
            .tab-header {
                flex: 0 1 auto;
                padding: var(--spacing-medium, 8px);
                background: var(--base-text--);
                font-size: 18px;
                color: var(--base-surface, #fff);
                text-align: center;
                text-transform: uppercase;
                overflow: hidden;
                cursor: pointer;
                transition: background 0.2s ease;
                border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
                border-bottom: none;
            }
            .tab-header:last-child {
                border-right: none;
            }
            .tab-header.active {
                background: var(--base-surface, #fff);
                color: var(--base-text);
                border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
                border-bottom: none;
            }
            .tab-header-content {
                display: flex;
                align-items: center;
                padding: var(--spacing-small, 4px);
            }

            .tab-header.disabled {
                position: relative;
                cursor: default;
                background: var(--base-text-subtle);
                border: var(--border-medium, 2px) solid var(--base-text-subtle);
            }

            .tab-header.disabled::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                    -45deg,
                    var(--base-surface, #fff) 0,
                    var(--base-surface, #fff) 2px,
                    transparent 3px,
                    transparent 10px
                );
                pointer-events: none;
                z-index: 1;
            }

            .tab-header.disabled .tab-header-content {
                display: flex;
                background: var(--base-text-subtle);
                z-index: 2;
                position: relative;
            }   

            .tabs-content slot {
                display: none;
            }

            .tabs-content slot.active {
                display: block;
                border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
                margin-top: -2px;
                padding: var(--spacing-medium, 8px);
            }

            .left-icon, .right-icon {
                margin: 0 4px;
            }
        </style>
        <div class="tabs-header" part="tabs-header">
          ${headerHTML}
        </div>
        <div class="tabs-content" part="tabs-content">
          ${bodyHTML}
        </div>
      `;
        this.attachHeaderListeners();
    }

    attachHeaderListeners() {
        const headers = this.shadowRoot.querySelectorAll(".tab-header");
        headers.forEach((header) => {
            header.addEventListener("click", () => {
                if (header.classList.contains("disabled")) return;
                const tabId = header.getAttribute("data-tab");
                this.activeTab = tabId;
                this.render(); // re-render to update active state in header and body.
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { activeTab: tabId },
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        });
    }
}

customElements.define("kp-tabs", KeplerTabs);
