class KeplerBreak extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            /* Use the custom property for height with a fallback */
            height: var(--spacing-2x-large, 40px);
          }
          .break {
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
              -45deg,
              var(--base-border, #ccc) 0,
              var(--base-border, #ccc) 2px,
              transparent 3px,
              transparent 10px
            );
          }
        </style>
        <div class="break"></div>
      `;
    }
}

customElements.define("kp-break", KeplerBreak);
