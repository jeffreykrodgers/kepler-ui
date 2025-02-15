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
            >
            </kp-grid>
        `);
        const table = el.shadowRoot.querySelector("table");
        expect(table).to.exist;

        // Check header cells count and content
        const headerCells = el.shadowRoot.querySelectorAll("thead th");
        expect(headerCells.length).to.equal(sampleColumns.length);
        expect(headerCells[0].textContent).to.contain("ID");
        expect(headerCells[1].textContent).to.contain("Name");
        expect(headerCells[2].textContent).to.contain("Age");

        // Check that the body has the correct number of rows.
        const bodyRows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(bodyRows.length).to.equal(sampleData.length);
    });

    it("sorts data when a sortable header is clicked", async () => {
        const el = await fixture(html`
            <kp-grid
                data="${JSON.stringify(sampleData)}"
                columns="${JSON.stringify(sampleColumns)}"
            >
            </kp-grid>
        `);

        // Initially, data is in sampleData order (first row: Alice).
        let firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Alice");

        // Find the sortable header for "name".
        const nameHeader = el.shadowRoot.querySelector(
            'th[data-property="name"]'
        );
        expect(nameHeader).to.exist;

        // Click to trigger ascending sort.
        nameHeader.click();
        await new Promise((r) => setTimeout(r, 0));
        // With ascending order, first row should remain "Alice".
        firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Alice");

        // Click again to toggle descending sort.
        nameHeader.click();
        await new Promise((r) => setTimeout(r, 0));
        // Now the first row should be "Charlie" (highest alphabetically).
        firstRowCells = el.shadowRoot.querySelectorAll(
            "tbody tr:first-child td"
        );
        expect(firstRowCells[1].textContent).to.contain("Charlie");
    });

    it("handles invalid JSON for data and columns gracefully", async () => {
        const el = await fixture(html`
            <kp-grid data="invalid" columns="invalid"></kp-grid>
        `);
        // If JSON is invalid, grid data should default to empty arrays.
        const bodyRows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(bodyRows.length).to.equal(0);
    });
});
