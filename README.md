# scrollmark

This is a developer project. Build and run it locally; there is no distribution
or release process.

scrollmark is a Safari web extension that remembers the last post read on an X
profile timeline and shows a "jump to bookmark" button that scrolls back to it.
A SwiftUI companion app embeds the extension and reports whether Safari has it
enabled.

scrollmark is not affiliated with or endorsed by X Corp. The names X and
Twitter identify the sites the extension runs on and nothing else. The
extension uses no X logo or artwork.

## Contents

- [Requirements](#requirements)
- [Build and install](#build-and-install)
- [Enable the extension](#enable-the-extension)
- [Safari version](#safari-version)
- [Permissions](#permissions)
- [Privacy](#privacy)
- [Bundle identifiers](#bundle-identifiers)
- [Theme](#theme)
- [Development](#development)
- [Accessibility and language](#accessibility-and-language)
- [Third-party code](#third-party-code)
- [Licence](#licence)

## Requirements

- macOS at or above `LSMinimumSystemVersion` in `App/Info.plist`.
- The Xcode version in `.xcode-version`. `swift-format` output depends on the
  toolchain, so `just swift-toolchain` fails when the selected Xcode differs.
- [mise](https://mise.jdx.dev), which installs `just`, `bun`, `xcodegen`,
  `swiftlint`, `semgrep`, `jq` and the other tools pinned in `mise.toml`.
  `mise.toml` must be trusted once with `mise trust`. Node.js is pinned there
  because the TypeScript tooling executes under it.

## Build and install

Gates build without signing. Running the extension in Safari needs a signed
build:

1. Copy `DeveloperTeam.xcconfig.example` to `DeveloperTeam.xcconfig` and set
   `DEVELOPMENT_TEAM` to the 10-character team ID of a free Personal Team. Git
   ignores `DeveloperTeam.xcconfig`; no team ID or signing identity is
   committed.
2. Run `mise install` and `bun install --frozen-lockfile`.
3. Run `just install-app`. The recipe bundles the content script, generates the
   Xcode project, builds a signed Debug app and opens it.

`just` lists every recipe.

The Xcode Debug and Release configurations both use Apple Development signing.
A signed build with `DEVELOPMENT_TEAM` unset fails with
`DEVELOPMENT_TEAM is unset`. This repository has no distribution workflow.

## Enable the extension

1. In Safari, open Settings, then Extensions, and tick scrollmark.
2. Allow the extension on `x.com` and `twitter.com`.
3. Safari lists a development-signed build only while **Develop**, then
   **Allow Unsigned Extensions** is ticked. Show the Develop menu under
   Settings, then Advanced.

The companion app shows `extension enabled`, `extension disabled` or `safari did
not return extension status`, and a button that opens Safari settings.

## Safari version

A development-signed build needs **Allow Unsigned Extensions**, as described
above. The supported Safari floor has not been measured on device.

## Permissions

`Resources/manifest.json` requests the permissions below. `src/repo.test.ts`
pins the exact set and fails when the manifest exposes
`web_accessible_resources`.

| Permission              | Reason                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `storage`               | Keeps one bookmark per profile and tab in `storage.local`.   |
| `https://x.com/*`       | Reads visible posts and inserts the button on the page.      |
| `https://twitter.com/*` | Same as `x.com`, for links that still use the old host name. |

The companion app runs in the macOS App Sandbox with no entitlement beyond the
sandbox itself.

## Privacy

The extension makes no network request and sends nothing off the device.
[PRIVACY.md](PRIVACY.md) lists what it stores and how to remove it.

The extension keeps at most 200 bookmarks and deletes any older than 90 days at
the start of each page load on `x.com` or `twitter.com`. The toolbar button
opens a popup that shows the count and clears every saved bookmark. The pill
element the extension inserts on a profile page is visible to scripts on that
page, so a page can detect that the extension is active there. The extension
sets no attribute on the document element.

## Bundle identifiers

The app uses `io.github.openbunny.scrollmark` and the extension uses
`io.github.openbunny.scrollmark.extension`. The identifier is set once, as
`APP_BUNDLE_IDENTIFIER` in `project.yml`; both `Info.plist` files, the app and
the tests read it from the build settings.

Builds made before the move to these identifiers used a different prefix. The
change resets state for anyone who ran those builds: Safari treats the new
extension as a separate one, so enablement, the site grants for `x.com` and
`twitter.com`, and the stored bookmarks do not carry over. Enable the new
extension, grant the sites again and accept that earlier bookmarks are not
migrated. Both builds can be installed side by side; the old one can be removed
from Safari settings.

A fork changes `APP_BUNDLE_IDENTIFIER` and nothing else. The Apple Developer
team that signs the build must own the identifier.

## Theme

scrollmark keeps no color, font family, size or radius of its own. The
[OpenBunny theme](https://github.com/openbunny/theme) supplies all of them:

- The companion app links the `OpenBunnyTheme` and `OpenBunnyUI` Swift products
  and applies `.openbunnyTheme()`.
- The content script imports `color`, `font`, `space`, `text`, `radius` and
  `borderWidth` from `@openbunny/theme/tokens`. esbuild inlines the constants
  into `Resources/content/main.js`.
- `App/Resources/Assets.xcassets/AccentColor.colorset` is a copy of the theme's
  `xcode/AccentColor.colorset`, because an asset catalog cannot import a
  constant. `just theme-accent` fails when the copy differs.
- `artwork/app-icon.svg` uses only theme colors, and `just icons` renders the
  PNG set from it. `just icons-check` fails when a PNG differs from a fresh
  render; `src/theme.test.ts` fails when the SVG uses a color outside the theme.
- `just semgrep-theme` fails on a color, font-family, radius or size literal in
  `src`, `App`, `Extension`, `AppTests` and `Resources`. Add a token to the
  theme repository instead of a literal here.

Behaviour on the window:

- The theme is light only. The window stays on the light palette when macOS is
  in dark mode.
- Under Increase Contrast, the status line and notes switch to the `foreground`
  token, which has the highest contrast against `paper`.
- The theme fonts are declared with `Font.custom(relativeTo:)`. macOS has no
  Dynamic Type setting; the window has no fixed size, so a larger text size
  wraps instead of clipping.
- When `Fonts.register()` fails, the window shows `theme fonts failed to load;
system fonts are shown` and the reason as a tooltip.
  `AppTests/ThemeFontStatusTests` fails when the theme families are not
  available after registration.

The pill is inserted into x.com, which has light, dim and dark display themes.
It carries its own `foreground` and `paper` colors, so it is the same on all
three. `src/content/pill-theme.test.ts` fails when that pair falls below the
theme's 4.5:1 body contrast minimum. The pill font stack ends in the generic
`monospace` family, because x.com does not load Courier Prime. The extension
ships no font file and declares no `web_accessible_resources`.

`project.yml` and `package.json` pin the same theme Git commit for Swift and
TypeScript. After a theme release, replace both Git dependencies with pinned
package versions.

## Development

`just check` runs every offline gate and reports every failure together.
`just exhaustive` adds the sanitizer runs. [CONTRIBUTING.md](CONTRIBUTING.md)
lists the gates, the tooling and the contribution terms.

The version is `MARKETING_VERSION` in `project.yml`. `package.json` and
`Resources/manifest.json` carry the same value, and `src/repo.test.ts` fails
when they differ.

## Accessibility and language

The extension adds one `button` element labelled `jump to bookmark`. It takes
keyboard focus in page order, activates with Space or Return, and VoiceOver
reads its label. The label and its background are a theme color pair tested
against the 4.5:1 body contrast minimum, so the pill does not depend on the X
display theme.

The interface strings are in English only and are not localised. The companion
app has no String Catalog, so a translation needs one added first.

## Third-party code

The content script bundles constants from `@openbunny/theme`. The app bundles
the `OpenBunnyTheme` Swift package, which includes the Courier Prime and
JetBrains Mono fonts under the SIL Open Font License, Version 1.1. Development
tools are not distributed. [NOTICE](NOTICE) records this, and
`src/repo.test.ts` fails when a runtime dependency or Swift package appears
without a NOTICE entry.

The app icon is original work under the same licence as the code.

## Licence

[MIT](LICENSE), copyright OpenBunny. Report problems at
<https://github.com/openbunny/scrollmark/issues>.
