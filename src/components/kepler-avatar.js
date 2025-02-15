class KeplerAvatar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    static get observedAttributes() {
        return ["src", "alt", "size", "shape"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const src = this.getAttribute("src");
        const altRaw = this.getAttribute("alt") || "AN";
        const words = altRaw.trim().split(/\s+/);
        const displayText =
            words.lengh >= 2
                ? words[0].charAt(0) + words[1].charAt(0)
                : altRaw.substring(0, 2);

        const shape = this.getAttribute("shape") || "circle";
        const borderRadius = shape === "circle" ? "50%" : "0";

        // Determine dimensions based on size.
        const size = this.getAttribute("size") || "medium";
        let dimensions;
        switch (size) {
            case "small":
                dimensions = "30px";
                break;
            case "large":
                dimensions = "70px";
                break;
            case "medium":
            default:
                dimensions = "50px";
                break;
        }

        if (src) {
            this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: inline-block;
              width: ${dimensions};
              height: ${dimensions};
              min-width: ${dimensions};
            }
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: ${borderRadius};
            }
          </style>
          <img src="${src}" alt="${altRaw}" part="avatar" />
        `;
        } else {
            this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: inline-block;
              width: ${dimensions};
              height: ${dimensions};
              min-width: ${dimensions};
              font-family: ProFontWindows, monospace;
              text-transform: uppercase;
            }
            .avatar {
              width: 100%;
              height: 100%;
              border-radius: ${borderRadius};
              background-color: var(--primary--, rgba(4, 134, 209, 1));
              color: var(--primary-background--, rgba(245, 250, 250, 1));
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .avatar h5 {
                margin: 0;
                font-size: calc(${dimensions} * 0.75);
                margin-left: 3px;
            }
          </style>
          <div class="avatar" part="avatar"><h5>${displayText}</h5></div>
        `;
        }
    }
}

if (!customElements.get("kp-avatar")) {
    customElements.define("kp-avatar", KeplerAvatar);
}
