class KeplerSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.setupRefs();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "min",
            "max",
            "step",
            "disabled",
            "value",
            "name",
            "label",
            "label-position",
            "aria-label",
            "aria-hidden",
        ];
    }

    // Sync attribute changes to the internal slider and update the hidden input and styling.
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "label" || name === "label-position") {
                this.updateLabel();
            } else {
                this.syncAttributesToInput(name, newValue);
            }
            this.updateHiddenInput();
            this.updateSliderBackground();
        }
    }

    connectedCallback() {
        this.syncAttributes();

        // Create and append the hidden input if it doesn't exist.
        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.hiddenInput.value = this.inputElement.value;
            this.appendChild(this.hiddenInput);
        }
        this.updateHiddenInput();
        this.updateSliderBackground();
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
                    background-color: var(--base-surface, #fff);
                    color: var(--base-text--, #000);
                    padding: 0;
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
                :host([label-position="top"]) .input-container,
                :host([label-position="bottom"]) .input-container {
                    gap: 0;
                }
                .input-wrapper {
                    box-sizing: border-box;
                    display: flex;
                    flex: 1 0 auto;
                    align-items: center;
                    padding: var(--spacing-2x-small, 2px);
                    border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
                    border-radius: var(--border-small, 5px);
                    background: var(--base-surface);
                    color: var(--base-text);
                    font-family: Tomorrow, sans-serif;
                    font-size: var(--font-size, 16px);
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                    min-height: 40px;
                }
                .input-wrapper:focus-within {
                    border-color: var(--primary--);
                    background: var(--base-hover);
                }
                input[type="range"] {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    -webkit-appearance: none;
                }
                /* Slider Track */
                input[type="range"]::-webkit-slider-runnable-track {
                    height: 30px;
                    background: linear-gradient(
                        to right,
                        var(--primary--, #007bff) 0%,
                        var(--primary--, #007bff) var(--slider-percentage, 50%),
                        var(--base-surface, #ddd) var(--slider-percentage, 50%),
                        var(--base-surface, #ddd) 100%
                    );
                }
                input[type="range"]::-moz-range-track {
                    height: 30px;
                    background: linear-gradient(
                        to right,
                        var(--primary--, #007bff) 0%,
                        var(--primary--, #007bff) var(--slider-percentage, 50%),
                        var(--base-surface, #ddd) var(--slider-percentage, 50%),
                        var(--base-surface, #ddd) 100%
                    );
                }

                }
                /* Slider Thumb (Square Grabber) */
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: var(--spacing-medium);
                    height: 26px; /* Added semicolon here */
                    background: var(--base-text--);
                    border: 2px solid var(--base-text--, #ccc);
                    border-radius: 0;
                    cursor: pointer;
                    margin-top: -8px;
                }

                input[type="range"]::-moz-range-thumb {
                    width: var(--spacing-medium);
                    height: 26px;
                    background: var(--base-text--);
                    border: 2px solid var(--base-text--, #ccc);
                    border-radius: 0;
                    cursor: pointer;
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
                <div class="label-wrapper" part="label">
                    <span class="label-icon left-label-icon"><slot name="left-label-icon"></slot></span>
                    <span class="label-text"></span>
                    <span class="label-icon right-label-icon"><slot name="right-label-icon"></slot></span>
                </div>
                <div class="input-wrapper" part="input">
                    <span class="icon left-icon"><slot name="left-icon"></slot></span>
                    <input type="range" />
                    <span class="icon right-icon"><slot name="right-icon"></slot></span>
                </div>
            </div>
        `;
    }

    setupRefs() {
        this.inputElement = this.shadowRoot.querySelector(
            "input[type='range']"
        );
        this.labelTextElement = this.shadowRoot.querySelector(".label-text");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");

        // Manage slot visibility for optional icons
        this.manageSlotVisibility("left-label-icon", ".left-label-icon");
        this.manageSlotVisibility("right-label-icon", ".right-label-icon");
        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");
    }

    // List of attributes to sync to the input element.
    static get inputAttributes() {
        return [
            "min",
            "max",
            "step",
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
        ];
    }

    syncAttributes() {
        KeplerSlider.inputAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.syncAttributesToInput(attr, this.getAttribute(attr));
            }
        });
        this.updateLabel();
    }

    syncAttributesToInput(name, value) {
        if (value === null) {
            this.inputElement.removeAttribute(name);
        } else {
            this.inputElement.setAttribute(name, value);
        }
    }

    updateLabel() {
        const label = this.getAttribute("label") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        this.labelTextElement.textContent = label;
        this.setAttribute("label-position", labelPosition);
    }

    manageSlotVisibility(slotName, selector) {
        const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);
        const container = this.shadowRoot.querySelector(selector);

        const updateVisibility = () => {
            const hasContent = slot && slot.assignedNodes().length > 0;
            container.classList.toggle("hidden", !hasContent);
        };

        if (slot) {
            slot.addEventListener("slotchange", updateVisibility);
            updateVisibility();
        }
    }

    updateHiddenInput() {
        if (this.hiddenInput) {
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.hiddenInput.value = this.inputElement.value;
        }
    }

    // Update the slider’s background to show a primary-colored trail
    updateSliderBackground() {
        const min = parseFloat(this.inputElement.getAttribute("min")) || 0;
        const max = parseFloat(this.inputElement.getAttribute("max")) || 100;
        const value = parseFloat(this.inputElement.value) || 0;
        const percentage = ((value - min) / (max - min)) * 100;
        this.inputElement.style.setProperty(
            "--slider-percentage",
            percentage + "%"
        );
    }

    addEventListeners() {
        this.inputElement.addEventListener("focus", () => {
            this.labelWrapper.classList.add("selected");
        });

        this.inputElement.addEventListener("blur", () => {
            this.labelWrapper.classList.remove("selected");
        });

        this.inputElement.addEventListener("input", () => {
            this.updateHiddenInput();
            this.updateSliderBackground();
            this.dispatchEvent(
                new CustomEvent("input", {
                    detail: { value: this.inputElement.value },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.inputElement.addEventListener("change", () => {
            this.setAttribute("value", this.inputElement.value);
            this.dispatchEvent(
                new Event("change", { bubbles: true, composed: true })
            );
        });
    }

    get value() {
        return this.inputElement.value;
    }

    set value(newValue) {
        this.setAttribute("value", newValue);
    }
}

customElements.define("kp-slider", KeplerSlider);
