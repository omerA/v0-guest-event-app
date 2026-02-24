import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import nextConfig from "eslint-config-next/core-web-vitals"
import prettierConfig from "eslint-config-prettier"

export default [
  // Next.js flat config (includes React, React Hooks, JSX a11y rules)
  ...nextConfig,

  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
  },

  // Prettier must be last to disable formatting rules
  prettierConfig,

  // Global ignores
  {
    ignores: [".next/**", "node_modules/**", "prisma/generated/**"],
  },
]
