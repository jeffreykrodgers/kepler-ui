import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/kepler-grid.js";

describe("KeplerGrid", () => {
    const sampleData = [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Bob", age: 25 },
        { id: 3, name: "Charlie", age: 35 },
    ];

    const sampleColumns = [
        { property: "id", header: "ID" },
        { property: "name", header: "Name", sortable: true },
        { property: "age", header: "Age", sortable: true },
    ];

    it("renders a table with header and body based on data and columns", async () => {
        const el = await fixture(html`
            <kp-grid
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);
        const table = el.shadowRoot.querySelector("table");
        expect(table).to.exist;

        const headerCells = el.shadowRoot.querySelectorAll("thead th");
        expect(headerCells.length).to.equal(sampleColumns.length);
        expect(headerCells[0].textContent).to.contain("ID");
        expect(headerCells[1].textContent).to.contain("Name");
        expect(headerCells[2].textContent).to.contain("Age");

        const bodyRows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(bodyRows.length).to.equal(sampleData.length);
    });

    it("sorts data when a sortable header is clicked", async () => {
        const el = await fixture(html`
            <kp-grid
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);

        let firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Alice");

        const nameHeader = el.shadowRoot.querySelector(
            'th[data-property="name"]'
        );
        nameHeader.click();
        await new Promise((r) => setTimeout(r, 0));

        firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Alice");

        nameHeader.click();
        await new Promise((r) => setTimeout(r, 0));
        firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Charlie");
    });

    it("handles invalid JSON for data and columns gracefully", async () => {
        const el = await fixture(html`
            <kp-grid data="invalid" columns="invalid"></kp-grid>
        `);
        const bodyRows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(bodyRows.length).to.equal(0);
    });

    it("applies table-level sortable default to columns that don't override", async () => {
        const columns = [
            { property: "id", header: "ID" },
            { property: "name", header: "Name" },
        ];
        const el = await fixture(html`
            <kp-grid
                sortable="true"
                columns="${JSON.stringify(columns)}"
                data="[]"
            ></kp-grid>
        `);
        const idHeader = el.shadowRoot.querySelector('th[data-property="id"]');
        const nameHeader = el.shadowRoot.querySelector(
            'th[data-property="name"]'
        );

        expect(idHeader.hasAttribute("data-sortable")).to.be.true;
        expect(nameHeader.hasAttribute("data-sortable")).to.be.true;
    });

    it("respects column-level sortable override", async () => {
        const columns = [
            { property: "id", header: "ID", sortable: true },
            { property: "name", header: "Name", sortable: false },
        ];
        const el = await fixture(html`
            <kp-grid
                sortable="true"
                columns="${JSON.stringify(columns)}"
                data="[]"
            ></kp-grid>
        `);
        const idHeader = el.shadowRoot.querySelector('th[data-property="id"]');
        const nameHeader = el.shadowRoot.querySelector(
            'th[data-property="name"]'
        );

        expect(idHeader.hasAttribute("data-sortable")).to.be.true;
        expect(nameHeader.hasAttribute("data-sortable")).to.be.false;
    });

    it("renders filter icons when filtering is enabled at table level", async () => {
        const el = await fixture(html`
            <kp-grid
                filtering="true"
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);
        const filterIcons = el.shadowRoot.querySelectorAll(".filter-icon");
        // all columns become filterable by default
        expect(filterIcons.length).to.equal(sampleColumns.length);
    });

    it("hides filter icons when filtering is disabled", async () => {
        const el = await fixture(html`
            <kp-grid
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);
        const filterIcons = el.shadowRoot.querySelectorAll(".filter-icon");
        expect(filterIcons.length).to.equal(0);
    });

    it("respects column-level filterable override", async () => {
        const columns = [
            { property: "id", header: "ID", filterable: false },
            { property: "name", header: "Name", filterable: true },
        ];
        const el = await fixture(html`
            <kp-grid
                filtering="true"
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(columns)}"
            ></kp-grid>
        `);
        const idHeader = el.shadowRoot.querySelector('th[data-property="id"]');
        const nameHeader = el.shadowRoot.querySelector(
            'th[data-property="name"]'
        );

        expect(idHeader.querySelector(".filter-icon")).to.be.null;
        expect(nameHeader.querySelector(".filter-icon")).to.exist;
    });

    it("filters rows based on filter values applied programmatically", async () => {
        const el = await fixture(html`
            <kp-grid
                filtering="true"
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);

        // apply a filter for "a" in the name column (matches "Alice" & "Charlie")
        el.filters = { name: "a" };
        el.render();

        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(2);

        // ensure one row contains "Alice" and the other "Charlie"
        const texts = Array.from(rows).map((r) => r.textContent);
        expect(texts.some((t) => t.includes("Alice"))).to.be.true;
        expect(texts.some((t) => t.includes("Charlie"))).to.be.true;

        // clear filters and confirm all rows reappear
        el.filters = {};
        el.render();
        const allRows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(allRows.length).to.equal(sampleData.length);
    });

    it("adds 'selectable' class to each row when selectable=true", async () => {
        const el = await fixture(html`
            <kp-grid
                selectable="true"
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);
        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(sampleData.length);
        rows.forEach((row) => {
            expect(row.classList.contains("selectable")).to.be.true;
        });
    });

    it("fires a 'row-select' event with the row's data when a selectable row is clicked", async () => {
        const el = await fixture(html`
            <kp-grid
                selectable="true"
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            ></kp-grid>
        `);

        let receivedDetail = null;
        el.addEventListener("row-select", (e) => {
            receivedDetail = e.detail;
        });

        // click the second row (index 1 → Bob)
        const secondRow = el.shadowRoot.querySelectorAll("tbody tr")[1];
        secondRow.click();
        // wait one microtask for the handler to fire
        await new Promise((r) => setTimeout(r, 0));

        expect(receivedDetail).to.deep.equal(sampleData[1]);
    });
});
