import base from "./eslint.base.mjs"

export default [
  {
    ignores: [
      "node_modules/**",
      "Resources/**",
      "coverage/**",
      "semgrep-fixtures/**",
      "fixtures/**",
    ],
  },
  ...base,
  {
    files: ["src/build.ts"],
    rules: {
      "no-console": "off",
      "compat/compat": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "compat/compat": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "security/detect-object-injection": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
    },
  },
]
