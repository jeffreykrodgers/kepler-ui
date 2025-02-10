class KeplerCode extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // Capture the raw innerHTML from the light DOM.
        const rawContent = this.innerHTML.trim();
        // Decode HTML entities so that escaped quotes (and other characters) are restored.
        const codeContent = this.decodeHtmlEntities(rawContent);

        this.innerHTML = "";

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          font-family: Consolas, monospace;
          background: var(--base-background);
          color: var(--base-text);
          padding: 1em;
          border-radius: var(--radii-medium);
          overflow: auto;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 14px;
        }
        code {
          display: block;
        }
        .copy-button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--base-text--);
          border: none;
          color: var(--base-surface);
          padding: 4px 8px;
          cursor: pointer;
          border-radius: var(--radii-medium);
          font-size: 12px;
        }
      </style>
      <button class="copy-button" title="Copy to clipboard">Copy</button>
      <pre><code></code></pre>
    `;

        this.shadowRoot.querySelector("code").textContent = codeContent;

        this.shadowRoot
            .querySelector(".copy-button")
            .addEventListener("click", () => this.copyCode(codeContent));
    }

    // Utility: Decode HTML entities by leveraging a temporary textarea.
    decodeHtmlEntities(text) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }

    // Copies the given text to the clipboard.
    copyCode(text) {
        navigator.clipboard
            .writeText(text)
            .catch((err) => console.error("Error copying code: ", err));
    }
}

customElements.define("kp-code", KeplerCode);
