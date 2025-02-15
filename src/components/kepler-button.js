class KeplerButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Create the inner button element.
        this.button = document.createElement("button");
        this.button.classList.add("button");
        this.button.setAttribute("role", "button");
        this.button.setAttribute("tabindex", "0");
        this.button.setAttribute("part", "button");
        this.shadowRoot.appendChild(this.button);

        this.applyStyles();
        this.render();
        this.proxyNativeOnClick();
        this.addEventListeners();
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) {
            this.setAttribute("size", "medium");
        }
        this.applyStyles();
        this.render();
        this.proxyNativeOnClick();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "left-icon",
            "right-icon",
            "color",
            "size",
            "style-type",
            "type",
            "disabled",
            "name",
            "value",
            "autofocus",
            "form",
            "formaction",
            "formenctype",
            "formmethod",
            "formnovalidate",
            "formtarget",
            "aria-label",
            "aria-pressed",
            "aria-hidden",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            const buttonAttributes = [
                "type",
                "style-type",
                "name",
                "value",
                "disabled",
                "autofocus",
                "form",
                "formaction",
                "formenctype",
                "formmethod",
                "formnovalidate",
                "formtarget",
                "aria-label",
                "aria-pressed",
                "aria-hidden",
            ];
            if (buttonAttributes.includes(name)) {
                if (newValue === null) {
                    this.button.removeAttribute(name);
                } else {
                    this.button.setAttribute(name, newValue);
                }
            }
            this.render();
            if (["color", "size", "style-type", "disabled"].includes(name)) {
                this.updateStyles();
            }
        }
    }

    updateButtonAttributes() {
        const buttonAttributes = [
            "type",
            "name",
            "value",
            "disabled",
            "autofocus",
            "form",
            "formaction",
            "formenctype",
            "formmethod",
            "formnovalidate",
            "formtarget",
            "aria-label",
            "aria-pressed",
            "aria-hidden",
        ];
        buttonAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.button.setAttribute(attr, this.getAttribute(attr));
            } else {
                this.button.removeAttribute(attr);
            }
        });
    }

    render() {
        this.updateButtonAttributes();

        if (this.hasAttribute("disabled")) {
            this.button.setAttribute("disabled", "");
            this.button.setAttribute("aria-disabled", "true");
        } else {
            this.button.removeAttribute("disabled");
            this.button.setAttribute("aria-disabled", "false");
        }

        this.button.innerHTML = `
        <span class="button-content" part="button-content">
          <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
          <span class="label" part="label"><slot></slot></span>
          <span class="icon right-icon" part="right-icon"><slot name="right-icon"></slot></span>
        </span>
      `;

        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");
        this.manageSlotVisibility("", ".label");
    }

    proxyNativeOnClick() {
        try {
            Object.defineProperty(this, "onclick", {
                get: () => this.button.onclick,
                set: (value) => {
                    this.button.onclick = value;
                },
                configurable: true,
                enumerable: true,
            });
        } catch (e) {
            console.warn("Could not redefine onclick:", e);
        }
    }

    manageSlotVisibility(slotName, selector) {
        const slot = slotName
            ? this.shadowRoot.querySelector(`slot[name="${slotName}"]`)
            : this.shadowRoot.querySelector("slot:not([name])");
        const container = this.shadowRoot.querySelector(selector);

        const updateVisibility = () => {
            const hasContent = slot.assignedNodes().length > 0;
            container.style.display = hasContent ? "inline-flex" : "none";
        };

        updateVisibility();
        slot.addEventListener("slotchange", updateVisibility);
    }

    addEventListeners() {
        // Focus and blur events.
        this.button.addEventListener("focus", () => {
            this.dispatchEvent(
                new CustomEvent("focus", { bubbles: true, composed: true })
            );
        });

        this.button.addEventListener("blur", () => {
            this.dispatchEvent(
                new CustomEvent("blur", { bubbles: true, composed: true })
            );
        });

        // Keyboard events.
        this.button.addEventListener("keydown", (event) => {
            this.dispatchEvent(
                new CustomEvent("keydown", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        this.button.addEventListener("keyup", (event) => {
            this.dispatchEvent(
                new CustomEvent("keyup", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        // Click event.
        this.button.addEventListener("click", (event) => {
            this.handleClick();

            // If button type is "submit", trigger form submission.
            if (this.getAttribute("type") === "submit") {
                const form = this.closest("form");
                if (form) {
                    event.preventDefault();
                    form.requestSubmit();
                }
            }
        });
    }

    handleClick() {
        if (this.hasAttribute("disabled")) return;

        const eventType = this.getAttribute("data-event");
        if (!eventType) return;

        const detail = {};
        Array.from(this.attributes)
            .filter((attr) => attr.name.startsWith("data-detail-"))
            .forEach((attr) => {
                const key = attr.name.replace("data-detail-", "");
                detail[key] = attr.value;
            });

        this.dispatchEvent(
            new CustomEvent(eventType, {
                detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
        :host {
          display: inline-block;
        }
        .button {
          box-sizing: border-box;
          display: inline-flex;
          min-height: var(--button-min-height, 40px);
          min-width: var(--button-min-width, 40px);
          padding: var(--button-padding, 2px);
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          border-radius: var(--border-small, 1px);
          border: var(--border-medium, 2px) solid var(--border-color, #1D1D1D);
          background: var(--background-color, #F1F6FA);
          color: var(--text-color, #1D1D1D);
          font-family: Tomorrow, sans-serif;
          font-size: var(--font-size, 16px);
          font-weight: 500;
          text-transform: uppercase;
          line-height: 1.2;
          transition: background-color 0.1s, color 0.1s, border-color 0.1s;
          cursor: pointer;
          width: 100%;
        }
        .button:disabled {
          pointer-events: none;
          opacity: 0.6;
        }
        .button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            -45deg,
            var(--text-color, #1D1D1D) 0,
            var(--text-color, #1D1D1D) 2px,
            transparent 3px,
            transparent 10px
          );
          opacity: 0;
          z-index: 0;
          transition: opacity 0.2s ease;
        }
        .button:disabled::before {
          opacity: 1;
        }
        .button:hover:not(:disabled),
        .button:hover:not(:disabled) .button-content {
          background: var(--hover-background-color);
          color: var(--hover-text-color);
        }
        .button:focus:not(:disabled),
        .button:focus:not(:disabled) .button-content {
          background: var(--focus-background-color);
          color: var(--focus-text-color);
        }
        .button:active:not(:disabled),
        .button:active:not(:disabled) .button-content {
          background: var(--active-background-color);
          color: var(--active-text-color);
        }
        .button-content {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: var(--gap, 8px);
          padding: var(--content-padding, 2px) var(--button-padding, 4px);
          position: relative;
          z-index: 1;
          background: var(--background-color);
          color: var(--text-color);
          font-family: Tomorrow, sans-serif;
          font-size: var(--font-size, 16px);
          font-weight: 500;
          line-height: 1.2;
          text-transform: uppercase;
          transition: color 0.1s, background-color 0.1s;
        }
        .icon {
          display: flex;
          min-width: 16px;
          justify-content: center;
        }
        .label, .icon {
          padding-bottom: var(--spacing-x-small, 4px);
        }
      `;
        this.shadowRoot.appendChild(style);
    }

    updateStyles() {
        const color = this.getAttribute("color") || "base";
        const size = this.getAttribute("size") || "medium";
        const styleType = this.getAttribute("style-type") || "outlined";

        const colorVars = {
            primary: [
                "--primary--",
                "--primary-hover",
                "--primary-active",
                "--primary-background--",
                "--primary-background-hover",
                "--primary-background-active",
            ],
            secondary: [
                "--secondary--",
                "--secondary-hover",
                "--secondary-active",
                "--secondary-background--",
                "--secondary-background-hover",
                "--secondary-background-active",
            ],
            base: [
                "--base-text--",
                "--base-text-emphasize",
                "--base-text-light",
                "--base-surface",
                "--base-hover",
                "--base-focus",
            ],
            success: [
                "--success--",
                "--success-hover",
                "--success-active",
                "--success-background--",
                "--success-background-hover",
                "--success-background-active",
            ],
            error: [
                "--error--",
                "--error-hover",
                "--error-active",
                "--error-background--",
                "--error-background-hover",
                "--error-background-active",
            ],
            warning: [
                "--warning--",
                "--warning-hover",
                "--warning-active",
                "--warning-background--",
                "--warning-background-hover",
                "--warning-background-active",
            ],
        };

        const sizeVars = {
            small: ["--spacing-2x-small", "--spacing-x-small"],
            medium: ["--spacing-x-small", "--spacing-small"],
            large: ["--spacing-small", "--spacing-medium"],
        };

        // For each style type, we include a fallback for each property.
        const styleVars = {
            outlined: {
                "--background-color": `var(${colorVars[color][3] || "--base-surface"}, var(--base-surface, rgba(241,246,250,1)))`,
                "--border-color": `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`,
                "--text-color": `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`,
            },
            filled: {
                "--background-color": `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`,
                "--border-color": `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`,
                "--text-color": `var(${colorVars[color][3] || "--base-surface"}, var(--base-surface, rgba(241,246,250,1)))`,
            },
            flat: {
                "--background-color": `var(${colorVars[color][3] || "--base-surface"}, var(--base-surface, rgba(241,246,250,1)))`,
                "--border-color": "none",
                "--text-color": `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`,
            },
        };

        const currentStyle = styleVars[styleType] || styleVars.outlined;
        Object.entries(currentStyle).forEach(([key, value]) => {
            this.button.style.setProperty(key, value);
        });

        this.button.style.setProperty(
            "--hover-background-color",
            `var(${colorVars[color][4] || "--base-hover"}, var(--base-hover, rgba(215,219,222,1)))`
        );
        this.button.style.setProperty(
            "--hover-text-color",
            `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`
        );
        this.button.style.setProperty(
            "--focus-background-color",
            `var(${colorVars[color][5] || "--base-focus"}, var(--base-focus, rgba(188,192,195,1)))`
        );
        this.button.style.setProperty(
            "--focus-text-color",
            `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`
        );
        this.button.style.setProperty(
            "--active-background-color",
            `var(${colorVars[color][0] || "--base-text--"}, var(--base-text--, rgba(29,29,29,1)))`
        );
        this.button.style.setProperty(
            "--active-text-color",
            `var(${colorVars[color][3] || "--base-surface"}, var(--base-surface, rgba(241,246,250,1)))`
        );

        const [contentPadding, buttonPadding] =
            sizeVars[size] || sizeVars.medium;
        this.button.style.setProperty(
            "--content-padding",
            `var(${contentPadding}, 4px)`
        );
        this.button.style.setProperty(
            "--button-padding",
            `var(${buttonPadding}, 2px)`
        );
        this.button.style.setProperty("--gap", `var(${buttonPadding}, 16px)`);

        const minSizeMapping = {
            small: "32px",
            medium: "40px",
            large: "52px",
        };
        this.button.style.setProperty(
            "--button-min-height",
            minSizeMapping[size] || "40px"
        );
        this.button.style.setProperty(
            "--button-min-width",
            minSizeMapping[size] || "40px"
        );
    }

    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            return this.selectedValues.size
                ? Array.from(this.selectedValues)[0]
                : "";
        }
    }

    set value(newVal) {
        if (this.hasAttribute("multiple")) {
            if (typeof newVal === "string") {
                this.selectedValues = new Set(
                    newVal.split(",").map((s) => s.trim())
                );
            } else if (Array.isArray(newVal)) {
                this.selectedValues = new Set(newVal);
            }
        } else {
            if (typeof newVal === "string") {
                this.selectedValues = new Set([newVal.trim()]);
            } else {
                this.selectedValues = new Set();
            }
        }
        this.updateComponent();
    }

    setOptions(options) {
        this.setAttribute("options", JSON.stringify(options));
    }

    setValue(val) {
        this.setAttribute("value", val);
    }
}

if (!customElements.get("kp-button")) {
    customElements.define("kp-button", KeplerButton);
}
