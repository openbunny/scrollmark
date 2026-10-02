# Releasing

Release steps for the maintainer. Contributors do not run them.

## Version

`release-please.yml` opens a release pull request that bumps
`MARKETING_VERSION` in `project.yml`, `version` in `package.json` and
`Resources/manifest.json`, and writes `CHANGELOG.md`. Merging it creates the tag
and the GitHub release. `release.yml` then re-runs every gate against the tag
and runs `src/repo.test.ts` with `RELEASE_TAG` set, which fails when the tag
names another version.

`release-please.yml` uses `secrets.RELEASE_PLEASE_TOKEN` when set. Pull requests
and tags created with the default token do not trigger workflows, so set that
secret to a token with `contents` and `pull-requests` write access.

## Distribution

Two workflows build the app. `ci.yml` runs on every pull request and push, builds
unsigned and reads no secret. `release.yml` runs on a `v*` tag. After the gates
and the tag-version check pass, the `sign-notarize-publish` job runs under the
`release` environment. It signs with Developer ID Application, notarizes with
`xcrun notarytool submit --wait`, staples the ticket with `xcrun stapler
staple`, validates the staple and `spctl --assess`, and uploads
`Scrollmark-<tag>.zip` and its SHA-256 checksum to the GitHub release.

The job fails before any signing step, with the message `release secrets
missing` naming each absent secret, when the `release` environment lacks one of
these:

| Secret                              | Content                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `DEVELOPER_ID_CERTIFICATE_P12`      | Base64 of the Developer ID Application certificate `.p12` |
| `DEVELOPER_ID_CERTIFICATE_PASSWORD` | Password of that `.p12`                                   |
| `DEVELOPMENT_TEAM`                  | 10-character Apple Developer team ID                      |
| `NOTARY_API_KEY_P8`                 | Base64 of the App Store Connect API key `.p8`             |
| `NOTARY_API_KEY_ID`                 | Key ID of that API key                                    |

`NOTARY_API_ISSUER_ID` is optional. Set it for a Team API key and leave it unset
for an Individual API key.

The owner creates the `release` environment in the repository settings:
restrict deployment to the tag pattern `v*`, require one reviewer, and store the
secrets there, not as repository secrets. Environment protection applies to
public repositories on the Free plan and is ignored on a private one.

A notarized build loads in Safari 18.4 or later. The deployment target is macOS
15.0, so the release notes and any Homebrew cask caveat name Safari 18.4.

The Mac App Store is not wired. It needs an Apple Distribution identity, the
listing fields (category, description, screenshots, support URL, and the privacy
URL, which is the rendered `PRIVACY.md`), and an App Store Connect upload.

`just semgrep-house-rules` keeps signing identifiers out of `project.yml`. The
repository holds no certificate, key or team ID.

The app uses no App Group.
