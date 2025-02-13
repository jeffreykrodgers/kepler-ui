class KeplerTextarea extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "placeholder",
            "disabled",
            "value",
            "name",
            "maxlength",
            "minlength",
            "readonly",
            "required",
            "aria-label",
            "aria-hidden",
            "label",
            "label-position",
            "invalid",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "label" || name === "label-position") {
                this.updateLabel();
            } else if (name === "value" || name === "required") {
                this.syncAttributesToTextarea(name, newValue);
                this.updateValidation();
            } else if (name !== "invalid") {
                this.syncAttributesToTextarea(name, newValue);
            }
        }
    }

    connectedCallback() {
        // If invalid is set manually in HTML, mark it as manual.
        if (
            this.hasAttribute("invalid") &&
            !this.hasAttribute("data-manual-invalid")
        ) {
            this.setAttribute("data-manual-invalid", "true");
        }
        this.syncAttributes();
        this.updateValidation();

        // Create and append a hidden input if it doesn't exist.
        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.hiddenInput.value = this.inputElement
                ? this.inputElement.value
                : "";
            this.appendChild(this.hiddenInput);
        }
        this.updateHiddenInput();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 100%;
          }
          .label-wrapper {
            display: flex;
            box-sizing: border-box;
            align-items: center;
            font-family: ProFontWindows, sans-serif;
            font-size: 21px;
            line-height: 24px;
            font-weight: 500;
            color: var(--base-surface, rgba(241,246,250,1));
            background: var(--base-text--, rgba(29,29,29,1));
            padding: var(--spacing-medium, 8px);
            border-radius: var(--border-small, 1px);
            gap: var(--spacing-small, 8px);
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          :host([label-position="top"]) .label-wrapper,
          :host([label-position="bottom"]) .label-wrapper {
            width: 100%;
            justify-content: flex-start;
            background-color: var(--base-surface, rgba(241,246,250,1));
            color: var(--base-text--, rgba(29,29,29,1));
            padding: 0;
          }
          :host([label-position="top"]) .input-container,
          :host([label-position="bottom"]) .input-container {
            gap: 0;
          }
          .label-wrapper.selected {
            background-color: var(--primary--, rgba(4,134,209,1));
            color: var(--primary-background--, rgba(245,250,250,1));
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
            align-items: stretch;
          }
          :host([label-position="right"]) .input-container {
            flex-direction: row-reverse;
            align-items: stretch;
          }
          :host([label-position="top"]) .input-container {
            flex-direction: column;
            align-items: stretch;
          }
          :host([label-position="bottom"]) .input-container {
            flex-direction: column-reverse;
            align-items: stretch;
          }
          .input-wrapper {
            box-sizing: border-box;
            display: flex;
            flex: 1 0 auto;
            align-items: stretch;
            padding: var(--spacing-medium, 8px);
            border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
            border-radius: var(--border-small, 1px);
            background: var(--base-surface, rgba(241,246,250,1));
            color: var(--base-text--, rgba(29,29,29,1));
            font-family: Tomorrow, sans-serif;
            font-size: var(--font-size, 16px);
            transition: border-color 0.2s ease, background-color 0.2s ease;
          }
          .input-wrapper:focus-within {
            border-color: var(--primary--, rgba(4,134,209,1));
            background: var(--base-hover, rgba(215,219,222,1));
          }
          textarea {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            resize: vertical;
            min-height: 80px;
            padding: var(--spacing-small, 8px);
          }
          textarea::placeholder {
            color: var(--base-text-subtle, rgba(109,110,112,1));
          }
          .icon {
            display: flex;
            align-items: center;
          }
          .hidden {
            display: none;
          }
          /* Invalid state styles */
          :host([invalid]) .input-wrapper {
            border-color: var(--error--, rgba(217,4,40,1));
            color: var(--error--, rgba(217,4,40,1));
            background: var(--error-background--, rgba(250,245,246,1));
          }
          :host([invalid]) .input-wrapper:hover {
            background: var(--error-background-hover, rgba(246,215,220,1));
          }
          :host([invalid]) .input-wrapper:active,
          :host([invalid]) .input-wrapper:focus-within {
            background: var(--error-background-active, rgba(242,185,195,1));
          }
          :host([invalid][label-position="top"]) .label-wrapper,
          :host([invalid][label-position="bottom"]) .label-wrapper {
            color: var(--error--, rgba(217,4,40,1));
          }
          :host([invalid][label-position="left"]) .label-wrapper,
          :host([invalid][label-position="right"]) .label-wrapper {
            background-color: var(--error--, rgba(217,4,40,1));
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
                <textarea></textarea>
                <span class="icon right-icon"><slot name="right-icon"></slot></span>
            </div>
        </div>
      `;

        // Access elements
        this.textareaElement = this.shadowRoot.querySelector("textarea");
        this.labelTextElement = this.shadowRoot.querySelector(".label-text");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");

        // Manage visibility of icons dynamically
        this.manageSlotVisibility("left-label-icon", ".left-label-icon");
        this.manageSlotVisibility("right-label-icon", ".right-label-icon");
        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");

        // Add default event listeners
        this.addEventListeners();
    }

    syncAttributes() {
        KeplerTextarea.observedAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.syncAttributesToTextarea(attr, this.getAttribute(attr));
            }
        });
        this.updateLabel();
    }

    syncAttributesToTextarea(name, value) {
        if (value === null) {
            this.textareaElement.removeAttribute(name);
        } else {
            this.textareaElement.setAttribute(name, value);
        }
    }

    updateLabel() {
        const label = this.getAttribute("label") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);
        this.labelWrapper.style.display = label ? "flex" : "none";
    }

    manageSlotVisibility(slotName, selector) {
        const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);
        const container = this.shadowRoot.querySelector(selector);
        const updateVisibility = () => {
            const hasContent = slot.assignedNodes().length > 0;
            container.classList.toggle("hidden", !hasContent);
        };
        if (slot) {
            slot.addEventListener("slotchange", updateVisibility);
            updateVisibility();
        }
    }

    addEventListeners() {
        this.textareaElement.addEventListener("focus", () => {
            this.labelWrapper.classList.add("selected");
        });
        this.textareaElement.addEventListener("blur", () => {
            this.labelWrapper.classList.remove("selected");
        });
        this.textareaElement.addEventListener("input", () => {
            this.dispatchEvent(
                new CustomEvent("input", {
                    detail: { value: this.textareaElement.value },
                    bubbles: true,
                    composed: true,
                })
            );
            this.updateValidation();
        });
        this.textareaElement.addEventListener("change", () => {
            this.setAttribute("value", this.textareaElement.value);
            this.dispatchEvent(
                new Event("change", { bubbles: true, composed: true })
            );
            this.updateValidation();
        });
    }

    updateValidation() {
        // If manual invalid override is active, skip auto-updating.
        if (this.hasAttribute("data-manual-invalid")) return;
        // If required and the value is empty, mark as invalid.
        if (
            this.hasAttribute("required") &&
            !this.textareaElement.value.trim()
        ) {
            this.setAttribute("invalid", "");
        } else {
            this.removeAttribute("invalid");
        }
    }

    get value() {
        return this.textareaElement.value;
    }

    set value(newValue) {
        this.setAttribute("value", newValue);
    }

    // Getter and setter for manual control of the invalid state.
    get invalid() {
        return this.hasAttribute("invalid");
    }

    set invalid(val) {
        if (val) {
            this.setAttribute("data-manual-invalid", "true");
            this.setAttribute("invalid", "");
        } else {
            this.removeAttribute("data-manual-invalid");
            this.removeAttribute("invalid");
        }
    }
}

if (!customElements.get("kp-textarea")) {
    customElements.define("kp-textarea", KeplerTextarea);
}
