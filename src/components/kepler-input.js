import { injectGlobalFonts } from "../modules/helpers.js";

class KeplerInput extends HTMLElement {
    constructor() {
        super();

        // Attach shadow DOM
        this.attachShadow({ mode: "open" });
        injectGlobalFonts();

        // Render the component with invalid state styles.
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
                    gap: var(--spacing-small, 8px);
                    transition: background-color 0.2s ease, color 0.2s ease;
                    min-height: 40px;
                    min-width: 40px;
                    cursor: pointer;
                }
                :host([label-position="top"]) .label-wrapper,
                :host([label-position="bottom"]) .label-wrapper {
                    width: 100%;
                    justify-content: flex-start;
                    background-color: var(--base-surface, rgba(241,246,250,1));
                    color: var(--base-text--, rgba(29,29,29,1));
                    padding: 0;
                }
                :host([label-position="top"]) .input-container,
                :host([label-position="bottom"]) .input-container {
                    gap: 0;
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
                    align-items: center;
                }
                :host([label-position="right"]) .input-container {
                    flex-direction: row-reverse;
                    align-items: center;
                }
                :host([label-position="top"]) .input-container {
                    flex-direction: column;
                    align-items: stretch;
                }
                :host([label-position="bottom"]) .input-container {
                    flex-direction: column-reverse;
                    align-items: stretch;
                }
                :host([disabled]) .input-wrapper {
                    opacity: 0.8;
                }

                /* Apply diagonal pattern only for left/right label positions */
                :host([disabled][label-position="left"]) .label-wrapper,
                :host([disabled][label-position="right"]) .label-wrapper {
                    position: relative;
                    overflow: hidden;
                    opacity: 0.6; /* Match button opacity */
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

                /* Keep label text readable without adding extra height */
                :host([disabled][label-position="left"]) .label-text,
                :host([disabled][label-position="right"]) .label-text {
                    position: relative;
                    z-index: 1;
                    background: var(--base-text--, rgba(29,29,29,1));
                    padding: 0 4px; /* Only horizontal padding to avoid height change */
                    border-radius: 2px;
                    line-height: 1; /* Ensure no added height */
                }
                :host([disabled]) .input-wrapper {
                    border-color: var(--base-border, rgba(215,219,222,1));
                    color: var(--base-text-subtle, rgba(109,110,112,1));
                }
                .input-wrapper {
                    box-sizing: border-box;
                    display: flex;
                    flex: 1 0 auto;
                    align-items: center;
                    padding: var(--spacing-medium, 8px);
                    padding-bottom: calc(var(--spacing-medium, 8px) - 1px);
                    border: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
                    border-radius: var(--border-small, 1px);
                    background: var(--base-surface, rgba(241,246,250,1));
                    color: var(--base-text--, rgba(29,29,29,1));
                    font-family: Tomorrow, sans-serif;
                    font-size: var(--font-size, 16px);
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                }
                .input-wrapper:focus-within {
                    border-color: var(--primary--, rgba(4,134,209,1));
                    background: var(--base-hover, rgba(215,219,222,1));
                }
                input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: inherit;
                    font-family: inherit;
                    font-size: inherit;
                    max-height: 40px;
                }
                input::placeholder {
                    color: var(--base-text-subtle, rgba(109,110,112,1));
                }
                .icon {
                    display: flex;
                    align-items: center;
                }
                .hidden {
                    display: none;
                }
                
                :host([invalid]) .input-wrapper {
                    border-color: var(--error--, rgba(217,4,40,1));
                    color: var(--error--, rgba(217,4,40,1));
                    background: var(--error-background--, rgba(250,245,246,1));
                }
                :host([invalid]) .input-wrapper:hover {
                    background: var(--error-background-hover, rgba(246,215,220,1));
                }
                :host([invalid]) .input-wrapper:active,
                :host([invalid]) .input-wrapper:focus-within {
                    background: var(--error-background-active, rgba(242,185,195,1));
                }
                :host([invalid][label-position="top"]) .label-wrapper,
                :host([invalid][label-position="bottom"]) .label-wrapper {
                    color: var(--error--, rgba(217,4,40,1));
                }
                :host([invalid][label-position="left"]) .label-wrapper,
                :host([invalid][label-position="right"]) .label-wrapper {
                    background-color: var(--error--, rgba(217,4,40,1));
                }
            </style>
            <div class="input-container" part="input-container">
                <div class="label-wrapper" part="label-wrapper">
                    <span class="label-icon left-label-icon" part="left-label-icon"><slot name="left-label-icon"></slot></span>
                    <span class="label-text" part="label-text"></span>
                    <span class="label-icon right-label-icon" part="right-label-icon><slot name="right-label-icon"></slot></span>
                </div>
                <div class="input-wrapper" part="input-wrapper">
                    <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
                    <input type="text" />
                    <span class="icon right-icon" part="right-icon"><slot name="right-icon"></slot></span>
                </div>
            </div>
        `;

        this.inputElement = this.shadowRoot.querySelector("input");
        this.labelTextElement = this.shadowRoot.querySelector(".label-text");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");

        this.manageSlotVisibility("left-label-icon", ".left-label-icon");
        this.manageSlotVisibility("right-label-icon", ".right-label-icon");
        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");

        this.addEventListeners();
    }

    static get observedAttributes() {
        return [
            "type",
            "placeholder",
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
            "label",
            "label-position",
            "invalid",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "label" || name === "label-position") {
                this.updateLabel();
            } else {
                this.syncAttributesToInput(name, newValue);
            }
        }
    }

    connectedCallback() {
        this.syncAttributes();

        if (!this.hiddenInput) {
            this.hiddenInput = document.createElement("input");
            this.hiddenInput.type = "hidden";
            this.hiddenInput.name = this.getAttribute("name") || "";
            this.hiddenInput.value = this.inputElement.value;
            this.appendChild(this.hiddenInput);
        }
        this.updateHiddenInput();
    }

    syncAttributes() {
        KeplerInput.observedAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.syncAttributesToInput(attr, this.getAttribute(attr));
            }
        });

        this.updateLabel();
    }

    syncAttributesToInput(name, value) {
        if (name === "invalid") return;
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
        this.labelWrapper.style.display = label ? "flex" : "none";
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

    addEventListeners() {
        this.inputElement.addEventListener("focus", () => {
            this.labelWrapper.classList.add("selected");
        });
        this.inputElement.addEventListener("blur", () => {
            this.labelWrapper.classList.remove("selected");
        });
        this.inputElement.addEventListener("input", () => {
            this.hiddenInput.value = this.inputElement.value;
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

        this.labelWrapper.addEventListener("click", () => {
            this.inputElement.focus();
        });
    }

    get value() {
        return this.inputElement.value;
    }

    set value(newValue) {
        this.setAttribute("value", newValue);
    }

    get invalid() {
        return this.hasAttribute("invalid");
    }

    set invalid(val) {
        if (val) {
            this.setAttribute("invalid", "");
        } else {
            this.removeAttribute("invalid");
        }
    }
}

if (!customElements.get("kp-input")) {
    customElements.define("kp-input", KeplerInput);
}
