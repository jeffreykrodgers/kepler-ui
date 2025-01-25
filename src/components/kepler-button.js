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
    
        // Apply styles and render content.
        this.applyStyles();
        this.render();
    
        // Add click event listener.
        this.button.addEventListener('click', () => {
          this.handleClick();
        });
    }
  
    static get observedAttributes() {
      return ['left-icon', 'right-icon'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this.render();
      }
    }
  
    render() {
        this.button.innerHTML = `
          <span class="button-content">
            <span class="icon left-icon"><slot name="left-icon"></slot></span>
            <span class="label"><slot></slot></span>
            <span class="icon right-icon"><slot name="right-icon"></slot></span>
          </span>
        `;
    
        // Manage visibility of icon slots dynamically
        this.manageSlotVisibility('left-icon', '.left-icon');
        this.manageSlotVisibility('right-icon', '.right-icon');
    }

    manageSlotVisibility(slotName, selector) {
        const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);
        const container = this.shadowRoot.querySelector(selector);
    
        const updateVisibility = () => {
          const hasContent = slot.assignedNodes().length > 0;
          container.style.display = hasContent ? 'inline-flex' : 'none';
        };
    
        // Initial check
        updateVisibility();
    
        // Listen for changes to the slot content
        slot.addEventListener('slotchange', updateVisibility);
      }
  
    handleClick() {
      const eventType = this.getAttribute('data-event');
      if (!eventType) return;
  
      // Build the event detail object from `data-detail-*` attributes
      const detail = {};
      Array.from(this.attributes)
        .filter((attr) => attr.name.startsWith('data-detail-'))
        .forEach((attr) => {
          const key = attr.name.replace('data-detail-', '');
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
        const style = document.createElement('style');
        style.textContent = `
            .button {
                box-sizing: border-box;
                display: inline-flex;
                min-height: 40px;
                padding: var(--spacing-small, 8px) var(--spacing-medium, 16px);
                justify-content: flex-start;
                align-items: center;
                position: relative; /* Ensure the pattern stays behind content */
                overflow: hidden; /* Clip the pattern to the button's border */
                transition: background-color var(--transition-duration, 0.1s);
                border-radius: var(--border-small, 1px);
                border: var(--border-medium, 2px) solid var(--base-text--, #1D1D1D);
                background: var(--base-surface, #F1F6FA);
            }

            /* Diagonal line pattern */
            .button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 200%; /* Ensure the pattern covers large buttons */
                height: 200%; /* Ensure the pattern covers large buttons */
                background: repeating-linear-gradient(
                -45deg, 
                var(--base-text--, #1D1D1D) 0, 
                var(--base-text--, #1D1D1D) 2px, 
                transparent 3px, 
                transparent 10px
                );
                opacity: 1; /* Adjust visibility */
                z-index: 0; /* Ensure it sits behind content */
            }
                
            .button-content {
                display: inline-flex;
                flex-direction: row;
                min-height: 24px;
                align-items: center;
                padding: 0 var(--spacing-small);
                gap: var(--spacing-medium, 8px);
                position: relative; /* Ensure it sits above the pattern */
                z-index: 1; /* Stack above the background */
                transition: background-color var(--transition-duration, 0.1s);
                background: var(--base-surface); /* Ensure no background hides the pattern */
                color: var(--base-text--, #1D1D1D);
                font-family: Tomorrow;
                font-size: 16px;
                font-weight: 500;
                text-transform: uppercase;
            }
      
            .icon {
                display: flex;
            }
        
            .button:hover,
            .button:hover > .button-content {
                background: var(--base-hover);
            }
        
            .button:active,
            .button:active > .button-content {
                background: var(--base-text--);
                color: var(--base-background);
            }
        
            .label {
                padding-bottom: var(--spacing-x-small, 4px);
            }
        `;
        this.shadowRoot.appendChild(style);
      }
  }
  
  customElements.define('kepler-button', KeplerButton);
  