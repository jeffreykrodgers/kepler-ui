import "/dist/kepler-ui.js";

const themeComponent = document.querySelector("kp-theme");
const themeSelect = document.getElementById("themeSelect");
const radioGroup = document.getElementById("exampleRadioGroup");
const loginForm = document.getElementById("loginForm");
const dialog = document.querySelector("kp-dialog");
const router = document.querySelector("kp-router");
const grid = document.querySelector("kp-grid");

router.setRoutes([
    { route: "/", slot: "routeSlot1" },
    { route: "/test", src: "/test.html" }, // load content from an external file
]);

// Set Defaults
const themeOptions = [
    { value: "kepler-light", label: "Light Theme", selected: true },
    { value: "kepler-dark", label: "Dark Theme" },
    { value: "amber", label: "Amber Theme" },
    { value: "matrix", label: "Matrix Theme" },
    { value: "galaxy", label: "Galaxy Theme" },
];

themeSelect?.setAttribute("options", JSON.stringify(themeOptions));

// Event Listeners
function serializeForm(form) {
    console.log("Form", form);
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
}

loginForm?.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent navigation
    console.log(serializeForm(loginForm));
});

radioGroup?.addEventListener("change", (event) => {
    console.log("Selected Radio Value:", event.detail.value);
});

themeSelect?.addEventListener("change", (event) => {
    const selectedTheme = event.detail.value;
    themeComponent.setAttribute("theme", selectedTheme);
});

// Get a reference to the grid component

// New data array (for example, replacing the existing data)
const newData = [
    { name: "Diana", age: 28, city: "Seattle" },
    { name: "Edward", age: 32, city: "Boston" },
    { name: "Fiona", age: 27, city: "Austin" },
];

// New column configuration array
const newColumns = [
    {
        property: "name",
        header: "Name",
        isRowHeader: true,
        width: "150px",
    },
    { property: "age", header: "Age" },
    { property: "city", header: "City" },
];

// Or you can update via attributes (remember to stringify the JSON):
grid?.setAttribute("data", JSON.stringify(newData));
grid?.setAttribute("columns", JSON.stringify(newColumns));
