import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const at = (value: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>(
    (current, key) => (isRecord(current) ? current[key] : undefined),
    value
  )

const projectYml: unknown = Bun.YAML.parse(readFileSync("project.yml", "utf8"))
const packageJson: unknown = JSON.parse(readFileSync("package.json", "utf8"))
const manifest: unknown = JSON.parse(
  readFileSync("Resources/manifest.json", "utf8")
)
const notice = readFileSync("NOTICE", "utf8")

const version = at(projectYml, "settings", "base", "MARKETING_VERSION")

test("project.yml holds a semantic version", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/)
})

test("package.json and the manifest carry the project.yml version", () => {
  expect(at(packageJson, "version")).toBe(version)
  expect(at(manifest, "version")).toBe(version)
})

test.if(process.env["RELEASE_TAG"] !== undefined)(
  "the release tag names the project.yml version",
  () => {
    expect(process.env["RELEASE_TAG"]).toBe(`v${String(version)}`)
  }
)

test("every runtime dependency and Swift package has a NOTICE entry", () => {
  const names = [
    ...Object.keys(at(packageJson, "dependencies") ?? {}),
    ...Object.keys(at(projectYml, "packages") ?? {}),
  ]
  for (const name of names) expect(notice).toContain(name)
})

test("the manifest requests exactly the documented permissions", () => {
  expect(at(manifest, "permissions")).toEqual(["storage"])
  expect(at(manifest, "host_permissions")).toEqual([
    "https://x.com/*",
    "https://twitter.com/*",
  ])
  expect(at(manifest, "web_accessible_resources")).toBeUndefined()
})

const workflow = (name: string): unknown =>
  Bun.YAML.parse(readFileSync(`.github/workflows/${name}.yml`, "utf8"))

const workflowText = (name: string): string =>
  readFileSync(`.github/workflows/${name}.yml`, "utf8")

test("CI runs on pull_request, references no secret and never pull_request_target", () => {
  const triggers = at(workflow("ci"), "on")
  expect(isRecord(triggers) && "pull_request" in triggers).toBe(true)
  expect(workflowText("ci")).not.toContain("secrets.")
  expect(workflowText("ci")).not.toContain("pull_request_target")
  expect(workflowText("ci")).toContain("reusable-check.yml@")
  expect(readFileSync("justfile", "utf8")).toContain("CODE_SIGNING_ALLOWED=NO")
})

test("the release workflow is tag-triggered and signs only under the release environment", () => {
  expect(at(workflow("release"), "on", "push", "tags")).toEqual(["v*"])
  const job = at(workflow("release"), "jobs", "sign-notarize-publish")
  expect(at(job, "environment")).toBe("release")
  expect(at(job, "needs")).toEqual(["tag-version"])
  for (const other of ["ci", "security", "gitleaks", "reuse", "tag-version"])
    expect(
      at(workflow("release"), "jobs", other, "environment")
    ).toBeUndefined()
  expect(workflowText("release")).not.toContain("pull_request")
})

test("the release job fails with a named message before signing when a secret is missing", () => {
  const text = workflowText("release")
  const check = text.indexOf("Release secrets missing")
  expect(check).toBeGreaterThan(0)
  expect(check).toBeLessThan(text.indexOf("security create-keychain"))
  for (const name of [
    "DEVELOPER_ID_CERTIFICATE_P12",
    "DEVELOPER_ID_CERTIFICATE_PASSWORD",
    "DEVELOPMENT_TEAM",
    "NOTARY_API_KEY_P8",
    "NOTARY_API_KEY_ID",
  ])
    expect(text).toContain(`secrets.${name}`)
})

test("signing secrets appear only in the release workflow", () => {
  for (const name of [
    "ci",
    "dco",
    "gitleaks",
    "release-please",
    "reuse",
    "scorecard",
    "security",
    "zizmor",
  ])
    expect(workflowText(name)).not.toMatch(
      /secrets\.(?:DEVELOPER_ID|NOTARY|DEVELOPMENT_TEAM)/
    )
})

test("the release workflow notarizes, staples and validates the staple", () => {
  const text = workflowText("release")
  for (const command of [
    "notarytool submit",
    "stapler staple",
    "stapler validate",
    "--wait",
  ])
    expect(text).toContain(command)
  expect(text).not.toContain("--deep")
})

test("the manifest declares a popup and no other page", () => {
  expect(at(manifest, "action", "default_popup")).toBe("popup.html")
  expect(at(manifest, "background")).toBeUndefined()
})
