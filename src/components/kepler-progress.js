class KeplerProgress extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.lastSegmentsCount = 0;
        this.injectGlobalFonts();
        this.render();
        this.setupRefs();
        this.setupResizeObserver();
        this.updateSize();
        this.updateProgress();
    }

    static get observedAttributes() {
        return ["value", "max", "size"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "size") {
                this.updateSize();
                this.updateSegments();
            }
            this.updateProgress();
        }
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
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            min-width: 20px;
            max-width: 100%;
            /* Default styling variables; these may be overridden by updateSize() */
            --progress-filled-color: var(--primary--, rgba(4, 134, 209, 1));
            --progress-unfilled-color: var(--base-surface, rgba(241, 246, 250, 1));
            --progress-animation-duration: 1.5s;
            --progress-height: 28px;
            --segment-margin: var(--spacing-x-small, 4px);
          }
          .progress-container {
            display: flex;
            width: auto;
            max-width: 100%;
            padding: var(--segment-margin);
            border: var(--border-medium, 2px) solid var(--base-text--, rgba(29, 29, 29, 1));
            box-sizing: border-box;
            overflow: hidden;
          }
          .progress-segment {
            background-color: var(--progress-unfilled-color);
            margin: var(--segment-margin);
            position: relative;
            overflow: hidden;
          }
          .progress-segment.filled {
            background-color: var(--progress-filled-color);
          }
          .indeterminate .progress-segment {
            opacity: 0.3;
            background-color: var(--primary--, rgba(4, 134, 209, 1));
            animation: fade var(--progress-animation-duration) linear infinite;
          }
          
          /* Adjusted keyframes so the full-opacity (gradient) portion is spread wider */
          @keyframes fade {
            0% { opacity: 0.3; }
            40% { opacity: 1; }
            60% { opacity: 1; }
            100% { opacity: 0.3; }
          }
        </style>
        <div class="progress-container"></div>
      `;
    }

    setupRefs() {
        this.progressContainer = this.shadowRoot.querySelector(
            ".progress-container"
        );
    }

    setupResizeObserver() {
        // Recalculate segments when the container resizes.
        this.resizeObserver = new ResizeObserver(() => {
            this.updateSegments();
            this.updateProgress();
        });
        this.resizeObserver.observe(this.progressContainer);
    }

    updateSize() {
        // Determine size based on the "size" attribute. Default is "medium".
        const size = this.getAttribute("size") || "medium";
        let progressHeight, segmentMargin;
        switch (size) {
            case "small":
                progressHeight = "16px";
                segmentMargin = "var(--spacing-2x-small, 1px)";
                break;
            case "large":
                progressHeight = "40px";
                segmentMargin = "var(--spacing-small, 4px)";
                break;
            case "medium":
            default:
                progressHeight = "28px";
                segmentMargin = "var(--spacing-x-small, 2px)";
                break;
        }
        this.style.setProperty("--progress-height", progressHeight);
        this.style.setProperty("--segment-margin", segmentMargin);
    }

    updateSegments() {
        // Measure effective container width (subtracting horizontal padding)
        const containerStyle = getComputedStyle(this.progressContainer);
        const paddingLeft =
            parseFloat(containerStyle.getPropertyValue("padding-left")) || 0;
        const paddingRight =
            parseFloat(containerStyle.getPropertyValue("padding-right")) || 0;
        const effectiveWidth =
            this.progressContainer.clientWidth - paddingLeft - paddingRight;

        // Use fixed height from our CSS variable.
        const hostStyle = getComputedStyle(this);
        const progressHeight =
            parseFloat(hostStyle.getPropertyValue("--progress-height")) || 40;
        // For segment margin, get the computed value.
        const segmentMarginStr = hostStyle.getPropertyValue("--segment-margin");
        const segmentMargin = parseFloat(segmentMarginStr) || 4;
        // Ideal segment width: fixed height plus left/right margin.
        const idealWidth = progressHeight + 2 * segmentMargin;

        // Calculate original count if segments were not allowed to shrink:
        let originalCount = Math.floor(effectiveWidth / idealWidth);
        if (originalCount < 1) originalCount = 1;
        let candidate = 2 * originalCount;

        // Maximum count allowed so that each segment's width doesn't drop below 50% of ideal.
        let maxCount = Math.floor(
            effectiveWidth / (0.5 * idealWidth + 2 * segmentMargin)
        );
        let count = candidate > maxCount ? maxCount : candidate;
        if (count < originalCount) count = originalCount;

        // Compute the width for each segment so they evenly fill the container.
        const totalMargins = count * 2 * segmentMargin;
        const segmentWidth = (effectiveWidth - totalMargins) / count;

        if (count !== this.lastSegmentsCount) {
            this.lastSegmentsCount = count;
            this.progressContainer.innerHTML = "";
            this.segments = [];

            for (let i = 0; i < count; i++) {
                const segment = document.createElement("div");
                segment.classList.add("progress-segment");
                segment.style.width = segmentWidth + "px";
                segment.style.height = progressHeight + "px";
                segment.style.animationDelay = i * 0.15 + "s";
                this.progressContainer.appendChild(segment);
                this.segments.push(segment);
            }
        } else {
            this.segments.forEach((segment, i) => {
                segment.style.width = segmentWidth + "px";
                segment.style.height = progressHeight + "px";
                segment.style.animationDelay = i * 0.15 + "s";
            });
        }
    }

    updateProgress() {
        // Ensure segments are up-to-date.
        this.updateSegments();
        const segmentsCount = this.segments.length;

        if (this.hasAttribute("value")) {
            // Determinate mode: fill segments based on the given value.
            const value = parseFloat(this.getAttribute("value"));
            const max = parseFloat(this.getAttribute("max")) || 100;
            const percentage = (value / max) * 100;
            const segmentsToFill = Math.round(
                (percentage / 100) * segmentsCount
            );

            this.progressContainer.classList.remove("indeterminate");
            this.segments.forEach((segment, index) => {
                if (index < segmentsToFill) {
                    segment.classList.add("filled");
                } else {
                    segment.classList.remove("filled");
                }
            });
        } else {
            // Indeterminate mode.
            this.progressContainer.classList.add("indeterminate");

            this.segments.forEach((segment, i) => {
                segment.classList.remove("filled");
                segment.style.animationDelay =
                    -(segmentsCount - 1 - i) * 0.15 + "s";
            });
        }
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

if (!customElements.get("kp-progress")) {
    customElements.define("kp-progress", KeplerProgress);
}
