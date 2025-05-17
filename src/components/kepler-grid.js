import { injectGlobalFonts } from "../modules/helpers.js";

class KeplerGrid extends HTMLElement {
    static get observedAttributes() {
        return ["data", "columns", "sortable", "filtering", "selectable"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        injectGlobalFonts();

        this.data = [];
        this.columns = [];
        this.sortState = null;
        this.sortable = false;
        this.filtering = false;
        this.selectable = false;
        this.filters = {};
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

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        try {
            if (name === "data") {
                this.data = JSON.parse(newValue);
            } else if (name === "columns") {
                this.columns = JSON.parse(newValue);
            } else if (name === "sortable") {
                this.sortable = newValue === "true";
            } else if (name === "filtering") {
                this.filtering = newValue === "true";
            } else if (name === "selectable") {
                this.selectable = newValue === "true";
            }
        } catch {
            if (name === "data") this.data = [];
            if (name === "columns") this.columns = [];
            if (name === "sortable") this.sortable = false;
            if (name === "filtering") this.filtering = false;
            if (name === "selectable") this.selectable = false;
        }
        this.render();
    }

    connectedCallback() {
        // capture-phase so we see filter-icon clicks before kp-menu stops propagation
        this.shadowRoot.addEventListener(
            "click",
            this._handleGridClick.bind(this),
            { capture: true }
        );
        this.render();
    }

    _handleGridClick(e) {
        const path = e.composedPath();

        // 1) Apply / Clear filter buttons
        const btn = path.find(
            (el) => el.tagName === "KP-BUTTON" && el.hasAttribute("data-action")
        );
        if (btn) {
            const action = btn.getAttribute("data-action");
            const column = btn.getAttribute("data-column");
            const menu = path.find((el) => el.tagName === "KP-MENU");
            if (menu) {
                const kpInput = menu.shadowRoot.querySelector("kp-input");
                const nativeInput = kpInput?.shadowRoot.querySelector("input");
                if (action === "apply" && nativeInput) {
                    this.filters[column] = nativeInput.value || "";
                } else if (action === "clear") {
                    delete this.filters[column];
                }
            }
            this.render();
            return;
        }

        // 2) Filter-icon click → focus native <input> & wire Enter→Apply
        const filterIcon = path.find((el) =>
            el.classList?.contains("filter-icon")
        );
        if (filterIcon) {
            requestAnimationFrame(() => {
                const menu = this.shadowRoot.querySelector(
                    `kp-menu[anchor="#${filterIcon.id}"]`
                );
                if (!menu) return;
                const kpInput = menu.shadowRoot.querySelector("kp-input");
                const nativeInput = kpInput?.shadowRoot.querySelector("input");
                if (!nativeInput) return;
                nativeInput.focus();
                if (!nativeInput._enterHandler) {
                    nativeInput._enterHandler = (ev) => {
                        if (ev.key === "Enter") {
                            ev.preventDefault();
                            menu.shadowRoot
                                .querySelector('[data-action="apply"]')
                                ?.click();
                        }
                    };
                    nativeInput.addEventListener(
                        "keydown",
                        nativeInput._enterHandler
                    );
                }
            });
            return;
        }
    }

    _attachSortListeners() {
        this.shadowRoot
            .querySelectorAll('th[data-sortable="true"]')
            .forEach((cell) => {
                cell.addEventListener("click", () => {
                    const prop = cell.getAttribute("data-property");
                    this._handleSort(prop);
                });
            });
    }

    _attachSelectListeners() {
        if (!this.selectable) return;
        const rows = this.shadowRoot.querySelectorAll("tbody tr.selectable");
        rows.forEach((rowEl, i) => {
            rowEl.addEventListener("click", () => {
                const rowData = this._getSortedData()[i];
                this.dispatchEvent(
                    new CustomEvent("row-select", {
                        detail: rowData,
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        });
    }

    _cloneTemplate(slotName) {
        const tpl = this.querySelector(`[slot="${slotName}"]`);
        return tpl?.content ? document.importNode(tpl.content, true) : null;
    }

    _getFilteredData() {
        return this.data.filter((row) =>
            Object.entries(this.filters).every(([key, val]) => {
                const rowVal = String(row[key] ?? "").toLowerCase();
                return rowVal.includes(val.toLowerCase());
            })
        );
    }

    _getFilterIcon(col) {
        const prop = col.property;
        return `
      <kp-menu anchor="#filter-icon-${prop}" items='[{"template":"filter-${prop}"}]' track-selection="false">
        <template slot="filter-${prop}">
          <kp-input placeholder="Filter..." value="${this.filters[prop] || ""}"></kp-input>
          <kp-button color="primary" data-action="apply" data-column="${prop}">Apply</kp-button>
          <kp-button data-action="clear" data-column="${prop}">Clear</kp-button>
        </template>
      </kp-menu>
      <span id="filter-icon-${prop}" class="filter-icon">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M3 4h18v2l-7 7v5l-4 2v-7l-7-7V4z" fill="currentColor"/>
        </svg>
      </span>`;
    }

    _getSortedData() {
        const filtered = this._getFilteredData();
        if (!this.sortState?.property) return filtered;
        const { property, direction } = this.sortState;
        return filtered.slice().sort((a, b) => {
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

    _handleSort(property) {
        if (!this.sortState || this.sortState.property !== property) {
            this.sortState = { property, direction: "asc" };
        } else if (this.sortState.direction === "asc") {
            this.sortState.direction = "desc";
        } else {
            this.sortState = null;
        }
        this.render();
    }

    _isColumnSortable(col) {
        return col.sortable !== undefined ? col.sortable : this.sortable;
    }

    _isColumnFilterable(col) {
        return col.filterable !== undefined ? col.filterable : this.filtering;
    }

    _renderBody() {
        return this._getSortedData()
            .map((row) => this._renderRow(row))
            .join("");
    }

    _renderCell(row, col) {
        const value = row[col.property] ?? "";
        const tag = col.isRowHeader ? "th" : "td";
        const content = col.template
            ? (this._renderTemplate(col.template, row) ?? value)
            : value;
        return `<${tag}>${content}</${tag}>`;
    }

    _renderHeader() {
        return `<tr>${this.columns
            .map((col) => this._renderHeaderCell(col))
            .join("")}</tr>`;
    }

    _renderHeaderCell(col) {
        const widthStyle = this._getColumnWidth(col);
        const sortable = this._isColumnSortable(col);
        const filterable = this._isColumnFilterable(col);

        let content = col.header || col.property;
        if (sortable) content += this._getSortIcon(col);
        if (filterable) content += this._getFilterIcon(col);

        return `<th
      data-property="${col.property}"
      ${sortable ? 'data-sortable="true"' : ""}
      ${widthStyle}
    >${content}</th>`;
    }

    _renderRow(row) {
        const cls = this.selectable ? "selectable" : "";
        const cells = this.columns
            .map((col) => this._renderCell(row, col))
            .join("");
        return `<tr class="${cls}">${cells}</tr>`;
    }

    _renderTemplate(slotName, rowData) {
        const clone = this._cloneTemplate(slotName);
        if (!clone) return null;
        Object.entries(rowData).forEach(([key, value]) => {
            const el = clone.querySelector(`[data-cell-${key}]`);
            if (el) el.textContent = value;
        });
        const wrapper = document.createElement("div");
        wrapper.appendChild(clone);
        return wrapper.innerHTML;
    }

    _getColumnWidth(col) {
        if (col.width !== undefined) {
            if (typeof col.width === "number") {
                return `style="width: ${col.width}px;"`;
            }
            if (typeof col.width === "string") {
                return /^\d+$/.test(col.width)
                    ? `style="width: ${col.width}px;"`
                    : `style="width: ${col.width};"`;
            }
        }
        return "";
    }

    _getSortIcon(col) {
        if (!this.sortState || this.sortState.property !== col.property) {
            return `<span class="sort-icon"></span>`;
        }
        const dir = this.sortState.direction;
        const rotate =
            dir === "asc" ? ' style="transform: rotate(180deg);"' : "";
        return `
      <span class="sort-icon">
        <svg viewBox="0 0 20 20" width="16" height="16"${rotate}>
          <path
            d="M5 7 L10 12 L15 7"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
        </svg>
      </span>`;
    }

    render() {
        this.shadowRoot.innerHTML = `
      <style>
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
        }
        thead th {
          font-family: ProFontWindows, sans-serif;
          font-size: 20px;
          font-weight: 500;
          border-bottom: 2px solid var(--base-text--, rgba(29,29,29,1));
          padding: 8px 0;
          position: relative;
        }
        tbody td {
          font-family: Tomorrow, sans-serif;
          border-bottom: 1px solid var(--base-text--, rgba(29,29,29,1));
          padding: 8px 0;
        }
        tbody th {
          font-family: ProFontWindows, sans-serif;
          background: var(--base-text--, rgba(29,29,29,1));
          font-size: 20px;
          font-weight: 500;
          color: var(--base-surface, rgba(241,246,250,1));
          padding: 8px;
        }
        th, td {
          text-align: left;
        }
        .sort-icon,
        .filter-icon {
          width: 16px;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          margin-left: 4px;
        }
        tbody tr.selectable {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        tbody tr.selectable:hover {
          background-color: var(--row-hover-bg, rgba(0,0,0,0.05));
        }
      </style>
      <table part="table">
        <thead>${this._renderHeader()}</thead>
        <tbody>${this._renderBody()}</tbody>
      </table>
    `;
        this._attachSortListeners();
        this._attachSelectListeners();
    }
}

if (!customElements.get("kp-grid")) {
    customElements.define("kp-grid", KeplerGrid);
}
