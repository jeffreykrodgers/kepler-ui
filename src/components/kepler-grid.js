class KeplerGrid extends HTMLElement {
    static get observedAttributes() {
        return ["data", "columns"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.data = [];
        this.columns = [];
        this.sortState = null;
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === "data") {
                try {
                    this.data = JSON.parse(newValue);
                } catch (e) {
                    console.error("Invalid JSON for data:", newValue);
                    this.data = [];
                }
            } else if (name === "columns") {
                try {
                    this.columns = JSON.parse(newValue);
                } catch (e) {
                    console.error("Invalid JSON for columns:", newValue);
                    this.columns = [];
                }
            }
            this.render();
        }
    }

    get gridColumns() {
        return this.columns;
    }
    set gridColumns(value) {
        this.columns = value;
        this.render();
    }

    get gridData() {
        return this.data;
    }
    set gridData(value) {
        this.data = value;
        this.render();
    }

    attachSortListeners() {
        const headerCells = this.shadowRoot.querySelectorAll(
            'th[data-sortable="true"]'
        );
        headerCells.forEach((cell) => {
            cell.addEventListener("click", () => {
                const property = cell.getAttribute("data-property");
                this.handleSort(property);
            });
        });
    }

    getColumnWidth(col) {
        if (col.width !== undefined) {
            if (typeof col.width === "number") {
                return col.width + "px";
            } else if (typeof col.width === "string") {
                return /^\d+$/.test(col.width) ? col.width + "px" : col.width;
            }
        }
        return "";
    }

    getSortedData() {
        const sortedData = [...this.data];
        if (this.sortState && this.sortState.property) {
            const { property, direction } = this.sortState;
            sortedData.sort((a, b) => {
                const aVal = a[property],
                    bVal = b[property];
                if (typeof aVal === "number" && typeof bVal === "number") {
                    return direction === "asc" ? aVal - bVal : bVal - aVal;
                }
                return direction === "asc"
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal));
            });
        }
        return sortedData;
    }

    handleSort(property) {
        if (!this.sortState || this.sortState.property !== property) {
            this.sortState = { property, direction: "asc" };
        } else if (this.sortState.direction === "asc") {
            this.sortState.direction = "desc";
        } else if (this.sortState.direction === "desc") {
            this.sortState = null;
        }
        this.render();
    }

    render() {
        const headerHTML = this.renderHeader();
        const bodyHTML = this.renderBody();
        const tableHTML = `
        <table part="table">
          <thead>${headerHTML}</thead>
          <tbody>${bodyHTML}</tbody>
        </table>
      `;

        this.shadowRoot.innerHTML = `
        <style>
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: var(--spacing-small, 4px);
          }
          thead th {
            font-family: ProFontWindows, sans-serif;
            font-size: 20px;
            font-weight: 500;
            border-bottom: var(--border-medium, 2px) solid var(--base-text--, rgba(29,29,29,1));
            padding: var(--spacing-medium, 8px) 0;
          }
          tbody td {
            font-family: Tomorrow, sans-serif;
            border-bottom: var(--border-small, 1px) solid var(--base-text--, rgba(29,29,29,1));
            padding: var(--spacing-medium, 8px) 0;
          }
          tbody th {
            font-family: ProFontWindows, sans-serif;
            background: var(--base-text--, rgba(29,29,29,1));
            font-size: 20px;
            font-weight: 500;
            color: var(--base-surface, rgba(241,246,250,1));
            padding: var(--spacing-medium, 8px);
          }
          th, td {
            text-align: left;
          }
          .sort-icon {
            width: 16px;
            display: inline-flex;
            align-items: center;
          }
        </style>
        ${tableHTML}
      `;

        this.attachSortListeners();
    }

    renderBody() {
        let bodyHTML = "";
        const sortedData = this.getSortedData();

        sortedData.forEach((row) => {
            let rowHTML = `<tr>`;

            this.columns.forEach((col) => {
                const cellValue =
                    row[col.property] !== undefined ? row[col.property] : "";
                const cellTag = col.isRowHeader ? "th" : "td";

                if (col.template) {
                    const templateHTML = this._renderTemplate(
                        col.template,
                        row
                    );
                    rowHTML += `<${cellTag}>${templateHTML !== null ? templateHTML : cellValue}</${cellTag}>`;
                } else {
                    rowHTML += `<${cellTag}>${cellValue}</${cellTag}>`;
                }
            });
            rowHTML += `</tr>`;
            bodyHTML += rowHTML;
        });
        return bodyHTML;
    }

    renderHeader() {
        let headerHTML = `<tr>`;

        this.columns.forEach((col) => {
            const width = this.getColumnWidth(col);
            const widthStyle = width ? ` style="width: ${width};"` : "";
            const sortable = col.sortable !== false;
            let cellContent = "";

            if (col.headerTemplate) {
                const templateHTML = this._renderHeaderTemplate(col);
                cellContent =
                    templateHTML !== null
                        ? templateHTML
                        : col.header || col.property;
            } else {
                let sortIconContent = "";
                if (
                    sortable &&
                    this.sortState &&
                    this.sortState.property === col.property
                ) {
                    if (this.sortState.direction === "asc") {
                        sortIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" style="transform: rotate(180deg);">
                            <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                        </svg>`;
                    } else if (this.sortState.direction === "desc") {
                        sortIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16">
                            <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                        </svg>`;
                    }
                }
                const sortIconHTML = `<span class="sort-icon" style="margin-left:4px; display:inline-flex; align-items:center; width:16px;">${sortIconContent}</span>`;

                cellContent = sortable
                    ? `<span class="header-text" style="cursor:pointer; display:inline-flex; align-items:center;">${col.header || col.property}${sortIconHTML}</span>`
                    : col.header || col.property;
            }
            headerHTML += `<th data-property="${col.property}" ${sortable ? 'data-sortable="true"' : ""}${widthStyle}>${cellContent}</th>`;
        });

        headerHTML += `</tr>`;
        return headerHTML;
    }

    _cloneTemplate(slotName) {
        const templateElement = this.querySelector(`[slot="${slotName}"]`);

        if (templateElement && templateElement.content) {
            return document.importNode(templateElement.content, true);
        }

        return null;
    }

    _renderHeaderTemplate(col) {
        const clone = this._cloneTemplate(col.headerTemplate);
        if (!clone) return null;

        const textPlaceholder = clone.querySelector("[data-header-text]");
        if (textPlaceholder) {
            textPlaceholder.textContent = col.header || col.property;
        }

        const sortIconPlaceholder = clone.querySelector("[data-sort-icon]");
        if (
            col.sortable !== false &&
            sortIconPlaceholder &&
            this.sortState &&
            this.sortState.property === col.property
        ) {
            let sortIconHTML = "";
            if (this.sortState.direction === "asc") {
                sortIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16">
            <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
          </svg>`;
            } else if (this.sortState.direction === "desc") {
                sortIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16" style="transform: rotate(180deg);">
            <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
          </svg>`;
            }
            sortIconPlaceholder.innerHTML = sortIconHTML;
        }

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clone);

        return tempDiv.innerHTML;
    }

    _renderTemplate(slotName, rowData) {
        const clone = this._cloneTemplate(slotName);

        if (!clone) return null;

        Object.keys(rowData).forEach((key) => {
            const placeholder = clone.querySelector(`[data-cell-${key}]`);
            if (placeholder) {
                placeholder.textContent = rowData[key];
            }
        });

        const tempDiv = document.createElement("div");
        tempDiv.appendChild(clone);

        return tempDiv.innerHTML;
    }
}

if (!customElements.get("kp-grid")) {
    customElements.define("kp-grid", KeplerGrid);
}
