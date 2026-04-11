import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".venv/**",
    "**/.venv/**",
    "services/license-verification/.venv/**",
    ".pytest_cache/**",
    "**/.pytest_cache/**",
    "services/license-verification/.pytest_cache/**",
  ]),
]);

export default eslintConfig;
