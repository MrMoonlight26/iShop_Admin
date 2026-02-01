import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Project-level rule overrides to allow gradual typing fixes during migration.
  {
    rules: {
      // many files currently use `any` as a pragmatic fix during conversion — warn instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      // allow ts-ignore / ts-nocheck comments temporarily
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default eslintConfig;
