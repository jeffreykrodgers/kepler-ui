class KeplerSidebar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.expanded = this.hasAttribute("expanded");
        this.items = JSON.parse(this.getAttribute("items") || "[]");

        this.render();
    }

    static get observedAttributes() {
        return ["items"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && name === "items") {
            this.items = JSON.parse(newValue || "[]");
            this.render();
        }
    }

    connectedCallback() {
        this.shadowRoot
            .querySelector(".toggle-button")
            .addEventListener("click", () => this.toggleSidebar());
    }

    toggleSidebar() {
        this.expanded = !this.expanded;
        this.toggleAttribute("expanded", this.expanded);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    width: var(--sidebar-collapsed-width, 56px);
                    transition: width 0.3s ease-in-out;
                    border-right: var(--border-medium, 2px) solid var(--base-border, #d7dbde);
                    overflow: hidden;
                }

                :host([expanded]) {
                    width: var(--sidebar-expanded-width, 200px);
                }

                .sidebar {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

    
                .sidebar-item {
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s ease;
                }
    
                .sidebar-item::part(label),
                .toggle-button::part(label) {
                    width: 0;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateX(-20px);
                    transition: opacity 0.3s ease 0s, transform 0.3s ease 0s;
                }
    
                :host([expanded]) .sidebar-item::part(label),
                :host([expanded]) .toggle-button::part(label) {
                    width: auto;
                    opacity: 1;
                    transform: translateX(0);
                    transition-delay: 0.2s;
                }
    
                .toggle-button {
                    margin-top: auto;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    position: relative;
                }
    
                .toggle-icon {
                    transition: transform 0.3s ease;
                }
    
                :host([expanded]) .toggle-icon {
                    transform: rotate(180deg);
                }
    
                .toggle-button::part(button-content),
                .sidebar-item::part(button-content) {
                    width: 100%;
                    min-height: 30px;
                    overflow: hidden;
                }
    
                .toggle-button::part(left-icon),
                .sidebar-item::part(left-icon) {
                    min-width: 24px;
                }
            </style>
    
            <div class="sidebar" part="sidebar">
                ${this.items
                    .map((item) => {
                        let isSelected = false;
                        if ("selected" in item) {
                            isSelected = item.selected;
                        } else if (item.href) {
                            isSelected = window.location.pathname === item.href;
                        }
                        // If selected, override the border width variable to 0
                        const borderStyle = isSelected
                            ? 'style="--border-medium: 0;"'
                            : "";

                        return `
                            <kp-button 
                                style-type="${isSelected ? "filled" : "flat"}" 
                                ${borderStyle}
                                size="large" 
                                class="sidebar-item" 
                                href="${item.href || "#"}" 
                                data-value="${item.value}">
                                ${
                                    item.template
                                        ? `<slot name="${item.template}"></slot>`
                                        : `<slot name="${item.iconTemplate}" slot="left-icon"></slot>`
                                }
                                <span>${item.label}</span>
                            </kp-button>
                        `;
                    })
                    .join("")}
                <kp-button style-type="flat" class="toggle-button" size="large">
                    <svg slot="left-icon" class="toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                    </svg>
                    <span>Collapse</span>
                </kp-button>
            </div>
        `;
    }
}

if (!customElements.get("kp-sidebar")) {
    customElements.define("kp-sidebar", KeplerSidebar);
}
