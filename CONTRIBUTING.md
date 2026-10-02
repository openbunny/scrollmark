# Contributing

How to build, test, and submit a change to `scrollmark`.

## Contents

- [Development](#development)
- [Signing](#signing)
- [Gates](#gates)
- [Writing rules](#writing-rules)
- [Commits and pull requests](#commits-and-pull-requests)
- [Developer Certificate of Origin](#developer-certificate-of-origin)
- [Licence of contributions](#licence-of-contributions)
- [Manual verification](#manual-verification)
- [Reporting bugs](#reporting-bugs)

## Development

- Install [mise](https://mise.jdx.dev), run `mise trust` and `mise install`,
  then run `bun install --frozen-lockfile`. `mise.toml` pins every tool. A
  `just` recipe fails with the mise error when mise is missing.
- Select the Xcode version in `.xcode-version`. `swift-format` output depends
  on the toolchain, so the version is part of the gate and `just swift-toolchain`
  fails on a mismatch.
- Install git hooks once per clone with `lefthook install`. `lefthook.yml` runs
  the formatting, editorconfig, Swift format and secret gates on commit, and
  the TypeScript gates on push.
- Build and test from the checkout. `AppTests/ProjectFile.swift` resolves files
  from the absolute path of the test source, so a build cache made from another
  checkout reads that checkout's files. Delete `build/DerivedData` after moving
  a checkout.

## Signing

Every gate builds with `CODE_SIGNING_ALLOWED=NO`. Running the extension in
Safari needs a signed build:

1. Copy `DeveloperTeam.xcconfig.example` to `DeveloperTeam.xcconfig`.
2. Set `DEVELOPMENT_TEAM` to the team ID of a free Personal Team.
3. Run `just install-app`.

`DeveloperTeam.xcconfig` is ignored by git. `Signing.xcconfig` includes it, and
`just semgrep-house-rules` fails if `project.yml` names a team, identity or
provisioning profile. Do not commit a team ID.

Safari keys the extension by bundle identifier in state shared across the whole
machine. Build, launch and register the extension from one checkout at a time.

## Gates

`just check` runs every offline gate and reports every failure together.
`just exhaustive` adds the Address and Thread Sanitizer runs. Both are required
before a pull request. `just` lists the recipes.

| Group    | Recipes                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Web      | `format`, `typecheck`, `lint`, `test`, `knip`, `cspell`, `editorconfig`, `html-validate`                 |
| Tree     | `licenses`, `forbidden-names`, `tracked-outputs`                                                         |
| Swift    | `swift-toolchain`, `swift-format`, `swiftlint`, `swift-build`, `swift-test`                              |
| Semgrep  | `semgrep-fixtures-selftest`, `semgrep-house-rules`, `semgrep-comments`, `semgrep-voice`, `semgrep-theme` |
| Theme    | `theme-accent`, `icons-check`                                                                            |
| Workflow | `actions-lint`, `actions-pin`, `actions-audit`, `secrets`                                                |

`licenses` fails on a package outside the allowlist in `package.json`. It
excludes one pinned package, `@cspell/dict-en-common-misspellings`, whose
`license` field is the non-SPDX string `CC BY-SA 4.0`; it is a spelling
dictionary used by `cspell` and is not distributed. `forbidden-names` fails on a
name that belongs to another project, and `tracked-outputs` fails when build
output is not ignored.

Rules for every gate:

- A gate that scans an empty set fails.
- Do not weaken a gate to pass it. Decide whether the code or the gate is wrong
  and say which in the pull request.
- Every suppression is scoped to one rule or one line and carries its reason.

The semgrep house rules in `.semgrep.yml` apply to all Swift in the repository.
Some, such as the money and `UserDefaults` rules, cover hazards that do not
occur in the app. They stay so a later change cannot introduce the hazard
unnoticed. `semgrep-fixtures/` holds one failing and one passing example per
rule, and `just semgrep-fixtures-selftest` proves each rule fires on its
failing example only.

Pull requests are also gated by the workflows in `.github/workflows`: `ci.yml`
runs `just check`, `dco.yml` checks `Signed-off-by` trailers, `gitleaks.yml` scans history,
`reuse.yml` checks licensing metadata, `security.yml` scans dependency vulnerabilities, and `zizmor.yml` audits the workflows.

`AppTests/LiveSafariExtensionQueryingTests` calls the real Safari SDK. It
asserts on whatever result Safari returns, so it passes whether or not the
extension is registered, but it needs a macOS session with Safari installed.

## Writing rules

Everything a human reads is written for a literal reader. The rules are in
[AGENTS.md](AGENTS.md); `.semgrep-voice.yml` and `.semgrep-comments.yml`
enforce the word lists. The reasons:

- Figurative language and filler stall a reader who parses what is written, not
  what is meant.
- A comment that restates code expires when the code changes. A comment states
  an invariant, a reason or a hazard, is at most 3 lines, and otherwise does
  not exist.
- A document that records a version, count or date goes stale while still
  reading as current. Name the command that prints the live value instead.

## Commits and pull requests

- One logical change per commit. Use Conventional Commits headers: `feat:`,
  `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- The pull request states what changed and why, and links related issues.
- A change to behaviour changes the document that describes it in the same
  commit.
- Every change ships tests for the behaviour it adds or fixes.

## Developer Certificate of Origin

Every commit must carry a `Signed-off-by` trailer, certifying that you wrote it
or otherwise have the right to submit it under the
[Developer Certificate of Origin](https://developercertificate.org/). Add it
with `git commit --signoff` (or `-s`). The project requires no Contributor
License Agreement.

## Licence of contributions

Contributions are licensed under the MIT licence in [LICENSE](LICENSE), the same
terms as the rest of the repository. `REUSE.toml` assigns the copyright notice
and licence to every file, so a new file needs no per-file header.

## Manual verification

The pill renders inside Safari on the live site, so no headless run reaches
what a reviewer needs to see. A change to `src/content/pill.ts` is checked in
Safari on `x.com`: run `just install-app`, load a profile timeline, scroll,
reload and press the `jump to bookmark` button. Other browser checks run
headless.

## Reporting bugs

Open an issue with the macOS and Safari versions, the page address and the
steps that reproduce the problem. For a security report, follow
[SECURITY.md](SECURITY.md) instead.
