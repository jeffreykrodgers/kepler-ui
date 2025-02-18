class KeplerRadio extends HTMLElement {
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
                    padding: var(--spacing-medium, 16px);
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
                    background-color: var(--base-surface, rgba(241,246,250,1));
                    color: var(--base-text--, rgba(29,29,29,1));
                    padding: 0;
                }

                .radio {
                    width: 20px;
                    height: 20px;
                    border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
                    border-radius: 50%;
                    background: var(--base-surface, rgba(241,246,250,1));
                    position: relative;
                    cursor: pointer;
                }

                .radio.checked {
                    border-color: var(--primary--, rgba(4,134,209,1));
                    background: var(--primary--, rgba(4,134,209,1));
                }

                .radio.checked::after {
                    content: "";
                    width: 10px;
                    height: 10px;
                    background: var(--primary-background--, rgba(245,250,250,1));
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
                    color: var(--base-surface, rgba(241,246,250,1));
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
