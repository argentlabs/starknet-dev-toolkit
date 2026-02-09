import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist", "examples", "node_modules", "eslint.config.js"],
  },
  // 1. Base JS Rules
  js.configs.recommended,
  // 2. TypeScript Rules
  ...tseslint.configs.recommendedTypeChecked,
  // 3. Project-wide Rules
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
    },
  },
]);
