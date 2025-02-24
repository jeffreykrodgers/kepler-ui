class KeplerSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
        this.render();
        this.setupRefs();
        this.addEventListeners();
        this.selectedValues = new Set(); // To track selected values
    }

    static get observedAttributes() {
        return [
            "label",
            "label-position",
            "options",
            "multiple",
            "selection-mode",
            "value",
            "required",
            "invalid",
            "placeholder",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                // When the value attribute changes, update via the setter.
                this.value = newValue;
            } else if (
                [
                    "label",
                    "label-position",
                    "options",
                    "multiple",
                    "selection-mode",
                ].includes(name)
            ) {
                this.updateComponent();
            } else if (["required", "invalid", "placeholder"].includes(name)) {
                this.updateComponent();
            }
        }
    }

    connectedCallback() {
        if (
            this.hasAttribute("invalid") &&
            !this.hasAttribute("data-manual-invalid")
        ) {
            this.setAttribute("data-manual-invalid", "true");
        }
        this.updateComponent();
        this.manageDefaultIconVisibility();

        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.appendChild(this.hiddenInput);
        }
        this.updateHiddenInput();
    }

    injectGlobalFonts() {
        if (document.getElementById("kepler-fonts")) return; // Prevent duplicate injection

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

    render() {
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
            color: var(--base-surface, rgba(241,246,250,1));
            background: var(--base-text--, rgba(29,29,29,1));
            padding: var(--spacing-medium, 8px);
            border-radius: var(--border-small, 1px);
            gap: var(--spacing-small, 8px);
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          .label-wrapper.selected {
            background-color: var(--primary--, rgba(4,134,209,1));
            color: var(--primary-background--, rgba(245,250,250,1));
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
          :host([label-position="top"]) .label-wrapper,
          :host([label-position="bottom"]) .label-wrapper {
            background: var(--base-surface, rgba(241,246,250,1));
            color: var(--base-text--, rgba(29,29,29,1));
            padding: 0;
          }
          :host([label-position="top"]) .select-container,
          :host([label-position="bottom"]) .select-container {
            gap: 0;
          }
          .select-wrapper {
            position: relative;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            padding: var(--spacing-medium, 8px);
            border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
            border-radius: var(--border-small, 1px);
            background: var(--base-surface, rgba(241,246,250,1));
            color: var(--base-text--, rgba(29,29,29,1));
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
            border-color: var(--primary--, rgba(4,134,209,1));
            background: var(--base-hover, rgba(215,219,222,1));
          }
          /* Invalid state styles */
          :host([invalid]) .select-wrapper {
              border-color: var(--error--, rgba(217,4,40,1));
              background: var(--error-background--, #ffe6e6);
          }
          :host([invalid]) .select-wrapper:hover {
              background: var(--error-background-hover, #ffdcdc);
          }
          :host([invalid]) .select-wrapper:active,
          :host([invalid]) .select-wrapper:focus-within {
              background: var(--error-background-active, #ffc0c0);
          }
          :host([invalid][label-position="top"]) .label-wrapper,
          :host([invalid][label-position="bottom"]) .label-wrapper {
              color: var(--error--, rgba(217,4,40,1));
          }
          :host([invalid][label-position="left"]) .label-wrapper,
          :host([invalid][label-position="right"]) .label-wrapper {
              background-color: var(--error--, rgba(217,4,40,1));
          }
          .dropdown {
            display: none;
            position: absolute;
            top: calc(100% + var(--spacing-x-small, 4px));
            left: 0;
            width: 100%;
            box-sizing: border-box;
            background: var(--base-text--, rgba(29,29,29,1));
            z-index: 10;
            max-height: 200px;
            overflow-y: auto;
            box-shadow: var(--shadow-medium, 0 4px 8px rgba(0,0,0,0.2));
          }
          .dropdown.open {
            display: block;
          }
          .dropdown-item {
            padding: var(--spacing-medium, 8px);
            font-size: var(--font-size, 16px);
            font-family: Tomorrow, sans-serif;
            color: var(--base-surface, rgba(241,246,250,1));
            background: var(--base-text--, rgba(29,29,29,1));
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          .dropdown-item:hover {
            background: var(--base-text-emphasize, rgba(56,56,57,1));
          }
          .dropdown-item.selected {
            background: var(--primary--, rgba(4,134,209,1));
            color: var(--primary-background--, rgba(245,250,250,1));
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
            stroke: var(--base-text--, rgba(29,29,29,1));
            fill: none;
            transition: transform 0.2s ease;
          }
          .select-wrapper.open .default-icon svg {
            transform: rotate(180deg);
          }
          .selected-value {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            max-width: 100%;
            overflow: hidden;
            align-items: center;
          }
          .tag {
            display: inline-flex;
            align-items: center;
            background: var(--base-text--, #007bff);
            color: var(--base-surface, rgba(241,246,250,1));
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 14px;
          }
          .tag .remove {
            margin-left: 8px;
            cursor: pointer;
            color: var(--primary-background--, rgba(245,250,250,1));
            font-size: 12px;
          }
        </style>
        <div class="select-container" part="select-container">
          <div class="label-wrapper" part="label-wrapper">
            <span class="label-icon left-label-icon" part="left-label-icon"><slot name="left-label-icon"></slot></span>
            <span class="label-text" part="label-text"></span>
            <span class="label-icon right-label-icon" part="right-label-icon"><slot name="right-label-icon"></slot></span>
          </div>
          <div class="select-wrapper" part="select-wrapper" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false">
            <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
            <span class="selected-value" aria-live="polite" part="selected-value"></span>
            <span class="icon right-icon" part="right-icon">
              <slot name="right-icon"></slot>
              <span class="default-icon" part="default-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
                  <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                </svg>
              </span>
            </span>
            <div class="dropdown" part="dropdown" role="listbox"></div>
          </div>
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
        this.leftLabelIcon = this.shadowRoot.querySelector(
            ".label-icon.left-label-icon"
        );
        this.rightLabelIcon = this.shadowRoot.querySelector(
            ".label-icon.right-label-icon"
        );

        this.manageSlotVisibility("left-label-icon", this.leftLabelIcon);
        this.manageSlotVisibility("right-label-icon", this.rightLabelIcon);
    }

    updateSelectedDisplay(multiple, selectionMode) {
        if (multiple) {
            const options =
                this._options ||
                JSON.parse(this.getAttribute("options") || "[]");
            const selectedOptions = options.filter((opt) =>
                this.selectedValues.has(opt.value)
            );

            if (selectionMode === "combined") {
                this.selectedValueElement.textContent = `${selectedOptions.length} Items Selected`;
            } else {
                this.selectedValueElement.innerHTML = selectedOptions
                    .map(
                        (opt) => `
                  <span class="tag">
                      ${opt.label}
                      <span class="remove" data-value="${opt.value}">✕</span>
                  </span>`
                    )
                    .join("");
            }
        } else {
            const options =
                this._options ||
                JSON.parse(this.getAttribute("options") || "[]");
            const selected = options.find((opt) => opt.selected);
            const placeholder =
                this.getAttribute("placeholder") || "Select an option";
            this.selectedValueElement.textContent = selected
                ? selected.label
                : placeholder;
        }
    }

    updateComponent() {
        const label = this.getAttribute("label") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        let options = JSON.parse(this.getAttribute("options") || "[]");
        const multiple = this.hasAttribute("multiple");
        const selectionMode = this.getAttribute("selection-mode") || "combined";

        if (this.hasAttribute("value")) {
            const valueAttr = this.getAttribute("value");
            const selectedValues = multiple
                ? valueAttr.split(",").map((val) => val.trim())
                : [valueAttr.trim()];
            options = options.map((opt) => ({
                ...opt,
                selected: selectedValues.includes(opt.value),
            }));
            if (multiple) {
                this.selectedValues = new Set(selectedValues);
            }
        }

        this._options = options;

        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);

        this.dropdown.innerHTML = options
            .map(
                (opt) => `
              <div 
                class="dropdown-item ${opt.selected ? "selected" : ""}"
                data-value="${opt.value}"
                role="option"
                part="dropdown-item"
                aria-selected="${opt.selected ? "true" : "false"}">
                  ${opt.label}
              </div>`
            )
            .join("");

        if (multiple) {
            if (!this.selectedValues.size) {
                this.selectedValues = new Set(
                    options
                        .filter((opt) => opt.selected)
                        .map((opt) => opt.value)
                );
            }
        }
        this.updateSelectedDisplay(multiple, selectionMode);
        this.updateHiddenInput();
        this.updateValidation();
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

        updateVisibility();
        slot.addEventListener("slotchange", updateVisibility);
    }

    addEventListeners() {
        this.selectWrapper.addEventListener("focus", () => {
            this.labelWrapper.classList.add("selected");
        });

        this.selectWrapper.addEventListener("blur", () => {
            this.labelWrapper.classList.remove("selected");
            this.updateValidation();
        });

        this.selectWrapper.addEventListener("click", (event) => {
            // Prevent opening the dropdown if the click is on a remove button
            if (event.target.closest(".remove")) {
                event.stopPropagation();
                return;
            }

            const isOpen = this.dropdown.classList.toggle("open");
            this.selectWrapper.classList.toggle("open", isOpen);
            this.selectWrapper.setAttribute("aria-expanded", isOpen.toString());
        });

        this.dropdown.addEventListener("click", (event) => {
            event.stopPropagation();

            const item = event.target.closest(".dropdown-item");
            if (item) {
                const value = item.getAttribute("data-value");
                const multiple = this.hasAttribute("multiple");
                const selectionMode =
                    this.getAttribute("selection-mode") || "combined";

                if (multiple) {
                    if (this.selectedValues.has(value)) {
                        this.selectedValues.delete(value);
                        item.classList.remove("selected");
                    } else {
                        this.selectedValues.add(value);
                        item.classList.add("selected");
                    }
                    this.updateSelectedDisplay(multiple, selectionMode);
                } else {
                    this.shadowRoot
                        .querySelectorAll(".dropdown-item")
                        .forEach((el) => el.classList.remove("selected"));
                    item.classList.add("selected");
                    this.selectedValueElement.textContent = item.textContent;
                    this.closeDropdown();
                }

                this.updateHiddenInput();
                this.updateValidation();

                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: {
                            value: multiple
                                ? Array.from(this.selectedValues)
                                : value,
                        },
                        bubbles: true,
                        composed: true,
                    })
                );
            }
        });

        document.addEventListener("click", (event) => {
            const path = event.composedPath();
            if (!path.includes(this)) {
                this.closeDropdown();
            }
        });

        this.selectedValueElement.addEventListener("click", (event) => {
            const removeButton = event.target.closest(".remove");
            if (removeButton) {
                event.stopPropagation();
                const value = removeButton.getAttribute("data-value");
                this.selectedValues.delete(value);
                const item = this.shadowRoot.querySelector(
                    `.dropdown-item[data-value="${value}"]`
                );
                if (item) {
                    item.classList.remove("selected");
                }
                this.updateSelectedDisplay(
                    true,
                    this.getAttribute("selection-mode") || "combined"
                );
                this.updateHiddenInput();
                this.updateValidation();
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { value: Array.from(this.selectedValues) },
                        bubbles: true,
                        composed: true,
                    })
                );
            }
        });
    }

    closeDropdown() {
        this.dropdown.classList.remove("open");
        this.selectWrapper.classList.remove("open");
        this.selectWrapper.setAttribute("aria-expanded", "false");
        this.manageDefaultIconVisibility();
    }

    updateHiddenInput() {
        if (this.hiddenInput) {
            this.hiddenInput.name = this.getAttribute("name") || "";
            if (this.hasAttribute("multiple")) {
                this.hiddenInput.value = Array.from(this.selectedValues).join(
                    ","
                );
            } else {
                const selectedItem = this.shadowRoot.querySelector(
                    ".dropdown-item.selected"
                );
                this.hiddenInput.value = selectedItem
                    ? selectedItem.getAttribute("data-value")
                    : "";
            }
        }
    }

    updateValidation() {
        if (this.hasAttribute("required")) {
            const multiple = this.hasAttribute("multiple");
            if (multiple) {
                if (this.selectedValues.size === 0) {
                    this.setAttribute("invalid", "");
                } else {
                    this.removeAttribute("invalid");
                }
            } else {
                const value = this.value;
                if (!value || value === "Select an option") {
                    this.setAttribute("invalid", "");
                } else {
                    this.removeAttribute("invalid");
                }
            }
        } else {
            this.removeAttribute("invalid");
        }
    }

    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            const selectedItem = this.shadowRoot.querySelector(
                ".dropdown-item.selected"
            );
            return selectedItem ? selectedItem.getAttribute("data-value") : "";
        }
    }

    set value(newVal) {
        const multiple = this.hasAttribute("multiple");
        if (typeof newVal === "string") {
            if (multiple) {
                const values = newVal.split(",").map((val) => val.trim());
                this.selectedValues = new Set(values);
            } else {
                this.selectedValues = new Set([newVal.trim()]);
            }
        } else if (Array.isArray(newVal)) {
            this.selectedValues = new Set(newVal);
        }

        this.updateComponent();
        this.updateSelectedDisplay(
            multiple,
            this.getAttribute("selection-mode") || "combined"
        );
        this.updateHiddenInput();
        this.updateValidation();
    }

    setOptions(options) {
        this.setAttribute("options", JSON.stringify(options));
    }

    setValue(val) {
        this.setAttribute("value", val);
    }

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

if (!customElements.get("kp-select")) {
    customElements.define("kp-select", KeplerSelect);
}
