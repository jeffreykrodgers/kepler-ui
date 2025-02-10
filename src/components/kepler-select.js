class KeplerSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
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
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                // When the value attribute changes, update the property via the setter
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
            }
        }
    }

    connectedCallback() {
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
          :host([label-position="top"]) .label-wrapper,
          :host([label-position="bottom"]) .label-wrapper {
            background: var(--base-surface, #fff);
            color: var(--base-text--, #000);
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
            top: calc(100% + var(--spacing-x-small, 4px));
            left: 0;
            width: 100%;
            box-sizing: border-box;
            background: var(--base-text--);
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
            color: var(--base-background, #000);
            background: var(--base-text--);
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          .dropdown-item:hover {
            background: var(--base-text-emphasize);
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
            color: var(--base-surface, #fff);
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 14px;
          }
          .tag .remove {
            margin-left: 8px;
            cursor: pointer;
            color: var(--primary-background--, #fff);
            font-size: 12px;
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
            const options = JSON.parse(this.getAttribute("options") || "[]");
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

        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);

        this.dropdown.innerHTML = options
            .map(
                (opt) => `
            <div class="dropdown-item ${opt.selected ? "selected" : ""}" data-value="${opt.value}" role="option" aria-selected="${opt.selected ? "true" : "false"}">
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
        } else {
            const selected = options.find((opt) => opt.selected);
            this.selectedValueElement.textContent =
                selected?.label || "Select an option";
        }

        this.updateSelectedDisplay(multiple, selectionMode);
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
                event.stopPropagation(); // ✅ Prevents opening dropdown
                const value = removeButton.getAttribute("data-value");

                // Remove the value from the selectedValues set
                this.selectedValues.delete(value);

                // Find the corresponding dropdown item and remove the "selected" class
                const item = this.shadowRoot.querySelector(
                    `.dropdown-item[data-value="${value}"]`
                );
                if (item) {
                    item.classList.remove("selected");
                }

                // Update the displayed selected values
                this.updateSelectedDisplay(
                    true,
                    this.getAttribute("selection-mode") || "combined"
                );

                // Update the hidden input field
                this.updateHiddenInput();

                // Dispatch the change event
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: {
                            value: Array.from(this.selectedValues),
                        },
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
        this.updateLabelState(false);
    }

    updateLabelState(isSelected) {
        this.labelWrapper.classList.toggle("selected", isSelected);
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
    }

    setOptions(options) {
        this.setAttribute("options", JSON.stringify(options));
    }

    setValue(val) {
        this.setAttribute("value", val);
    }
}

if (!customElements.get("kp-select")) {
    customElements.define("kp-select", KeplerSelect);
}
