class KeplerPanelBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          ::slotted(kepler-panel) {
            margin-bottom: 4px;
          }
        </style>
        <slot></slot>
      `;
    }
}

if (!customElements.get("kp-panelbar")) {
    customElements.define("kp-panelbar", KeplerPanelBar);
}
