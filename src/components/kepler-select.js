class KeplerSelect extends HTMLElement {
    constructor() {
        super();

        // Attach shadow DOM
        this.attachShadow({ mode: "open" });
        this.render();

        this.setupRefs();

        // Add event listeners
        this.addEventListeners();
    }

    static get observedAttributes() {
        return ["label", "label-position", "options"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (["label", "label-position", "options"].includes(name)) {
                this.updateComponent();
            }
        }
    }

    connectedCallback() {
        this.updateComponent();
        this.manageDefaultIconVisibility();
    }

    render() {
        // Create the select container with styles
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 100%;
          position: relative;
        }

        .label-wrapper {
          display: flex;
          flex: 1 0 auto;
          box-sizing: border-box;
          align-items: center;
          font-family: ProFontWindows, sans-serif;
          font-size: 21px;
          line-height: 24px;
          font-weight: 500;
          color: var(--base-surface, #fff);
          background: var(--base-text--, #000);
          padding: var(--spacing-medium, 8px);
          border-radius: var(--border-small, 4px);
          gap: var(--spacing-small, 8px);
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .label-wrapper.selected {
            background-color: var(--primary--);
            color: var(--primary-background--, #fff);
        }

        .label-icon {
          display: flex;
          align-items: center;
        }

        .select-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-small, 8px);
        }

        :host([label-position="left"]) .select-container {
          flex-direction: row;
          align-items: center;
        }

        :host([label-position="right"]) .select-container {
          flex-direction: row-reverse;
          align-items: center;
        }

        :host([label-position="top"]) .select-container {
          flex-direction: column;
          align-items: flex-start;
        }

        :host([label-position="bottom"]) .select-container {
          flex-direction: column-reverse;
          align-items: flex-start;
        }

        .select-wrapper {
            position: relative;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            padding: var(--spacing-medium, 8px);
            border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
            border-radius: var(--border-small, 5px);
            background: var(--base-surface);
            color: var(--base-text);
            font-family: Tomorrow, sans-serif;
            font-size: var(--font-size, 16px);
            transition: border-color 0.2s ease, background-color 0.2s ease;
            width: 100%;
        }

        .icon.right-icon {
            margin-left: auto;
            display: flex;
            align-items: center;
        }

        .select-wrapper:focus-within {
          border-color: var(--primary--);
          background: var(--base-hover);
        }

        .dropdown {
          display: none;
          position: absolute;
          top: calc(100% + var(--spacing-small, 8px));
          left: 0;
          width: 100%;
          box-sizing: border-box;
          border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
          border-radius: calc(var(--border-small, 5px) / 2);
          background: var(--base-surface);
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: var(--shadow-medium, 0 4px 8px rgba(0, 0, 0, 0.2));
        }

        .dropdown.open {
          display: block;
        }

        .dropdown-item {
          padding: var(--spacing-medium, 8px);
          font-size: var(--font-size, 16px);
          font-family: Tomorrow, sans-serif;
          color: var(--base-text);
          background: var(--base-surface);
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .dropdown-item:hover {
          background: var(--base-hover);
        }

        .dropdown-item.selected {
          background: var(--primary--);
          color: var(--primary-background--);
        }

        .hidden {
          display: none;
        }

        .default-icon {
          margin-left: auto;
          display: inline-block;
          width: 20px;
          height: 20px;
        }

        .default-icon svg {
          width: 100%;
          height: 100%;
          stroke: var(--base-text--, #ccc);
          fill: none;
          transition: transform 0.2s ease;
        }

        .select-wrapper.open .default-icon svg {
          transform: rotate(180deg);
        }
      </style>
      <div class="select-container" part="select-container">
        <div class="label-wrapper" part="label-wrapper">
          <span class="label-icon left-label-icon"><slot name="left-label-icon"></slot></span>
          <span class="label-text"></span>
          <span class="label-icon right-label-icon"><slot name="right-label-icon"></slot></span>
        </div>
        <div class="select-wrapper" part="select-wrapper" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false">
          <span class="icon left-icon"><slot name="left-icon"></slot></span>
          <span class="selected-value" aria-live="polite"></span>
          <span class="icon right-icon">
            <slot name="right-icon"></slot>
            <span class="default-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
                    <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                </svg>
            </span>
          </span>
        </div>
        <div class="dropdown" part="dropdown" role="listbox"></div>
      </div>
    `;
    }

    setupRefs() {
        this.dropdown = this.shadowRoot.querySelector(".dropdown");
        this.selectWrapper = this.shadowRoot.querySelector(".select-wrapper");
        this.labelTextElement = this.shadowRoot.querySelector(".label-text");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this.selectedValueElement =
            this.shadowRoot.querySelector(".selected-value");
        this.rightIconSlot = this.shadowRoot.querySelector(
            'slot[name="right-icon"]'
        );
        this.defaultIcon = this.shadowRoot.querySelector(".default-icon");
    }

    updateComponent() {
        // Update label
        const label = this.getAttribute("label") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);

        // Populate dropdown
        const options = JSON.parse(this.getAttribute("options") || "[]");
        this.dropdown.innerHTML = options
            .map(
                (opt) =>
                    `<div class="dropdown-item ${
                        opt.selected ? "selected" : ""
                    }" data-value="${opt.value}" role="option" aria-selected="${
                        opt.selected ? "true" : "false"
                    }">${opt.label}</div>`
            )
            .join("");

        // Set initial selected value
        const selected = options.find((opt) => opt.selected);
        this.selectedValueElement.textContent =
            selected?.label || "Select an option";
    }

    manageDefaultIconVisibility() {
        const hasRightIcon =
            this.rightIconSlot.assignedNodes().length > 0 ||
            this.rightIconSlot.innerHTML.trim().length > 0;

        this.defaultIcon.style.display = hasRightIcon ? "none" : "inline-block";
    }

    manageSlotVisibility(slotName, element) {
        const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);

        const updateVisibility = () => {
            const hasContent = slot.assignedNodes().length > 0;
            element.classList.toggle("hidden", !hasContent);
        };

        // Initial check
        updateVisibility();

        // Listen for changes to the slot content
        slot.addEventListener("slotchange", updateVisibility);
    }

    addEventListeners() {
        // Toggle dropdown and update label state
        this.selectWrapper.addEventListener("click", () => {
            const isOpen = this.dropdown.classList.toggle("open");
            this.selectWrapper.classList.toggle("open", isOpen);
            this.selectWrapper.setAttribute("aria-expanded", isOpen.toString());
            this.manageDefaultIconVisibility();
            this.updateLabelState(isOpen); // Update label state
        });

        // Handle dropdown item selection
        this.dropdown.addEventListener("click", (event) => {
            const item = event.target.closest(".dropdown-item");
            if (item) {
                const value = item.getAttribute("data-value");
                const label = item.textContent;

                // Update selected value
                this.selectedValueElement.textContent = label;

                // Mark selected in dropdown
                this.dropdown
                    .querySelectorAll(".dropdown-item")
                    .forEach((el) => el.classList.remove("selected"));
                item.classList.add("selected");

                // Dispatch change event
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { value },
                        bubbles: true,
                        composed: true,
                    })
                );

                // Close dropdown
                this.dropdown.classList.remove("open");
                this.selectWrapper.classList.remove("open");
                this.selectWrapper.setAttribute("aria-expanded", "false");
                this.manageDefaultIconVisibility();
                this.updateLabelState(false); // Update label state
            }
        });

        // Close dropdown and reset label state on outside click
        document.addEventListener("click", (event) => {
            if (!this.contains(event.target)) {
                this.dropdown.classList.remove("open");
                this.selectWrapper.classList.remove("open");
                this.selectWrapper.setAttribute("aria-expanded", "false");
                this.manageDefaultIconVisibility();
                this.updateLabelState(false); // Update label state
            }
        });

        // Add focus and blur events for label state
        this.selectWrapper.addEventListener("focus", () => {
            this.updateLabelState(true);
        });

        this.selectWrapper.addEventListener("blur", () => {
            this.updateLabelState(false);
        });
    }

    updateLabelState(isSelected) {
        if (isSelected) {
            this.labelWrapper.classList.add("selected");
        } else {
            this.labelWrapper.classList.remove("selected");
        }
    }
}

// Define the custom element
customElements.define("kp-select", KeplerSelect);
