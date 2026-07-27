/**
 * File: tooling/eslint-config/next.js
 * Purpose: ESLint config for Next.js apps (apps/web, apps/admin).
 */
module.exports = {
  extends: ["./base.js", "next/core-web-vitals"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
