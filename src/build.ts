import { mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { build } from "esbuild"

console.info(
  "build: no maintained tool bundles this Safari extension's entry points in one step, so this script wires esbuild directly."
)

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outdir = join(root, "Resources/content")

mkdirSync(outdir, { recursive: true })

await build({
  entryPoints: {
    main: join(root, "src/content/main.ts"),
    popup: join(root, "src/popup/popup.ts"),
  },
  outdir,
  bundle: true,
  format: "esm",
  target: "safari15",
  logLevel: "error",
})

for (const name of ["main.js", "popup.js"])
  if (/^(?:import|export)\s/m.test(readFileSync(join(outdir, name), "utf8")))
    throw new Error(`build: ${name} must be a classic script`)
