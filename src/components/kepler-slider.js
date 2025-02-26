class KeplerSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
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
                    gap: var(--spacing-small, 4px);
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
                    gap: var(--spacing-small, 4px);
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
                :host([disabled]) .input-wrapper {
                    opacity: 0.8;
                    pointer-events: none;
                }

                /* Apply diagonal pattern only for left/right label positions */
                :host([disabled][label-position="left"]) .label-wrapper,
                :host([disabled][label-position="right"]) .label-wrapper {
                    position: relative;
                    overflow: hidden;
                    opacity: 0.6; /* Match button, input, and select */
                    border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
                }

                /* Diagonal pattern overlay */
                :host([disabled][label-position="left"]) .label-wrapper::before,
                :host([disabled][label-position="right"]) .label-wrapper::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%; /* Ensures no extra height */
                    background: repeating-linear-gradient(
                        -45deg,
                        var(--base-border, rgba(215,219,222,1)) 0,
                        var(--base-border, rgba(215,219,222,1)) 2px,
                        transparent 3px,
                        transparent 10px
                    );
                    opacity: 1;
                    z-index: 0;
                }

                /* Keep label text readable */
                :host([disabled][label-position="left"]) .label-text,
                :host([disabled][label-position="right"]) .label-text {
                    position: relative;
                    z-index: 1;
                    background: var(--base-text--, rgba(29,29,29,1));
                    padding: 0 4px; /* Prevent height changes */
                    border-radius: 2px;
                    line-height: 1;
                }

                /* Disable slider interactions */
                :host([disabled]) input[type="range"] {
                    pointer-events: none;
                    opacity: 0.6;
                }

                :host([disabled][label-position="left"]) .input-wrapper {
                    border-color: var(--base-border, rgba(215,219,222,1));
                }

                .input-wrapper {
                    box-sizing: border-box;
                    display: flex;
                    flex: 1 0 auto;
                    align-items: center;
                    padding: var(--spacing-2x-small, 2px);
                    border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
                    border-radius: var(--border-small, 1px);
                    background: var(--base-surface, rgba(241,246,250,1));
                    color: var(--base-text--, rgba(29,29,29,1));
                    font-family: Tomorrow, sans-serif;
                    font-size: var(--font-size, 16px);
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                    min-height: 40px;
                }
                .input-wrapper:focus-within {
                    border-color: var(--primary--, rgba(4,134,209,1));
                    background: var(--base-hover, rgba(215,219,222,1));
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
                        var(--primary--, rgba(4,134,209,1)) 0%,
                        var(--primary--, rgba(4,134,209,1)) var(--slider-percentage, 50%),
                        var(--base-surface, rgba(241,246,250,1)) var(--slider-percentage, 50%),
                        var(--base-surface, rgba(241,246,250,1)) 100%
                    );
                }
                input[type="range"]::-moz-range-track {
                    height: 30px;
                    background: linear-gradient(
                        to right,
                        var(--primary--, rgba(4,134,209,1)) 0%,
                        var(--primary--, rgba(4,134,209,1)) var(--slider-percentage, 50%),
                        var(--base-surface, rgba(241,246,250,1)) var(--slider-percentage, 50%),
                        var(--base-surface, rgba(241,246,250,1)) 100%
                    );
                }
                /* Slider Thumb (Square Grabber) */
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: var(--spacing-medium, 8px);
                    height: 30px;
                    background: var(--base-text--, rgba(29,29,29,1));
                    border: 2px solid var(--base-text--, rgba(29,29,29,1));
                    border-radius: 0;
                    cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                    width: var(--spacing-medium, 8px);
                    height: 26px;
                    background: var(--base-text--, rgba(29,29,29,1));
                    border: 2px solid var(--base-text--, rgba(29,29,29,1));
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
                    <span class="label-icon left-label-icon" part="left-label-icon"><slot name="left-label-icon"></slot></span>
                    <span class="label-text" part="label-text"></span>
                    <span class="label-icon right-label-icon" part="right-label-icon"><slot name="right-label-icon"></slot></span>
                </div>
                <div class="input-wrapper" part="input">
                    <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
                    <input type="range" part="range"/>
                    <span class="icon right-icon" part="right-icon"><slot name="right-icon"></slot></span>
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
            const hasContent = slot.assignedNodes().length > 0;
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

if (!customElements.get("kp-slider")) {
    customElements.define("kp-slider", KeplerSlider);
}
