class KeplerCheckbox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.setupRefs();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "checked",
            "label",
            "label-position",
            "disabled",
            "name",
            "value",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateComponent();
        }
    }

    connectedCallback() {
        this.updateComponent();

        // Create a hidden checkbox input (instead of a hidden input) so that it
        // accepts default checkbox properties.
        if (!this.inputElement) {
            this.inputElement = document.createElement("input");
            this.inputElement.type = "checkbox";
            // Hide the native checkbox.
            this.inputElement.style.position = "absolute";
            this.inputElement.style.opacity = "0";
            this.inputElement.style.pointerEvents = "none";
            this.inputElement.style.width = "0";
            this.inputElement.style.height = "0";
            // Set initial properties.
            this.inputElement.name = this.getAttribute("name") || "";
            this.inputElement.value = this.getAttribute("value") || "on";
            this.inputElement.checked = this.hasAttribute("checked");
            this.appendChild(this.inputElement);
        }
        this.updateHiddenInput();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            position: relative;
          }
          .checkbox-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: var(--spacing-small, 8px);
          }
          :host([label-position="left"]) .checkbox-container {
            flex-direction: row-reverse;
          }
          :host([label-position="top"]) .checkbox-container {
            flex-direction: column-reverse;
            align-items: flex-start;
          }
          :host([label-position="bottom"]) .checkbox-container {
            flex-direction: column;
            align-items: flex-start;
          }
          :host([label-position="top"]) .label-wrapper,
          :host([label-position="bottom"]) .label-wrapper {
            width: 100%;
            justify-content: flex-start;
            background-color: var(--base-surface, #fff);
            color: var(--base-text--, #000);
            padding: 0;
          }
          .checkbox-wrapper {
            display: flex;
            flex: 1 0 auto;
            padding: var(--spacing-medium, 8px);
          }
        :host([label-position="top"]) .checkbox-wrapper,
        :host([label-position="bottom"]) .checkbox-wrapper {
            padding-left: 0;
            padding-right: 0;
          }
          .checkbox {
            width: 20px;
            height: 20px;
            display: inline-block;
            border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
            border-radius: var(--border-small, 4px);
            background: var(--base-surface);
            position: relative;
            cursor: pointer;
            flex-shrink: 0;
          }
          .checkbox.checked {
            background: var(--primary--);
            border-color: var(--primary--);
          }
          .checkbox.checked::after {
            content: "";
            width: 6px;
            height: 12px;
            border: solid var(--primary-background--, #fff);
            border-radius: 2px;
            border-width: 0 2px 2px 0;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-100%, -100%) rotate(45deg);
            transform-origin: bottom left;
          }
          .checkbox.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          .label-wrapper {
            box-sizing: border-box;
            font-family: ProFontWindows, sans-serif;
            font-size: 21px;
            line-height: 24px;
            font-weight: 500;
            padding: var(--spacing-medium, 8px);
            color: var(--base-surface, #fff);
            background: var(--base-text--, #ccc);
            transition: color 0.2s ease;
            cursor: pointer;
          }
          .label-wrapper.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
        </style>
        <div class="checkbox-container" part="checkbox-container">
            <div class="checkbox-wrapper" part="checkbox-wrapper">
                <div class="checkbox" part="checkbox"></div>
            </div>
            <div class="label-wrapper" part="label-wrapper"></div>
        </div>
      `;
    }

    setupRefs() {
        this.checkboxElement = this.shadowRoot.querySelector(".checkbox");
        this.labelWrapperElement =
            this.shadowRoot.querySelector(".label-wrapper");
    }

    updateComponent() {
        const label = this.getAttribute("label") || "";
        const checked = this.hasAttribute("checked");
        const disabled = this.hasAttribute("disabled");
        const labelPosition = this.getAttribute("label-position") || "left";

        this.setAttribute("label-position", labelPosition);
        this.labelWrapperElement.textContent = label;

        this.checkboxElement.classList.toggle("checked", checked);
        this.labelWrapperElement.classList.toggle("checked", checked);

        this.checkboxElement.classList.toggle("disabled", disabled);
        this.labelWrapperElement.classList.toggle("disabled", disabled);

        // Update the hidden checkbox input.
        this.updateHiddenInput();
    }

    updateHiddenInput() {
        if (this.inputElement) {
            this.inputElement.name = this.getAttribute("name") || "";
            this.inputElement.value = this.getAttribute("value") || "on";
            this.inputElement.checked = this.hasAttribute("checked");
        }
    }

    addEventListeners() {
        this.checkboxElement.addEventListener("click", (event) => {
            if (this.hasAttribute("disabled")) return;
            const isChecked = this.hasAttribute("checked");
            if (isChecked) {
                this.removeAttribute("checked");
            } else {
                this.setAttribute("checked", "");
            }
            this.updateHiddenInput();
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { checked: !isChecked },
                    bubbles: true,
                    composed: true,
                })
            );
        });
    }
}

if (!customElements.get("kp-checkbox")) {
    customElements.define("kp-checkbox", KeplerCheckbox);
}
