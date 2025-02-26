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
        return ["options", "name", "value", "disabled", "label-position"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                this.updateSelection();
            } else {
                this.updateComponent();
            }
            this.updateHiddenInput();
        }
    }

    connectedCallback() {
        this.updateComponent();

        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name =
                this.getAttribute("name") || `radio-${Date.now()}`;
            this.hiddenInput.value = this.getAttribute("value") || "";
            this.appendChild(this.hiddenInput);
        }
        this.updateHiddenInput();
    }

    injectGlobalFonts() {
        if (document.getElementById("kepler-fonts")) return;

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
                gap: var(--spacing-large, 16px);
                width: 100%;
            }

            :host([label-position="left"]) .radio-container {
                flex-direction: row-reverse;
                justify-content: flex-end;
            }

            :host([label-position="top"]) .radio-container {
                flex-direction: column-reverse;
                align-items: flex-start;
            }

            :host([label-position="bottom"]) .radio-container {
                flex-direction: column;
                align-items: flex-start;
            }

            .radio {
                width: 20px;
                height: 20px;
                border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
                border-radius: 50%;
                background: var(--base-surface, rgba(241,246,250,1));
                position: relative;
                cursor: pointer;
                transition: border-color 0.2s ease, background-color 0.2s ease;
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
                display: flex;
                align-items: center;
                position: relative;
                background: var(--base-text--, rgba(29,29,29,1));
                color: var(--base-surface, rgba(241,246,250,1));
                font-family: ProFontWindows, sans-serif;
                font-size: 21px;
                font-weight: 500;
                padding: var(--spacing-medium, 8px);
                min-height: 40px;
                min-width: 40px;
                border-radius: var(--border-small, 1px);
                box-sizing: border-box;
                cursor: pointer;
            }

            .label-text {
                background: var(--base-text--, rgba(29,29,29,1));
                z-index: 1;
                padding: 0 var(--spacing-small, 2px);
            }

            :host([disabled]) .radio {
                opacity: 0.8;
                pointer-events: none;
            }

            /* Disabled Labels */
            :host([disabled]) .label,
            .label.disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }

            /* Apply diagonal pattern to disabled labels */
            :host([disabled][label-position="left"]) .label,
            :host([disabled][label-position="right"]) .label {
                overflow: hidden;
                opacity: 0.6;
                border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            }

            :host([disabled][label-position="left"]) .label::before,
            :host([disabled][label-position="right"]) .label::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
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
            
            :host([disabled]) .radio {
                border-color: var(--base-border, rgba(215,219,222,1));
            }
        </style>
        <div class="radio-group" part="radio-group"></div>
        `;
    }

    setupRefs() {
        this.radioGroup = this.shadowRoot.querySelector(".radio-group");
    }

    updateComponent() {
        const options = JSON.parse(this.getAttribute("options") || "[]");
        const name = this.getAttribute("name") || `radio-${Date.now()}`;
        const selectedValue = this.getAttribute("value") || "";
        const disabled = this.hasAttribute("disabled");

        this.radioGroup.innerHTML = options
            .map(
                (opt) => `
                <div class="radio-container" part="radio-container">
                    <div class="radio" 
                        data-value="${opt.value}" 
                        part="radio"
                        class="${opt.value === selectedValue ? "checked" : ""} ${disabled ? "disabled" : ""}">
                    </div>
                    <div class="label ${disabled ? "disabled" : ""}" part="label">
                        <span class="label-text" part="label-text">${opt.label}</span>
                    </div>
                </div>
            `
            )
            .join("");

        this.updateSelection();
    }

    updateSelection() {
        const selectedValue = this.getAttribute("value") || "";
        this.radioGroup.querySelectorAll(".radio").forEach((radio) => {
            const value = radio.getAttribute("data-value");
            radio.classList.toggle("checked", value === selectedValue);
        });
        this.updateHiddenInput();
    }

    updateHiddenInput() {
        if (this.hiddenInput) {
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.hiddenInput.value = this.getAttribute("value") || "";
        }
    }

    addEventListeners() {
        this.radioGroup.addEventListener("click", (event) => {
            const radio = event.target.closest(".radio");
            if (!radio || this.hasAttribute("disabled")) return;

            const selectedValue = radio.getAttribute("data-value");
            this.setAttribute("value", selectedValue);
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { value: selectedValue },
                    bubbles: true,
                    composed: true,
                })
            );

            this.updateSelection();
        });
    }
}

if (!customElements.get("kp-radio")) {
    customElements.define("kp-radio", KeplerRadio);
}
