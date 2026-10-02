import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"
import promise from "eslint-plugin-promise"
import regexp from "eslint-plugin-regexp"
import security from "eslint-plugin-security"
import compat from "eslint-plugin-compat"
import globals from "globals"
import unusedImports from "eslint-plugin-unused-imports"

const localPlugin = {
  meta: { name: "local" },
  rules: {
    "no-blanket-eslint-disable": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow eslint-disable directives without specific rules and reasons",
        },
        schema: [],
        messages: {
          blanket:
            "Blanket '{{directive}}' disables every rule. Name one rule and provide a reason: '{{directive}} rule-name -- reason'",
          noReason:
            "'{{directive}} {{rule}}' needs a reason. Add one after '--': '{{directive}} {{rule}} -- reason'",
        },
      },
      create(context) {
        const directives = new Set([
          "eslint-disable",
          "eslint-disable-line",
          "eslint-disable-next-line",
        ])
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              const parts = comment.value.trim().split(/\s+/u)
              const [directive, ...rest] = parts
              if (directive === undefined || !directives.has(directive)) {
                continue
              }
              const remainder = rest.join(" ")
              if (remainder === "") {
                context.report({
                  node: comment,
                  messageId: "blanket",
                  data: { directive },
                })
              } else if (!remainder.includes("--")) {
                context.report({
                  node: comment,
                  messageId: "blanket",
                  data: { directive },
                })
              } else {
                const [rule, ...reasonParts] = remainder.split(" -- ")
                const reason = reasonParts.join(" -- ").trim()
                if (reason === "") {
                  context.report({
                    node: comment,
                    messageId: "noReason",
                    data: { directive, rule },
                  })
                }
              }
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "node_modules/**",
    "next-env.d.ts",
    "**/*.tsbuildinfo",
  ]),

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: { local: localPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-expect-error": true,
          "ts-check": false,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "local/no-blanket-eslint-disable": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { local: localPlugin },
    rules: {
      "local/no-blanket-eslint-disable": "error",
    },
  },

  promise.configs["flat/recommended"],
  regexp.configs["flat/recommended"],
  security.configs.recommended,
  compat.configs["flat/recommended"],

  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],
    plugins: { "unused-imports": unusedImports },
    rules: {
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-empty": "error",
      "no-useless-catch": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],

      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
])
