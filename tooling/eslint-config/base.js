/**
 * File: tooling/eslint-config/base.js
 * Purpose: Base ESLint rules shared by every app and package.
 *          Enforces the project's "no any / no ts-ignore / no inline SQL"
 *          coding standard at the linter level, not just by convention.
 */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "drizzle"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "drizzle/enforce-delete-with-where": "error",
    "drizzle/enforce-update-with-where": "error",
  },
};
