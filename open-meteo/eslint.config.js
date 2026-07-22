const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.node },
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: { globals: { ...globals.jest } },
  },
];
