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
    "next-env.d.ts",
    // Gerado por `opennextjs-cloudflare build`. Nao e nosso codigo e nao
    // adianta corrigir: some e volta a cada build.
    ".open-next/**",
  ]),
  {
    rules: {
      // O codigo ja marca parametro de proposito nao usado com "_"
      // (`_anterior` nas server actions). Isto so torna a convencao
      // explicita, em vez de depender do "after-used" padrao da regra.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
