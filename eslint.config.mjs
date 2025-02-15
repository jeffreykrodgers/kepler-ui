import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: { globals: globals.browser },
        rules: {
            "max-len": ["error", { code: 180 }], // increased maximum line length to 120 characters
        },
    },
    pluginJs.configs.recommended,
];
