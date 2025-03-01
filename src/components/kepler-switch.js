class KeplerSwitch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
        this._toggle = this._toggle.bind(this);
        this.render();
        this.attachEvents();
    }

    static get observedAttributes() {
        return [
            "size",
            "on-color",
            "off-color",
            "disabled",
            "value",
            "name",
            "label",
            "label-position",
            "slider-width",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "value") {
                this.updateSwitchState();
            } else {
                this.render();
            }
        }
    }

    get value() {
        return this.getAttribute("value") === "true";
    }

    set value(val) {
        this.setAttribute("value", val ? "true" : "false");
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }

    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    get label() {
        return this.getAttribute("label") || "";
    }

    attachEvents() {
        const isDisabled = () => this.hasAttribute("disabled");

        this.shadowRoot.addEventListener("click", (event) => {
            if (isDisabled()) {
                event.stopPropagation();
                return;
            }
            this._toggle();
        });

        this.shadowRoot.addEventListener("keydown", (event) => {
            if (isDisabled()) {
                event.preventDefault();
                return;
            }

            if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                this._toggle();
            }
        });
    }

    _toggle() {
        const newVal = !this.value;
        this.value = newVal;
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: newVal },
                bubbles: true,
                composed: true,
            })
        );
        this.updateSwitchState();
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
        const size = this.getAttribute("size") || "medium";
        const onColor =
            this.getAttribute("on-color") ||
            "var(--primary--, rgba(4,134,209,1))";
        const offColor =
            this.getAttribute("off-color") ||
            "var(--base-text-light, rgba(109,110,112,1))";
        const disabled = this.hasAttribute("disabled");
        const label = this.label;
        const labelPosition = this.getAttribute("label-position") || "top";
        const state = this.value;
        const activeColor = state ? onColor : offColor;
        const inactiveColor = state ? offColor : onColor;
        const contrast = "var(--base-surface, rgba(241,246,250,1))";
        let maxHeight;

        switch (size) {
            case "small":
                maxHeight = "32px";
                break;
            case "large":
                maxHeight = "52px";
                break;
            case "medium":
            default:
                maxHeight = "40px";
                break;
        }

        let wrapperFlexDirection = "column";
        if (labelPosition === "left") wrapperFlexDirection = "row";
        else if (labelPosition === "right")
            wrapperFlexDirection = "row-reverse";
        else if (labelPosition === "bottom")
            wrapperFlexDirection = "column-reverse";

        const sliderWidth = this.getAttribute("slider-width") || "120px";

        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-family: sans-serif;
            --slider-width: ${sliderWidth};
            --border: var(--border-medium, 2px);
            --padding: var(--spacing-small, 4px);
            --inner-width: calc(var(--slider-width) - 2 * (var(--border) + var(--padding)));
          }

          .switch-wrapper {
            display: flex;
            flex-direction: ${wrapperFlexDirection};
            gap: var(--spacing-small, 2px);
          }

          .switch-label {
            color: var(--base-text, #333);
            display: ${label ? "flex" : "none"};
            font-family: Tomorrow, monospace;
          }

          .switch-wrapper.label-left .switch-label,
          .switch-wrapper.label-right .switch-label {
              box-sizing: border-box;
              background: var(--base-text--, #333);
              color: var(--base-surface, rgba(241,246,250,1));
              font-size: var(--size-h5, 21px);
              font-family: ProFontWindows, monospace;
              padding: var(--spacing-medium, 8px);
              line-height: 24px;
              height: ${maxHeight};
          }

            .switch-wrapper.label-top,
            .switch-wrapper.label-bottom {
                gap: 0;
            }

          .switch-wrapper.label-left .switch-label {
            text-align: right;
          }
          .switch-wrapper.label-right .switch-label {
            text-align: left;
          }
          .switch-wrapper.label-top .switch-label,
          .switch-wrapper.label-bottom .switch-label {
            color: var(--base-text--, #333);
            background: none;
            padding: 0;
          }

          .switch {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--slider-width);
            height: ${maxHeight};
            padding: var(--padding);
            border: var(--border) solid ${activeColor};
            box-sizing: border-box;
            cursor: pointer;
            user-select: none;
            outline: none;
            transition: border-color 0.2s ease;
          }

          .switch.disabled {
            opacity: 0.6;
            pointer-events: none;
          }

          .active-indicator {
            position: absolute;
            top: var(--padding);
            left: ${
                state
                    ? "calc(var(--padding) + var(--inner-width) / 2)"
                    : "calc(var(--padding))"
            };
            width: calc(var(--inner-width) / 2);
            height: calc(100% - 2 * var(--padding));
            background-color: ${activeColor};
            transition: left 0.2s ease, background-color 0.2s ease;
            z-index: 1;
          }

          .switch-text {
            position: relative;
            display: flex;
            width: var(--inner-width);
            z-index: 2;
            pointer-events: none;
          }

          .switch-text span {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: calc(var(--inner-width) / 2);
            text-align: center;
            font-size: 1.2em;
            text-transform: uppercase;
            transition: color 0.2s ease, background-color 0.2s ease;
            font-family: ProFontWindows, monospace;
            line-height: ${maxHeight};
          }

          /* When active, text inside the slider uses base-surface */
          .switch-text .off-text {
            color: ${state ? inactiveColor : contrast};
          }

          .switch-text .on-text {
            color: ${state ? contrast : inactiveColor};
          }
            :host([disabled]) .switch {
                opacity: 0.8;
                pointer-events: none;
            }

            .switch-label {
                display: flex;
                align-items: center;
                justify-content: center;
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

            :host([label-position="top"]) .switch-label,
            :host([label-position="bottom"]) .switch-label,
            :host(:not[label-position]) .switch-label,{
                padding: 0;
                color: var(--base-text--, rgba(29,29,29,1));
                background: none;
            }

            :host([disabled][label-position="left"]) .switch-label,
            :host([disabled][label-position="right"]) .switch-label {
                overflow: hidden;
                opacity: 0.6; /* Match other elements */
                border: var(--border-medium, 2px) solid var(--base-border, rgba(215,219,222,1));
            }

            :host([disabled][label-position="left"]) .switch-label::before,
            :host([disabled][label-position="right"]) .switch-label::before {
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
        <div class="switch-wrapper label-${labelPosition}" part="switch-wrapper">
          ${label ? `<div class="switch-label" part="switch-label"><span class="label-text" part="label-text">${label}</span></div>` : ""}
          <div class="switch ${disabled ? "disabled" : ""}"
               role="switch"
               tabindex="0"
               aria-checked="${state}"
               part="switch">
            <div class="active-indicator"></div>
            <div class="switch-text">
              <span class="off-text" part="off">
                <slot name="off-label">Off</slot>
              </span>
              <span class="on-text" part="on">
                <slot name="on-label">On</slot>
              </span>
            </div>
          </div>
        </div>
      `;
    }

    updateSwitchState() {
        const onColor =
            this.getAttribute("on-color") ||
            "var(--primary--, rgba(4,134,209,1))";
        const offColor =
            this.getAttribute("off-color") ||
            "var(--base-text-light, rgba(109,110,112,1))";
        const state = this.value;
        const activeColor = state ? onColor : offColor;
        const inactiveColor = state ? offColor : onColor;
        const contrast = "var(--base-surface, rgba(241,246,250,1))";

        const switchEl = this.shadowRoot.querySelector(".switch");
        if (switchEl) {
            switchEl.style.borderColor = activeColor;
        }

        const indicator = this.shadowRoot.querySelector(".active-indicator");
        if (indicator) {
            indicator.style.backgroundColor = activeColor;
            indicator.style.left = state
                ? "calc(var(--padding) + var(--inner-width) / 2)"
                : "calc(var(--padding))";
        }

        const offText = this.shadowRoot.querySelector(".switch-text .off-text");
        const onText = this.shadowRoot.querySelector(".switch-text .on-text");
        if (offText) offText.style.color = state ? inactiveColor : contrast;
        if (onText) onText.style.color = state ? contrast : inactiveColor;
    }
}

if (!customElements.get("kp-switch")) {
    customElements.define("kp-switch", KeplerSwitch);
}
