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
                height: 20px;
                position: relative;
                overflow: hidden;
            }
            svg {
                width: 100%;
                height: 100%;
            }
        </style>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" preserveAspectRatio="none">
            <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-60)">
                <rect width="3" height="10" fill="var(--base-text--, #1D1D1D)"></rect>
            </pattern>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect>
        </svg>
    `;
    }
}

customElements.define("kp-break", KeplerBreak);
