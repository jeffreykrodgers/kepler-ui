function getContainer(selector, multiple) {
    const method = multiple ? "querySelectorAll" : "querySelector";
    return window.__routerShadowRoot
        ? window.__routerShadowRoot[method](selector)
        : document[method](selector);
}

export { getContainer };
