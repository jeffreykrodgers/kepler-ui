import resolve from "rollup-plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";
import replace from "@rollup/plugin-replace";

export default {
    input: "src/index.js",
    output: {
        file: "dist/kepler-ui.js",
        format: "esm",
    },
    plugins: [
        replace({
            delimiters: ["", ""],
            values: {
                // prettier-ignore
                "../styles": './styles',
            },
            preventAssignment: true,
        }),
        resolve(),
        terser(),
        copy({
            targets: [
                { src: "src/styles", dest: "dist" },
                { src: "src/assets", dest: "dist" },
                { src: "README.md", dest: "dist" },
            ],
        }),
    ],
};
