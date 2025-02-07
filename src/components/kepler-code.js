class KeplerCode extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        // When the component is added to the DOM, render its content.
        this.render();
    }

    render() {
        // Get the code content from the element's inner content.
        // We assume that the user writes the code inside <kp-code> ... </kp-code>
        const codeContent = this.innerHTML.trim();
        // Clear light DOM content
        this.innerHTML = "";

        // Render a <pre><code> block and a copy button in the shadow DOM.
        // The escapeHtml function ensures the code is safely rendered as text.
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            font-family: Consolas, monospace;
            background: var(--neutral-8);
            color: #var(--neutral-1);
            padding: 1em;
            overflow: auto;
            border-radius: var(--radius-small)
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
            background: var(--neutral-1);
            border: none;
            color: var(--neutral-9);
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
          }
        </style>
        <button class="copy-button" title="Copy to clipboard">Copy</button>
        <pre><code>${this.escapeHtml(codeContent)}</code></pre>
      `;

        // Attach a click listener to the copy button.
        this.shadowRoot
            .querySelector(".copy-button")
            .addEventListener("click", () => this.copyCode(codeContent));

        // Optionally, if you want to integrate PrismJS, you could call Prism.highlightElement(...)
        // on the <code> element here.
    }

    // Utility method to escape HTML characters.
    escapeHtml(text) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    // Copies the given text to the clipboard.
    copyCode(text) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                // Optionally, provide user feedback.
                // console.log("Code copied to clipboard!");
            })
            .catch((err) => {
                console.error("Error copying code: ", err);
            });
    }
}

customElements.define("kp-code", KeplerCode);
