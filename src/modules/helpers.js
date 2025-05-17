function getContainer(selector, multiple) {
    const method = multiple ? "querySelectorAll" : "querySelector";
    return window.__routerShadowRoot
        ? window.__routerShadowRoot[method](selector)
        : document[method](selector);
}

function injectGlobalFonts() {
    if (document.getElementById("kepler-fonts")) return;
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
    }`;
    const style = document.createElement("style");
    style.id = "kepler-fonts";
    style.textContent = fontCSS;
    document.head.appendChild(style);
}

export { getContainer, injectGlobalFonts };
