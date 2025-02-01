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
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (
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
                .selected-value {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    max-width: 100%;
                    overflow: hidden;
                    align-items: center;

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
        // Reference elements
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
                // Separate mode
                this.selectedValueElement.innerHTML = selectedOptions
                    .map(
                        (opt) => `
                        <span class="tag">
                            ${opt.label} <!-- Display label instead of value -->
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
        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);

        const options = JSON.parse(this.getAttribute("options") || "[]");
        const multiple = this.hasAttribute("multiple");
        const selectionMode = this.getAttribute("selection-mode") || "combined";

        // Populate dropdown
        this.dropdown.innerHTML = options
            .map(
                (opt) => `
                <div class="dropdown-item ${opt.selected ? "selected" : ""}" data-value="${opt.value}" role="option" aria-selected="${opt.selected ? "true" : "false"}">
                    ${opt.label}
                </div>`
            )
            .join("");

        // Update selected values for multiple mode
        if (multiple) {
            this.selectedValues = new Set(
                options.filter((opt) => opt.selected).map((opt) => opt.value)
            );
        } else {
            const selected = options.find((opt) => opt.selected);
            this.selectedValueElement.textContent =
                selected?.label || "Select an option";
        }

        this.updateSelectedDisplay(multiple, selectionMode);
    }

    manageDefaultIconVisibility() {
        // Show or hide the default icon based on the presence of a right icon
        const hasRightIcon =
            this.rightIconSlot.assignedNodes().length > 0 ||
            this.rightIconSlot.innerHTML.trim().length > 0;
        this.defaultIcon.style.display = hasRightIcon ? "none" : "inline-block";
    }

    manageSlotVisibility(slotName, element) {
        // Manage visibility of slot elements
        const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);
        const updateVisibility = () => {
            const hasContent = slot.assignedNodes().length > 0;
            element.classList.toggle("hidden", !hasContent);
        };
        updateVisibility();
        slot.addEventListener("slotchange", updateVisibility);
    }

    addEventListeners() {
        this.selectWrapper.addEventListener("click", () => {
            const isOpen = this.dropdown.classList.toggle("open");
            this.selectWrapper.classList.toggle("open", isOpen);
            this.selectWrapper.setAttribute("aria-expanded", isOpen.toString());
        });

        this.dropdown.addEventListener("click", (event) => {
            // Prevent the click event from bubbling up to the select wrapper
            event.stopPropagation();

            const item = event.target.closest(".dropdown-item");
            if (item) {
                const value = item.getAttribute("data-value");
                const multiple = this.hasAttribute("multiple");
                const selectionMode =
                    this.getAttribute("selection-mode") || "combined";

                if (multiple) {
                    // Toggle selection for multiselect mode
                    if (this.selectedValues.has(value)) {
                        this.selectedValues.delete(value);
                        item.classList.remove("selected");
                    } else {
                        this.selectedValues.add(value);
                        item.classList.add("selected");
                    }
                    this.updateSelectedDisplay(multiple, selectionMode);
                    // Do not close the dropdown in multiselect mode
                } else {
                    // In single select mode, clear any previous selection
                    this.shadowRoot
                        .querySelectorAll(".dropdown-item")
                        .forEach((el) => el.classList.remove("selected"));
                    item.classList.add("selected");
                    this.selectedValueElement.textContent = item.textContent;
                    // Explicitly close the dropdown in single select mode
                    this.closeDropdown();
                }

                // Update the hidden input based on the current selection(s)
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
            if (!this.contains(event.target)) {
                this.closeDropdown();
            }
        });

        this.selectedValueElement.addEventListener("click", (event) => {
            const removeButton = event.target.closest(".remove");
            if (removeButton) {
                const value = removeButton.getAttribute("data-value");
                this.selectedValues.delete(value);
                this.updateSelectedDisplay(
                    true,
                    this.getAttribute("selection-mode") || "combined"
                );
                // Update the hidden input after removal
                this.updateHiddenInput();
            }
        });
    }

    closeDropdown() {
        // Close the dropdown and reset state
        this.dropdown.classList.remove("open");
        this.selectWrapper.classList.remove("open");
        this.selectWrapper.setAttribute("aria-expanded", "false");
        this.manageDefaultIconVisibility();
        this.updateLabelState(false);
    }

    updateLabelState(isSelected) {
        // Update the label state based on selection
        this.labelWrapper.classList.toggle("selected", isSelected);
    }

    updateHiddenInput() {
        if (this.hiddenInput) {
            // Update the name from the component's attribute
            this.hiddenInput.name = this.getAttribute("name") || "";
            if (this.hasAttribute("multiple")) {
                // For multiple selections, join selected values with commas
                this.hiddenInput.value = Array.from(this.selectedValues).join(
                    ","
                );
            } else {
                // For single select, find the selected dropdown item
                const selectedItem = this.shadowRoot.querySelector(
                    ".dropdown-item.selected"
                );
                this.hiddenInput.value = selectedItem
                    ? selectedItem.getAttribute("data-value")
                    : "";
            }
        }
    }
}

// Define the custom element
customElements.define("kp-select", KeplerSelect);
