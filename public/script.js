import "/dist/kepler-ui.js";

const button2 = document.querySelector("#getValueButton");

button2.addEventListener("click", () => {
    const menu = document.querySelector("#multiMenu");
    console.log("Menu Value", menu.value);
});
