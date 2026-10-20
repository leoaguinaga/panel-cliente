import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ['**/*.{ts,tsx,js,mjs}'], rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['@prisma/*', 'prisma', 'pg', '**/lib/prisma', '**/lib/server/activity'], message: 'Usa la API NestJS; el frontend no debe conectar a PostgreSQL.' }] }] } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "prisma/generated/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
