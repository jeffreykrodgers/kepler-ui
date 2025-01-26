class KeplerInput extends HTMLElement {
    constructor() {
        super();

        // Attach shadow DOM
        this.attachShadow({ mode: "open" });

        // Create the input container with styles
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 100%;
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

        :host([label-position="top"]) .label-wrapper,
        :host([label-position="bottom"]) .label-wrapper {
          width: 100%;
          justify-content: flex-start;
        }

        .label-wrapper.selected {
          background-color: var(--primary--);
          color: var(--primary-background--, #fff);
        }

        .label-icon {
          display: flex;
          align-items: center;
        }

        .input-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-small, 8px);
        }

        :host([label-position="left"]) .input-container {
          flex-direction: row;
          align-items: center;
        }

        :host([label-position="right"]) .input-container {
          flex-direction: row-reverse;
          align-items: center;
        }

        :host([label-position="top"]) .input-container {
          flex-direction: column;
          align-items: flex-start;
        }

        :host([label-position="bottom"]) .input-container {
          flex-direction: column-reverse;
          align-items: flex-start;
        }

        .input-wrapper {
          box-sizing: border-box;
          display: flex;
          flex: 1 0 auto;
          align-items: center;
          padding: var(--spacing-medium, 8px);
          padding-bottom: calc(var(--spacing-medium, 8px) - 1px);
          border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
          border-radius: var(--border-small, 5px);
          background: var(--base-surface);
          color: var(--base-text);
          font-family: Tomorrow, sans-serif;
          font-size: var(--font-size, 16px);
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: var(--primary--);
          background: var(--base-hover);
        }

        input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-family: inherit;
          font-size: inherit;
        }

        input::placeholder {
          color: var(--base-text-subtle);
        }

        .icon {
          display: flex;
          align-items: center;
        }

        .hidden {
          display: none;
        }
      </style>
      <div class="input-container" part="input-container">
        <div class="label-wrapper" part="label-wrapper">
          <span class="label-icon left-label-icon"><slot name="left-label-icon"></slot></span>
          <span class="label-text"></span>
          <span class="label-icon right-label-icon"><slot name="right-label-icon"></slot></span>
        </div>
        <div class="input-wrapper" part="input-wrapper">
          <span class="icon left-icon"><slot name="left-icon"></slot></span>
          <input type="text" />
          <span class="icon right-icon"><slot name="right-icon"></slot></span>
        </div>
      </div>
    `;

        // Access elements
        this.inputElement = this.shadowRoot.querySelector("input");
        this.labelTextElement = this.shadowRoot.querySelector(".label-text");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this.leftLabelIcon = this.shadowRoot.querySelector(".left-label-icon");
        this.rightLabelIcon =
            this.shadowRoot.querySelector(".right-label-icon");
        this.leftIcon = this.shadowRoot.querySelector(".left-icon");
        this.rightIcon = this.shadowRoot.querySelector(".right-icon");

        // Manage visibility of icons dynamically
        this.manageSlotVisibility("left-label-icon", this.leftLabelIcon);
        this.manageSlotVisibility("right-label-icon", this.rightLabelIcon);
        this.manageSlotVisibility("left-icon", this.leftIcon);
        this.manageSlotVisibility("right-icon", this.rightIcon);

        // Add default event listeners
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "type",
            "placeholder",
            "disabled",
            "value",
            "name",
            "autocomplete",
            "maxlength",
            "minlength",
            "readonly",
            "required",
            "pattern",
            "aria-label",
            "aria-hidden",
            "label",
            "label-position",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // Sync attributes to the input element
            if (["label", "label-position"].includes(name)) {
                this.updateLabel();
            } else {
                if (newValue === null) {
                    this.inputElement.removeAttribute(name);
                } else {
                    this.inputElement.setAttribute(name, newValue);
                }
            }
        }
    }

    connectedCallback() {
        // Apply any default attributes from the custom element to the input
        this.syncAttributes();
    }

    syncAttributes() {
        KeplerInput.observedAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.inputElement.setAttribute(attr, this.getAttribute(attr));
            }
        });

        // Initialize label
        this.updateLabel();
    }

    updateLabel() {
        // Update label text
        const label = this.getAttribute("label") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        this.labelTextElement.textContent = label;

        // Set the default label position
        this.setAttribute("label-position", labelPosition);
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
        this.inputElement.addEventListener("focus", () => {
            this.labelWrapper.classList.add("selected");
        });

        this.inputElement.addEventListener("blur", () => {
            this.labelWrapper.classList.remove("selected");
        });

        // Proxy input events
        this.inputElement.addEventListener("input", (event) => {
            this.dispatchEvent(
                new CustomEvent("input", {
                    detail: { value: this.inputElement.value },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.inputElement.addEventListener("keydown", (event) => {
            this.dispatchEvent(
                new CustomEvent("keydown", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.inputElement.addEventListener("keyup", (event) => {
            this.dispatchEvent(
                new CustomEvent("keyup", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                })
            );
        });
    }

    get value() {
        return this.inputElement.value;
    }

    set value(newValue) {
        this.inputElement.value = newValue;
    }
}

// Define the custom element
customElements.define("kp-input", KeplerInput);
