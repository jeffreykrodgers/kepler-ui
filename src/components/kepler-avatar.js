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
        // Use a generic placeholder if no src is provided.
        const src =
            this.getAttribute("src") || "https://via.placeholder.com/150";
        const alt = this.getAttribute("alt") || "Avatar";
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
        // Determine shape.
        const shape = this.getAttribute("shape") || "circle";
        const borderRadius = shape === "circle" ? "50%" : "0";

        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: ${dimensions};
            height: ${dimensions};
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: ${borderRadius};
          }
        </style>
        <img src="${src}" alt="${alt}" part="avatar" />
      `;
    }
}

customElements.define("kp-avatar", KeplerAvatar);
