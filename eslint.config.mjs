import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Project-wide rule overrides ──────────────────────────────────
  {
    rules: {
      // Allow unused vars/args when prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Allow empty interfaces that extend a single type (common React pattern)
      "@typescript-eslint/no-empty-object-type": [
        "warn",
        { allowInterfaces: "with-single-extends" },
      ],

      // Keep as warning — mock files still use `any` during migration
      "@typescript-eslint/no-explicit-any": "warn",

      // Prefer const assertions & template expressions
      "prefer-const": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Generated files — never lint
    "src/generated/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
