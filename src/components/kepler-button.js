class KeplerButton extends HTMLElement {
    constructor() {
        super();

        // Attach a shadow DOM to encapsulate styles and content.
        this.attachShadow({ mode: "open" });

        // Create the button element.
        this.button = document.createElement("button");
        this.button.classList.add("button");
        this.button.setAttribute("role", "button"); // Accessibility role
        this.button.setAttribute("tabindex", "0"); // Ensure keyboard navigation

        // Append the button to the shadow DOM.
        this.shadowRoot.appendChild(this.button);

        // Apply styles and render content.
        this.applyStyles();
        this.render();

        // Proxy native onclick function to the button.
        this.proxyNativeOnClick();

        // Add event listeners for custom interactions.
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
            if (
                [
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
                ].includes(name)
            ) {
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

    render() {
        // Propagate the `disabled` attribute to the inner button
        if (this.hasAttribute("disabled")) {
            this.button.setAttribute("disabled", "");
            this.button.setAttribute("aria-disabled", "true");
        } else {
            this.button.removeAttribute("disabled");
            this.button.setAttribute("aria-disabled", "false");
        }

        this.button.innerHTML = `
          <span class="button-content">
            <span class="icon left-icon"><slot name="left-icon"></slot></span>
            <span class="label"><slot></slot></span>
            <span class="icon right-icon"><slot name="right-icon"></slot></span>
          </span>
        `;

        // Manage visibility of icon slots and the label dynamically
        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");
        this.manageSlotVisibility("", ".label"); // Default slot for the label
    }

    proxyNativeOnClick() {
        Object.defineProperty(this, "onclick", {
            get: () => this.button.onclick,
            set: (value) => {
                this.button.onclick = value;
            },
        });
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

        // Initial check
        updateVisibility();

        // Listen for changes to the slot content
        slot.addEventListener("slotchange", updateVisibility);
    }

    addEventListeners() {
        // Focus and blur events
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

        // Keyboard events
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

        this.button.addEventListener("click", (event) => {
            this.handleClick();

            // If the button type is "submit", trigger form submission
            if (this.getAttribute("type") === "submit") {
                const form = this.closest("form");
                if (form) {
                    event.preventDefault(); // Prevent default click behavior
                    form.requestSubmit(); // Programmatically submit the form
                }
            }
        });
    }

    handleClick() {
        if (this.hasAttribute("disabled")) {
            return; // Prevent interactions if disabled
        }

        const eventType = this.getAttribute("data-event");
        if (!eventType) return;

        // Build the event detail object from `data-detail-*` attributes
        const detail = {};
        Array.from(this.attributes)
            .filter((attr) => attr.name.startsWith("data-detail-"))
            .forEach((attr) => {
                const key = attr.name.replace("data-detail-", "");
                detail[key] = attr.value;
            });

        // Dispatch the custom event
        this.dispatchEvent(
            new CustomEvent(eventType, {
                detail,
                bubbles: true, // Allow the event to bubble up
                composed: true, // Allow the event to cross Shadow DOM boundaries
            })
        );
    }

    applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
            .button {
                box-sizing: border-box;
                display: inline-flex;
                min-height: var(--button-min-height, 40px);
                padding: var(--button-padding, 16px);
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden; /* Clip the diagonal pattern */
                border-radius: var(--border-small, 1px);
                border: var(--border-medium, 2px) solid var(--border-color, #1D1D1D);
                background: var(--background-color, #F1F6FA);
                color: var(--text-color, #1D1D1D);
                font-family: Tomorrow, sans-serif; /* Default font-family */
                font-size: var(--font-size, 16px);
                font-weight: 500;
                text-transform: uppercase;
                line-height: 1.2;
                transition: background-color var(--transition-duration, 0.1s),
                            color var(--transition-duration, 0.1s),
                            border-color var(--transition-duration, 0.1s);
                cursor: pointer; /* Ensure the button looks interactive */
            }
    
            .button:disabled {
                pointer-events: none; /* Prevent interactions */
                opacity: 0.6; /* Visual indication of disabled */
            }
    
            /* Diagonal line pattern */
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
                padding: var(--content-padding, 8px) var(--button-padding, 16px);
                position: relative;
                z-index: 1;
                background: var(--background-color);
                color: var(--text-color);
                font-family: Tomorrow, sans-serif;
                font-size: var(--font-size, 16px);
                font-weight: 500;
                line-height: 1.2;
                text-transform: uppercase;
                transition: color var(--transition-duration, 0.1s),
                background-color var(--transition-duration, 0.1s);
            }
    
            .icon {
                display: flex;
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

        const styleVars = {
            outlined: {
                "--background-color": `var(${colorVars[color][3] || "--base-surface"})`,
                "--border-color": `var(${colorVars[color][0] || "--base-text--"})`,
                "--text-color": `var(${colorVars[color][0] || "--base-text"})`,
            },
            filled: {
                "--background-color": `var(${colorVars[color][0] || "--base-text--"})`,
                "--border-color": `var(${colorVars[color][0] || "--base-text--"})`,
                "--text-color": `var(${colorVars[color][3] || "--base-surface"})`,
            },
            flat: {
                "--background-color": `var(${colorVars[color][3] || "--base-surface"})`,
                "--border-color": "none",
                "--text-color": `var(${colorVars[color][0] || "--base-text--"})`,
            },
        };

        const currentStyle = styleVars[styleType] || styleVars.outlined;

        // Apply dynamic styles using CSS variables
        Object.entries(currentStyle).forEach(([key, value]) => {
            this.button.style.setProperty(key, value);
        });

        // Set hover, focus, and active colors
        this.button.style.setProperty(
            "--hover-background-color",
            `var(${colorVars[color][4] || "--base-hover"})`
        );
        this.button.style.setProperty(
            "--hover-text-color",
            `var(${colorVars[color][0] || "--base-text--"})`
        );
        this.button.style.setProperty(
            "--focus-background-color",
            `var(${colorVars[color][5] || "--base-focus"})`
        );
        this.button.style.setProperty(
            "--focus-text-color",
            `var(${colorVars[color][0] || "--base-text--"})`
        );
        this.button.style.setProperty(
            "--active-background-color",
            `var(${colorVars[color][0] || "--base-text--"})`
        );
        this.button.style.setProperty(
            "--active-text-color",
            `var(${colorVars[color][3] || "--base-surface"})`
        );

        // Apply size adjustments
        const [contentPadding, buttonPadding] =
            sizeVars[size] || sizeVars.medium;

        this.button.style.setProperty(
            "--content-padding",
            `var(${contentPadding}, 8px)`
        );

        this.button.style.setProperty(
            "--button-padding",
            `var(${buttonPadding}, 16px)`
        );

        this.button.style.setProperty("--gap", `var(${buttonPadding}, 16px)`); // Use button padding for gap
    }
}

customElements.define("kp-button", KeplerButton);
