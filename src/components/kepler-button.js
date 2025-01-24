// Web Component Definition
class KeplerButton extends HTMLElement {
    constructor() {
        super();
    
        // Attach a shadow DOM to encapsulate styles and content.
        this.attachShadow({ mode: 'open' });
    
        // Create the button element.
        this.button = document.createElement('button');
        this.button.classList.add('button');
    
        // Append the button to the shadow DOM.
        this.shadowRoot.appendChild(this.button);
    
        // Apply styles after adding the button to the shadow DOM
        this.applyStyles();
        this.render();
    }
  
    static get observedAttributes() {
        return ['left-icon', 'right-icon', 'label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const leftIcon = this.getAttribute('left-icon') || '';
        const rightIcon = this.getAttribute('right-icon') || '';
        const label = this.getAttribute('label') || 'Button?';

        this.button.innerHTML = `
            ${leftIcon ? `<img src="${leftIcon}" class="icon left-icon" alt="left icon">` : ''}
            <span class="label">${label}</span>
            ${rightIcon ? `<img src="${rightIcon}" class="icon right-icon" alt="right icon">` : ''}
        `;
    }

    // Apply styles based on attributes.
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .button {
                display: inline-flex;
                height: 32px;
                padding: 8px;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                gap: 10px;
                flex-shrink: 0;
                transition: background-color var(--transition-duration, 0.1s);
                border-radius: var(--border-small, 1px);
                border: var(--border-medium, 2px) solid var(--base-text--, #1D1D1D);
                background: var(--base-surface, #F1F6FA);
                color: var(--base-text--, #1D1D1D);
                font-family: var(--font-family, sans-serif);
            }
            .icon {
                margin: 0 8px;
            }
            .button:hover {
                background: var(--base-hover, #D7DBDE);
            }
            .button:active {
                background: var(--neutral-9, #1D1D1D);
                color: var(--neutral-1, #F1F6FA);
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    // Proxy button events to the custom element itself
    proxyEvents(eventNames) {
        eventNames.forEach((eventName) => {
            this.button.addEventListener(eventName, (event) => {
                // Dispatch the native event from the custom element
                const newEvent = new event.constructor(event.type, event);
                this.dispatchEvent(newEvent);
            });
        });
    }
}

// Register the custom element
customElements.define('kepler-button', KeplerButton);