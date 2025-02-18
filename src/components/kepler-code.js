class KeplerCode extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.injectGlobalFonts();
    }

    connectedCallback() {
        this.render();
    }

    injectGlobalFonts() {
        if (document.getElementById("kepler-fonts")) return; // Prevent duplicate injection

        const fontCSS = `
            @font-face {
                font-family: "ProFontWindows";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/ProFontWindows.woff2") format("woff2");
                font-display: swap;
            }

            @font-face {
                font-family: "Tomorrow";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/Tomorrow-Regular.woff2") format("woff2");
                font-display: swap;
            }

            @font-face {
                font-family: "Tomorrow";
                src: url("https://kepler-ui.s3.us-west-2.amazonaws.com/assets/Tomorrow-Bold.woff2") format("woff2");
                font-weight: bold;
                font-display: swap;
            }
        `;

        const styleTag = document.createElement("style");
        styleTag.id = "kepler-fonts";
        styleTag.textContent = fontCSS;
        document.head.appendChild(styleTag);
    }

    render() {
        const rawContent = this.innerHTML.trim();
        const codeContent = this.decodeHtmlEntities(rawContent);
        const lang = this.getAttribute("lang") || "none";

        this.innerHTML = "";

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: Consolas, monospace;
                background: var(--base-background);
                color: var(--base-text--, rgba(29, 29, 29, 1));
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
                background: var(--base-text--, rgba(29, 29, 29, 1));
                border: none;
                color: var(--base-surface, rgba(241, 246, 250, 1));
                padding: 4px 8px;
                cursor: pointer;
                border-radius: var(--radii-medium);
                font-size: 12px;
            }
        </style>
        <button class="copy-button" title="Copy to clipboard">Copy</button>
        <pre><code class="language-${lang}"></code></pre>
        `;

        const codeBlock = this.shadowRoot.querySelector("code");
        codeBlock.textContent = codeContent;

        this.dispatchEvent(
            new CustomEvent("kp-code-ready", {
                detail: { element: this, language: lang },
                bubbles: true,
                composed: true,
            })
        );

        this.shadowRoot
            .querySelector(".copy-button")
            .addEventListener("click", () => this.copyCode(codeContent));
    }

    decodeHtmlEntities(text) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }

    copyCode(text) {
        navigator.clipboard
            .writeText(text)
            .catch((err) => console.error("Error copying code: ", err));
    }
}

customElements.define("kp-code", KeplerCode);
