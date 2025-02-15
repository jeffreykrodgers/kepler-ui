import resolve from "rollup-plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default {
    input: "playground/script.js",
    output: {
        file: "pub/script.js",
        format: "esm",
        sourcemap: true,
    },
    external: ["/dist/kepler-ui.js"],
    plugins: [
        resolve(),
        copy({
            targets: [
                { src: "playground/index.html", dest: "pub" },
                { src: "playground/styles.css", dest: "pub" },
                { src: "dist/styles/**/*", dest: "pub/styles" },
                { src: "dist/assets/**/*", dest: "pub/assets" },
            ],
            flatten: true,
        }),
    ],
};
