class KeplerGauge extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
          }
    
          .gauge-container {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 100%;
            height: 100%;
          }
    
          .needle {
            transform-origin: 50% 50%;
            transition: transform 0.5s ease;
            filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.4));
          }
    
          .gauge-text {
            font-size: 1.2em;
            fill: ${this.getAttribute("text-color") || "#333"};
            text-anchor: middle;
            font-family: Tomorrow, monospace;
          }
    
          .label {
            font-size: 1em;
            fill: ${this.getAttribute("label-color") || "#333"};
            text-anchor: middle;
            font-family: ProFontWindows, monospace;
          }
    
          .notch {
            stroke-width: 2;
          }
    
          /* Prevent strokes from scaling when the gauge is resized */
          .gauge-svg, .gauge-svg * {
            vector-effect: non-scaling-stroke;
          }
        </style>
        <div class="gauge-container">
          <svg class="gauge-svg" viewBox="0 0 181 181">
            <!-- Background circles -->
            <circle cx="90.5" cy="90.5" r="91" fill="var(--base-text--, rgba(29,29,29,1))" />
            <circle cx="90.5" cy="90.5" r="88" fill="var(--base-surface, rgba(255,255,255,1))" />
    
            <!-- Gauge outline path -->
            <path d="" fill="none" stroke-width="4" class="gauge-outline"/>
    
            <!-- Notches for each label -->
            <g class="notches"></g>
    
            <!-- Needle path -->
            <path d="M93.8147 90.4462C93.8147 91.8566 92.5229 93 90.9294 93C89.3359 93 88.0441 91.8566 88.0441 90.4462C88.0441 89.0357 87.4124 10 90.9294 10C94.4464 10 93.8147 89.0357 93.8147 90.4462Z" class="needle"/>
    
            <!-- Gauge value text, hidden by default -->
            <text x="90.5" y="130" class="gauge-text" style="display: none;">0${this.getAttribute("unit") || "%"}</text>
          </svg>
        </div>
      `;
    }

    connectedCallback() {
        this.size = parseInt(this.getAttribute("size") || 120, 10);
        this.minAngle = parseInt(this.getAttribute("min-angle") || 225, 10);
        this.maxAngle = parseInt(this.getAttribute("max-angle") || 495, 10);
        this.minValue = parseFloat(this.getAttribute("min") || 0);
        this.maxValue = parseFloat(this.getAttribute("max") || 100);
        this.displayValue =
            this.hasAttribute("display-value") &&
            this.getAttribute("display-value") === "true";
        this.labels = JSON.parse(this.getAttribute("labels") || "[]");
        this.unit = this.getAttribute("unit") || "%";
        this.labelRadius = this.getAttribute("label-radius") || 63;

        // Set colors for outline, needle, text, and label
        this.outlineColor = this.getAttribute("outline-color") || "#5FB6FF";
        this.needleColor = this.getAttribute("needle-color") || "#D9D9D9";
        this.textColor = this.getAttribute("text-color") || "#333";
        this.labelColor = this.getAttribute("label-color") || "#333";
        this.ranges = JSON.parse(this.getAttribute("ranges") || "[]");

        // Apply size, colors, and draw gauge components.
        this.applySize();
        this.applyColors();
        this.drawGaugeOutline();
        this.drawLabels();
        this.drawNotches();
        this.updateValue(this.getAttribute("value") || 0);
    }

    static get observedAttributes() {
        return [
            "value",
            "min-angle",
            "max-angle",
            "min",
            "max",
            "display-value",
            "labels",
            "size",
            "outline-color",
            "needle-color",
            "text-color",
            "label-color",
            "unit",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "ranges":
                this.ranges = JSON.parse(newValue || "[]");
                this.drawLabels();
                this.drawNotches();
                this.updateValue(this.getAttribute("value") || 0);
                break;

            case "value":
                this.value = newValue;
                this.updateValue(newValue);
                break;

            case "min-angle":
            case "max-angle":
            case "min":
            case "max":
                this[name.replace("-", "")] = parseFloat(newValue);
                this.drawGaugeOutline();
                this.drawLabels();
                this.drawNotches();
                this.updateValue(this.getAttribute("value") || 0);
                break;

            case "display-value":
                this.displayValue = newValue === "true";
                this.toggleGaugeText();
                break;

            case "labels":
                this.labels = JSON.parse(newValue || "[]");
                this.drawLabels();
                this.drawNotches();
                break;

            case "size":
                this.size = parseInt(newValue, 10);
                this.applySize();
                break;

            case "outline-color":
            case "needle-color":
            case "text-color":
            case "label-color":
                this[name.replace("-", "")] = newValue;
                this.applyColors();
                break;

            case "unit":
                this.unit = newValue || "%";
                this.updateValue(this.getAttribute("value") || 0);
                break;

            default:
                break;
        }
    }

    applySize() {
        const gaugeSvg = this.shadowRoot.querySelector(".gauge-svg");
        gaugeSvg.setAttribute("width", this.size);
        gaugeSvg.setAttribute("height", this.size);

        const container = this.shadowRoot.querySelector(".gauge-container");
        container.style.width = `${this.size}px`;
        container.style.height = `${this.size}px`;
    }

    applyColors() {
        const gaugeOutline = this.shadowRoot.querySelector(".gauge-outline");
        const needle = this.shadowRoot.querySelector(".needle");
        const gaugeText = this.shadowRoot.querySelector(".gauge-text");
        const labels = this.shadowRoot.querySelectorAll(".label");

        gaugeOutline.setAttribute("stroke", this.outlineColor);
        needle.setAttribute("fill", this.needleColor);
        gaugeText.style.fill = this.textColor;
        labels.forEach((label) => (label.style.fill = this.labelColor));
    }

    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    }

    describeArc(x, y, radius, startAngle, endAngle) {
        const start = this.polarToCartesian(x, y, radius, endAngle);
        const end = this.polarToCartesian(x, y, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M",
            start.x,
            start.y,
            "A",
            radius,
            radius,
            0,
            largeArcFlag,
            0,
            end.x,
            end.y,
        ].join(" ");
    }

    drawGaugeOutline() {
        const gaugeSvg = this.shadowRoot.querySelector(".gauge-svg");
        const existingPaths = gaugeSvg.querySelectorAll(".range-path");
        existingPaths.forEach((path) => path.remove());

        let lastEndAngle = this.minAngle;

        this.ranges?.forEach((range) => {
            const startAngle = this.valueToAngle(range.startValue);
            const endAngle = this.valueToAngle(range.endValue);

            if (startAngle > lastEndAngle) {
                const gapPath = this.describeArc(
                    90.5,
                    90.5,
                    80,
                    lastEndAngle,
                    startAngle
                );
                const gapSegment = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );
                gapSegment.setAttribute("d", gapPath);
                gapSegment.setAttribute("fill", "none");
                gapSegment.setAttribute("stroke-width", "4");
                gapSegment.setAttribute("stroke", this.outlineColor);
                gapSegment.classList.add("range-path");
                gaugeSvg.insertBefore(
                    gapSegment,
                    gaugeSvg.querySelector(".needle")
                );
            }

            const rangePath = this.describeArc(
                90.5,
                90.5,
                80,
                startAngle,
                endAngle
            );
            const rangeSegment = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            rangeSegment.setAttribute("d", rangePath);
            rangeSegment.setAttribute("fill", "none");
            rangeSegment.setAttribute("stroke-width", "4");
            rangeSegment.setAttribute("stroke", range.color);
            rangeSegment.classList.add("range-path");
            gaugeSvg.insertBefore(
                rangeSegment,
                gaugeSvg.querySelector(".needle")
            );

            lastEndAngle = endAngle;
        });

        if (lastEndAngle < this.maxAngle) {
            const remainingPath = this.describeArc(
                90.5,
                90.5,
                80,
                lastEndAngle,
                this.maxAngle
            );
            const remainingSegment = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            remainingSegment.setAttribute("d", remainingPath);
            remainingSegment.setAttribute("fill", "none");
            remainingSegment.setAttribute("stroke-width", "4");
            remainingSegment.setAttribute("stroke", this.outlineColor);
            remainingSegment.classList.add("range-path");
            gaugeSvg.insertBefore(
                remainingSegment,
                gaugeSvg.querySelector(".needle")
            );
        }
    }

    drawLabels() {
        this.shadowRoot
            .querySelectorAll(".label")
            .forEach((label) => label.remove());

        const labelCount = this.labels?.length;

        this.labels?.forEach((labelText, index) => {
            const angle =
                this.minAngle +
                (index / (labelCount - 1)) * (this.maxAngle - this.minAngle);
            const position = this.polarToCartesian(
                90.5,
                90.5,
                this.labelRadius,
                angle
            );

            const label = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            label.setAttribute("x", position.x);
            label.setAttribute("y", position.y + 4);
            label.classList.add("label");
            label.textContent = labelText;

            const rangeColor = this.getColorForAngle(angle);
            label.style.fill = rangeColor || this.labelColor;

            this.shadowRoot
                .querySelector("svg")
                .insertBefore(label, this.shadowRoot.querySelector(".needle"));
        });
    }

    drawNotches() {
        const notchesGroup = this.shadowRoot.querySelector(".notches");
        const notchRadius = 80;
        const labelCount = this.labels?.length;

        notchesGroup.innerHTML = "";

        this.labels?.forEach((_, index) => {
            const angle =
                this.minAngle +
                (index / (labelCount - 1)) * (this.maxAngle - this.minAngle);
            const notchStart = this.polarToCartesian(
                90.5,
                90.5,
                notchRadius,
                angle
            );
            const notchEnd = this.polarToCartesian(
                90.5,
                90.5,
                notchRadius - 5,
                angle
            );

            const notch = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );
            notch.setAttribute("x1", notchStart.x);
            notch.setAttribute("y1", notchStart.y);
            notch.setAttribute("x2", notchEnd.x);
            notch.setAttribute("y2", notchEnd.y);
            notch.classList.add("notch");

            const rangeColor = this.getColorForAngle(angle);
            notch.setAttribute("stroke", rangeColor || this.outlineColor);

            notchesGroup.appendChild(notch);
        });
    }

    toggleGaugeText() {
        const gaugeText = this.shadowRoot.querySelector(".gauge-text");
        gaugeText.style.display = this.displayValue ? "block" : "none";
    }

    valueToAngle(value) {
        return (
            this.minAngle +
            ((value - this.minValue) / (this.maxValue - this.minValue)) *
                (this.maxAngle - this.minAngle)
        );
    }

    getColorForAngle(angle) {
        const value = this.angleToValue(angle);
        const range = this.ranges?.find(
            (range) => value >= range.startValue && value <= range.endValue
        );
        return range?.color || null;
    }

    angleToValue(angle) {
        return (
            this.minValue +
            ((angle - this.minAngle) / (this.maxAngle - this.minAngle)) *
                (this.maxValue - this.minValue)
        );
    }

    updateValue(value) {
        const numericValue = Math.min(
            this.maxValue,
            Math.max(this.minValue, parseFloat(value))
        );
        const needle = this.shadowRoot.querySelector(".needle");
        const needleRotation =
            this.minAngle +
            ((numericValue - this.minValue) / (this.maxValue - this.minValue)) *
                (this.maxAngle - this.minAngle);

        needle.style.transform = `rotate(${needleRotation}deg)`;

        const rangeColor = this.getColorForAngle(needleRotation);
        needle.setAttribute("fill", rangeColor || this.needleColor);

        const gaugeText = this.shadowRoot.querySelector(".gauge-text");
        gaugeText.textContent = `${Math.round(numericValue)}${this.unit}`;
        gaugeText.style.fill = rangeColor || this.textColor;

        this.toggleGaugeText();
    }
}

customElements.define("kp-gauge", KeplerGauge);
