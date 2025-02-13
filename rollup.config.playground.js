import resolve from "rollup-plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default {
    input: "public/script.js",
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
                { src: "public/index.html", dest: "pub" },
                { src: "public/styles.css", dest: "pub" },
                { src: "dist/styles/**/*", dest: "pub/styles" },
                { src: "dist/assets/**/*", dest: "pub/assets" },
            ],
            flatten: true,
        }),
    ],
};
