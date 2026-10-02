# Label taxonomy

Three prefixes: `type/*` classifies an issue, `area/*` locates it, `status/*`
tracks it through triage. Every issue and PR carries exactly one `type/*`
label; `area/*` and `status/*` are added during triage.

## Contents

- [type/\*](#type)
- [area/\*](#area)
- [status/\*](#status)

## type/*

| Label           | Meaning                                                 |
| --------------- | ------------------------------------------------------- |
| `type/bug`      | The extension or app behaves differently from its docs. |
| `type/feature`  | A new behaviour.                                        |
| `type/docs`     | README, CONTRIBUTING, or other documentation only.      |
| `type/chore`    | Build, dependency, or repository maintenance.           |
| `type/security` | A vulnerability report or hardening change.             |

## area/*

| Label            | Covers                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `area/content`   | The content script in `src/` (pill, bookmarks, timeline parsing) |
| `area/app`       | The SwiftUI companion app in `App/`                              |
| `area/extension` | `Extension/`, `Resources/manifest.json`, and Safari integration  |
| `area/signing`   | `Signing.*.xcconfig`, bundle identifiers, and provisioning       |
| `area/ci`        | GitHub Actions workflows and the `justfile` gates                |
| `area/docs`      | README, CONTRIBUTING, and other tracked docs                     |

## status/*

| Label                 | Meaning                                                         |
| --------------------- | --------------------------------------------------------------- |
| `status/needs-triage` | Default label on a new issue; a maintainer has not reviewed it. |
| `status/confirmed`    | A maintainer reproduced the bug or accepted the proposal.       |
| `status/blocked`      | Waiting on an external dependency or decision.                  |
| `status/wontfix`      | Closed without a change; the issue states why.                  |
