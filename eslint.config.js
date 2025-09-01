const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const simpleImportSort = require("eslint-plugin-simple-import-sort");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      "react/display-name": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "sort-imports": "off",
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
]);
