class KeplerCheckbox extends HTMLElement {
    constructor() {
        super();

        // Defaults
        if (!this.hasAttribute("label-position")) {
            this.setAttribute("label-position", "right");
        }

        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
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
            "required",
            "invalid",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateComponent();
        }
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

    connectedCallback() {
        if (
            this.hasAttribute("invalid") &&
            !this.hasAttribute("data-manual-invalid")
        ) {
            this.setAttribute("data-manual-invalid", "true");
        }
        this.updateComponent();

        // Create a hidden checkbox input so that it accepts default checkbox properties.
        if (!this.inputElement) {
            this.inputElement = document.createElement("input");
            this.inputElement.type = "checkbox";

            // Hide the native checkbox.
            Object.assign(this.inputElement.style, {
                position: "absolute",
                opacity: "0",
                pointerEvents: "none",
                width: "0",
                height: "0",
            });

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
            gap: var(--spacing-small, 4px);
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
            background-color: var(--base-surface, var(--neutral-1, rgba(241,246,250,1)));
            color: var(--base-text--, var(--neutral-9, rgba(29,29,29,1)));
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
            border: var(--border-medium, 2px) solid var(--base-text--, var(--neutral-9, rgba(29,29,29,1)));
            border-radius: var(--border-small, 1px);
            background: var(--base-surface, var(--neutral-1, rgba(241,246,250,1)));
            position: relative;
            cursor: pointer;
            flex-shrink: 0;
            transition: background-color 0.2s ease, border-color 0.2s ease;
          }
          .checkbox.checked {
            background: var(--primary--, var(--blue--, rgba(4,134,209,1)));
            border-color: var(--primary--, var(--blue--, rgba(4,134,209,1)));
          }
          .checkbox.checked::after {
            content: "";
            width: 6px;
            height: 12px;
            border: solid var(--primary-background--, var(--blue-light-1, rgba(245,250,250,1)));
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
            color: var(--base-surface, var(--neutral-1, rgba(241,246,250,1)));
            background: var(--base-text--, var(--neutral-9, rgba(29,29,29,1)));
            transition: color 0.2s ease, background-color 0.2s ease;
            cursor: pointer;
          }
          .label-wrapper.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
          /* Invalid state styles with fallback values */
          :host([invalid]) .checkbox {
              border-color: var(--error--, var(--red--, rgba(217,4,40,1)));
              background: var(--error-background--, var(--red-light-1, rgba(250,245,246,1)));
          }
          :host([invalid]) .checkbox:hover {
              background: var(--error-background-hover, var(--red-light-2, rgba(246,215,220,1)));
          }
          :host([invalid]) .checkbox:active,
          :host([invalid]) .checkbox:focus {
              background: var(--error-background-active, var(--red-light-3, rgba(242,185,195,1)));
          }
          :host([invalid][label-position="top"]) .label-wrapper,
          :host([invalid][label-position="bottom"]) .label-wrapper {
              color: var(--error--, var(--red--, rgba(217,4,40,1)));
          }
          :host([invalid][label-position="left"]) .label-wrapper,
          :host([invalid][label-position="right"]) .label-wrapper {
              background-color: var(--error--, var(--red--, rgba(217,4,40,1)));
          }
        :host([disabled]) .checkbox {
            opacity: 0.8;
            pointer-events: none;
            border-color: var(--base-border, rgba(215,219,222,1));
        }

        .label-wrapper {
            display: flex;
            align-items: center;
            position: relative;
            background: var(--base-text--, rgba(29,29,29,1)); /* Match button & input */
            color: var(--base-surface, rgba(241,246,250,1));
            font-family: ProFontWindows, sans-serif;
            font-size: 21px;
            font-weight: 500;
            padding: var(--spacing-medium, 8px);
            min-height: 40px;
            min-width: 40px;
            border-radius: var(--border-small, 1px);
            box-sizing: border-box;
        }

        :host([disabled][label-position="left"]) .label-wrapper,
        :host([disabled][label-position="right"]) .label-wrapper {
            overflow: hidden;
            opacity: 0.6; /* Match other elements */
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

        :host([disabled][label-position="left"]) .label-text,
        :host([disabled][label-position="right"]) .label-text {
            position: relative;
            z-index: 1;
            background: var(--base-text--, rgba(29,29,29,1));
            padding: 0 4px; /* Only horizontal padding */
            border-radius: 2px;
            line-height: 1;
        }
        </style>
        <div class="checkbox-container" part="checkbox-container">
            <div class="checkbox-wrapper" part="checkbox-wrapper">
                <div class="checkbox" part="checkbox"></div>
            </div>
            ${
                this.getAttribute("label")
                    ? `
            <div class="label-wrapper" part="label-wrapper outer">
                <span class="label-text" part="label-text">${this.getAttribute("label")}</span>
            </div>`
                    : ""
            }
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

        // Ensure elements exist before modifying them
        if (this.labelWrapperElement) {
            this.labelWrapperElement.style.display = label ? "flex" : "none";
        }

        if (this.labelTextElement) {
            this.labelTextElement.textContent = label;
        }

        this.checkboxElement.classList.toggle("checked", checked);
        this.labelWrapperElement?.classList.toggle("checked", checked);
        this.checkboxElement.classList.toggle("disabled", disabled);
        this.labelWrapperElement?.classList.toggle("disabled", disabled);

        // Update the hidden checkbox input.
        this.updateHiddenInput();

        if (!this.hasAttribute("data-manual-invalid")) {
            if (this.hasAttribute("required") && !checked) {
                this.setAttribute("invalid", "");
            } else {
                this.removeAttribute("invalid");
            }
        }
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
            this.updateComponent();
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { checked: !isChecked },
                    bubbles: true,
                    composed: true,
                })
            );
        });
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

if (!customElements.get("kp-checkbox")) {
    customElements.define("kp-checkbox", KeplerCheckbox);
}
