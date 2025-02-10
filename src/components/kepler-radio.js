class KeplerRadio extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
        this.setupRefs();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "options",
            "name",
            "selected-value",
            "disabled",
            "label-position",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateComponent();
            this.updateHiddenInput();
        }
    }

    connectedCallback() {
        this.updateComponent();

        // Create and append the hidden input if it doesn't exist
        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name =
                this.getAttribute("name") || `radio-${Date.now()}`;
            // Set initial value from the "selected-value" attribute (if any)
            this.hiddenInput.value = this.getAttribute("selected-value") || "";
            this.appendChild(this.hiddenInput);
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

                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-small, 8px);
                    width: 100%;
                }

                .radio-container {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: var(--spacing-small, 8px);
                    width: 100%;
                }

                .radio-wrapper {
                    display: flex;
                    justify-content: flex-start;
                    padding: var(--spacing-medium);
                    align-items: center;
                    flex-grow: 1;
                }

                :host([label-position="top"]) .radio-container,
                :host([label-position="bottom"]) .radio-container {
                    gap: 0;
                }

                :host([label-position="left"]) .radio-container {
                    flex-direction: row-reverse;
                }

                :host([label-position="top"]) .radio-container {
                    flex-direction: column-reverse;
                    align-items: flex-start;
                }

                :host([label-position="bottom"]) .radio-container {
                    flex-direction: column;
                    align-items: flex-start;
                }

                :host([label-position="top"]) .label,
                :host([label-position="bottom"]) .label {
                    width: 100%;
                    justify-content: flex-start;
                    background-color: var(--base-surface, #fff);
                    color: var(--base-text--, #000);
                    padding: 0;
                }

                .radio {
                    width: 20px;
                    height: 20px;
                    border: var(--border-medium, 2px) solid var(--base-text--, #ccc);
                    border-radius: 50%;
                    background: var(--base-surface);
                    position: relative;
                    cursor: pointer;
                }

                .radio.checked {
                    border-color: var(--primary--);
                    background: var(--primary--);
                }

                .radio.checked::after {
                    content: "";
                    width: 10px;
                    height: 10px;
                    background: var(--primary-background--, #fff);
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .radio.disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .label {
                    box-sizing: border-box;
                    font-family: ProFontWindows, sans-serif;
                    font-size: 21px;
                    line-height: 24px;
                    font-weight: 500;
                    color: var(--base-surface, #fff);
                    background: var(--base-text--, #333);
                    padding: var(--spacing-medium, 16px);
                    cursor: pointer;
                }

                .label.disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }
            </style>
            <div class="radio-group"></div>
        `;
    }

    setupRefs() {
        this.radioGroup = this.shadowRoot.querySelector(".radio-group");
    }

    updateComponent() {
        const options = JSON.parse(this.getAttribute("options") || "[]");
        const name = this.getAttribute("name") || `radio-${Date.now()}`;
        const selectedValue = this.getAttribute("selected-value") || "";
        const disabled = this.hasAttribute("disabled");
        const labelPosition = this.getAttribute("label-position") || "right";

        this.setAttribute("label-position", labelPosition);

        this.radioGroup.innerHTML = options
            .map(
                (opt) => `
                <div class="radio-container">
                    <div class="radio-wrapper">
                        <div
                            class="radio ${opt.value === selectedValue ? "checked" : ""} ${disabled ? "disabled" : ""}"
                            data-value="${opt.value}"
                            part="radio"
                        ></div>
                    </div>
                    <div class="label ${disabled ? "disabled" : ""}" part="label">${opt.label}</div>
                </div>
            `
            )
            .join("");

        // Set the radio's name for each radio element
        this.radioGroup.querySelectorAll(".radio").forEach((radio) => {
            radio.setAttribute("name", name);
        });
    }

    updateHiddenInput() {
        if (this.hiddenInput) {
            this.hiddenInput.name = this.getAttribute("name") || "";
            // Set the hidden input's value to the currently selected value.
            // If your radio options represent booleans (e.g. "true" or "false"), then the hidden input will return that value.
            this.hiddenInput.value = this.getAttribute("selected-value") || "";
        }
    }

    addEventListeners() {
        this.radioGroup.addEventListener("click", (event) => {
            const radio = event.target.closest(".radio");
            if (!radio || this.hasAttribute("disabled")) {
                return;
            }

            const selectedValue = radio.getAttribute("data-value");
            this.setAttribute("selected-value", selectedValue);

            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { value: selectedValue },
                    bubbles: true,
                    composed: true,
                })
            );

            this.updateComponent();
            this.updateHiddenInput();
        });
    }
}

if (!customElements.get("kp-radio")) {
    customElements.define("kp-radio", KeplerRadio);
}
