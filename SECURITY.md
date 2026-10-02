# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately, not through a public issue. Where
GitHub private vulnerability reporting is enabled, use the repository's
**Security** tab and choose **Report a vulnerability**; otherwise contact an
organization administrator directly.

Include the affected component (content script or companion app), the impact,
the macOS and Safari versions, and steps to reproduce. A maintainer
acknowledges the report and coordinates a fix and disclosure.

## Scope

This policy covers the code in this repository: the Safari web extension and
its companion app.

## Network behaviour

The extension and the app make no network requests, collect no telemetry and
load no remote script or font. The extension manifest restricts extension pages
to `'self'`, and `just semgrep-house-rules` fails on a network API in the Swift
sources. [PRIVACY.md](PRIVACY.md) lists the data the extension stores.

## Supported versions

Only the latest release receives security fixes.
