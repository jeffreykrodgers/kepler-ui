class KeplerGrid extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Internal properties for grid data, columns, and sorting.
        this.data = [];
        this.columns = [];
        // sortState: null or an object { property: string, direction: "asc" | "desc" }
        this.sortState = null;
        this.render();
    }

    static get observedAttributes() {
        return ["data", "columns"];
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

    // Allow setting grid data/columns via properties.
    set gridData(value) {
        this.data = value;
        console.log("Setting");
        this.render();
    }
    get gridData() {
        return this.data;
    }
    set gridColumns(value) {
        this.columns = value;
        this.render();
    }
    get gridColumns() {
        return this.columns;
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

    renderHeader() {
        let headerHTML = `<tr>`;
        this.columns.forEach((col) => {
            const width = this.getColumnWidth(col);
            const widthStyle = width ? ` style="width: ${width};"` : "";
            const sortable = col.sortable === false ? false : true;
            const headerText = col.header || col.property;
            let sortIconContent = "";
            if (
                sortable &&
                this.sortState &&
                this.sortState.property === col.property
            ) {
                if (this.sortState.direction === "asc") {
                    sortIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16">
                <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>`;
                } else if (this.sortState.direction === "desc") {
                    sortIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="16" height="16">
                <path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>`;
                }
            }
            // Always include a sort-icon container with fixed width (16px) so that the header's layout remains stable.
            const sortIconHTML = `<span class="sort-icon" style="margin-left:4px; display:inline-flex; align-items:center; width:16px; ${
                sortable &&
                this.sortState &&
                this.sortState.property === col.property &&
                this.sortState.direction === "asc"
                    ? "transform: rotate(180deg);"
                    : ""
            }">${sortIconContent}</span>`;

            const content = sortable
                ? `<span class="header-text" style="display:inline-flex; align-items:center; cursor:pointer;">${headerText}${sortIconHTML}</span>`
                : headerText;
            headerHTML += `<th data-property="${col.property}" ${sortable ? 'data-sortable="true"' : ""}${widthStyle}>${content}</th>`;
        });
        headerHTML += `</tr>`;
        return headerHTML;
    }

    getSortedData() {
        let sortedData = [...this.data];
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

    renderBody() {
        let bodyHTML = "";
        const renderData = this.getSortedData();
        renderData.forEach((row) => {
            let rowHTML = `<tr>`;
            this.columns.forEach((col) => {
                const cellValue =
                    row[col.property] !== undefined ? row[col.property] : "";
                if (col.isRowHeader) {
                    rowHTML += `<th>${cellValue}</th>`;
                } else {
                    rowHTML += `<td>${cellValue}</td>`;
                }
            });
            rowHTML += `</tr>`;
            bodyHTML += rowHTML;
        });
        return bodyHTML;
    }

    render() {
        const headerHTML = this.renderHeader();
        const bodyHTML = this.renderBody();
        const tableHTML = `
        <table>
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
            border-bottom: var(--border-medium, 2px) solid var(--base-text--, #ccc);
            padding: var(--spacing-medium, 8px) 0;
        }
        tbody td {
            font-family: Tomorrow, sans-serif;
            border-bottom: var(--border-small, 1px) solid var(--base-text--, #ccc);
            padding: var(--spacing-medium, 8px) 0;
        }
        tbody th {
            font-family: ProFontWindows, sans-serif;
            background: var(--base-text--, #ccc);
            font-size: 20px;
            font-weight: 500;
            color: var(--base-surface, #fff);
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

    handleSort(property) {
        // Cycle sort states: unsorted → asc → desc → unsorted.
        if (!this.sortState || this.sortState.property !== property) {
            this.sortState = { property, direction: "asc" };
        } else if (this.sortState.direction === "asc") {
            this.sortState.direction = "desc";
        } else if (this.sortState.direction === "desc") {
            this.sortState = null;
        }
        this.render();
    }
}

customElements.define("kp-grid", KeplerGrid);
