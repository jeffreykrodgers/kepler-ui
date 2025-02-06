import resolve from "rollup-plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default {
    // Use the test site's script as the entry point
    input: "public/script.js",
    output: {
        // Output the bundle for the test site to the pub folder
        file: "pub/script.js",
        format: "esm",
        sourcemap: true,
    },
    external: ["/dist/kepler-ui.js"],
    plugins: [
        resolve(),
        // Copy the static assets from public to pub
        copy({
            targets: [
                { src: "public/index.html", dest: "pub" },
                { src: "public/styles.css", dest: "pub" },
                { src: "dist/styles/**/*", dest: "pub/styles" },
                { src: "dist/assets/**/*", dest: "pub/assets" },
                // Copy any other assets if needed
            ],
            // Using --flat behavior if desired, or preserving structure as needed
            flatten: true,
        }),
    ],
};
