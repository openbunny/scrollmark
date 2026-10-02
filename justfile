set shell := ["bash", "-uc"]

theme := "../openbunny-theme"

export PATH := `mise bin-paths | tr '\n' ':'` + env('PATH')

ts_gates := "ts-target format typecheck lint test knip cspell editorconfig html-validate licenses forbidden-names tracked-outputs"
swift_gates := "swift-target swift-toolchain swift-format swiftlint swift-build swift-test"
semgrep_gates := "semgrep-fixtures-selftest semgrep-house-rules semgrep-comments semgrep-voice semgrep-theme"
theme_gates := "theme-accent icons-check"
repo_gates := "secrets actions-lint actions-pin actions-audit"

_default:
    @just --list

# Offline, deterministic, and everything in it can fail.
check: (_all ts_gates + " " + swift_gates + " " + semgrep_gates + " " + theme_gates + " " + repo_gates)

# check + swift-sanitizers.
exhaustive: (_all ts_gates + " " + swift_gates + " " + semgrep_gates + " " + theme_gates + " " + repo_gates + " swift-sanitizers")

# No runner here continues past a failing gate and reports every failure together.
_all gates:
    #!/usr/bin/env bash
    set -uo pipefail
    failed=""
    for gate in {{ gates }}; do
        printf '\n\033[1m━━━ just %s\033[0m\n' "$gate"
        just "$gate" || failed="$failed $gate"
    done
    if [ -n "$failed" ]; then
        printf '\n\033[1;31mFAILED:\033[0m%s\n' "$failed" >&2
        exit 1
    fi
    printf '\n\033[1;32mall gates passed:\033[0m %s\n' "{{ gates }}"

install:
    bun install --frozen-lockfile

ts-target:
    test -n "$(find src -name '*.ts')"

format:
    bun run format

typecheck:
    bun run typecheck

lint:
    bun run lint

test:
    bun run test

knip:
    bun run knip

cspell:
    bun run cspell

editorconfig:
    editorconfig-checker

html-validate:
    test -n "$(find Resources -name '*.html')"
    bun run lint:html

# Fails on any package in the resolved tree outside the licence allowlist in package.json, and on an empty tree.
licenses:
    #!/usr/bin/env bash
    set -euo pipefail
    bun run --silent licenses > /dev/null
    n=$(bun run --silent licenses --json | jq length)
    [ "$n" -gt 0 ] || { echo "licenses: no packages found" >&2; exit 1; }

# The pattern brackets one character per name so this file does not match itself.
forbidden-names:
    #!/usr/bin/env bash
    set -euo pipefail
    files=$(git ls-files --cached --others --exclude-standard | grep -v -e "^bun.lock$" -e "^mise.lock$")
    [ -n "$files" ] || { echo "forbidden-names: no files to scan" >&2; exit 1; }
    if echo "$files" | xargs grep -niE "thalass[a]|fion[a]|ttrus[t]|e2capita[l]|signe[t]"; then
        echo "forbidden-names: a name from another project is present" >&2
        exit 1
    fi

# Build output belongs in .gitignore; a path here means it would be committed.
tracked-outputs:
    #!/usr/bin/env bash
    set -euo pipefail
    files=$(git ls-files --cached --others --exclude-standard)
    [ -n "$files" ] || { echo "tracked-outputs: no files to scan" >&2; exit 1; }
    if echo "$files" | grep -E '^build/|\.xcodeproj/|^Resources/content/|\.DS_Store$'; then
        echo "tracked-outputs: build output is not ignored" >&2
        exit 1
    fi

# Bundles the content script; xcodegen rejects the Resources/content folder reference while it is absent.
extension-resources:
    bun run build

swift-target:
    test -n "$(find App AppTests Extension -name '*.swift')"

# swift-format output depends on the toolchain, so the Xcode major.minor in .xcode-version is part of the gate.
swift-toolchain:
    #!/usr/bin/env bash
    set -euo pipefail
    want=$(tr -d '[:space:]' < .xcode-version)
    got=$(xcodebuild -version | awk 'NR==1 {print $2}' | cut -d. -f1,2)
    if [ "$got" != "$want" ]; then
        printf 'swift-toolchain: Xcode %s is selected, .xcode-version requires %s. Run xcode-select or update .xcode-version.\n' "$got" "$want" >&2
        exit 1
    fi

# Formats with the toolchain's own swift-format; never hand-tuned.
swift-format:
    test -n "$(find App AppTests Extension -name '*.swift')"
    swift format lint --strict $(find App AppTests Extension -name '*.swift')

# No tool regenerates a renamed Xcode scheme and feeds its build log to swiftlint analyze.
swiftlint: extension-resources
    #!/usr/bin/env bash
    set -euo pipefail
    xcodegen generate
    swiftlint lint --strict
    proj=$(ls -d *.xcodeproj | head -1)
    scheme=${proj%.xcodeproj}
    log=$(mktemp)
    xcodebuild clean build -project "$proj" -scheme "$scheme" -derivedDataPath build/DerivedData CODE_SIGNING_ALLOWED=NO > "$log" 2>&1
    swiftlint analyze --strict --compiler-log-path "$log"

# No tool regenerates a renamed Xcode scheme and builds it with strict concurrency checking.
swift-build: extension-resources
    #!/usr/bin/env bash
    set -euo pipefail
    xcodegen generate
    proj=$(ls -d *.xcodeproj | head -1)
    scheme=${proj%.xcodeproj}
    xcodebuild build -project "$proj" -scheme "$scheme" -derivedDataPath build/DerivedData \
        CODE_SIGNING_ALLOWED=NO GCC_TREAT_WARNINGS_AS_ERRORS=YES \
        SWIFT_TREAT_WARNINGS_AS_ERRORS=YES SWIFT_STRICT_CONCURRENCY=complete

# No test runner discovers a renamed Xcode scheme and fails when it finds zero tests.
swift-test: extension-resources
    #!/usr/bin/env bash
    set -euo pipefail
    xcodegen generate
    proj=$(ls -d *.xcodeproj | head -1)
    scheme=${proj%.xcodeproj}
    bundle="$(mktemp -d)/Result.xcresult"
    xcodebuild test -project "$proj" -scheme "$scheme" -derivedDataPath build/DerivedData \
        -enableCodeCoverage YES -resultBundlePath "$bundle" CODE_SIGNING_ALLOWED=NO
    n=$(xcrun xcresulttool get test-results summary --path "$bundle" --format json | jq '.totalTestCount')
    if [ "$n" -eq 0 ]; then
        printf 'xcodebuild test discovered zero tests.\n' >&2
        exit 1
    fi

# No tool builds a renamed Xcode scheme under both Address and Thread Sanitizer.
swift-sanitizers: extension-resources
    #!/usr/bin/env bash
    set -euo pipefail
    xcodegen generate
    proj=$(ls -d *.xcodeproj | head -1)
    scheme=${proj%.xcodeproj}
    xcodebuild test -project "$proj" -scheme "$scheme" -derivedDataPath build/DerivedData \
        -enableAddressSanitizer YES CODE_SIGNING_ALLOWED=NO
    xcodebuild test -project "$proj" -scheme "$scheme" -derivedDataPath build/DerivedData \
        -enableThreadSanitizer YES CODE_SIGNING_ALLOWED=NO

# Each pair proves the rule fires on its violation fixture and stays quiet on its green one, after proving the scanned set is non-empty.
semgrep-fixtures-selftest:
    #!/usr/bin/env bash
    set -uo pipefail
    test -n "$(find App Extension AppTests -name '*.swift')"
    test -f project.yml
    fail=""
    check() {
        local config=$1 rule=$2 path=$3 want=$4 got
        got=$(semgrep scan --config "$config" --quiet --metrics=off --json "$path" |
            jq --arg r "$rule" '[.results[] | select($r == "ANY" or (.check_id | endswith($r)))] | length') || got=""
        if [ "$got" != "$want" ]; then
            printf 'semgrep-fixtures-selftest: %s on %s: want %s findings, got %s\n' \
                "$rule" "$path" "$want" "$got" >&2
            fail=1
        fi
    }
    for rule in network-api absence-to-sentinel money-field-uses-binary-float \
        secret-in-userdefaults dynamic-code-construction; do
        check .semgrep.yml "swift-$rule" "semgrep-fixtures/swift-rules/red/$rule.swift" 1
        check .semgrep.yml "swift-$rule" "semgrep-fixtures/swift-rules/green/$rule.swift" 0
    done
    check .semgrep.yml swift-committed-signing-identifier fixtures/signing-check-red/project.yml 1
    check .semgrep.yml swift-committed-signing-identifier fixtures/signing-check-green/project.yml 0
    while read -r rule path want; do
        check .semgrep-comments.yml "$rule" "$path" "$want"
    done <<'EOF'
    ts-comment-not-kept semgrep-fixtures/comments/red/line-comment.ts 4
    ts-block-comment-not-kept semgrep-fixtures/comments/red/block-comment.ts 1
    swift-comment-not-kept semgrep-fixtures/comments/red/line-comment.swift 4
    swift-doc-comment-not-kept semgrep-fixtures/comments/red/doc-comment.swift 1
    swift-block-comment-not-kept semgrep-fixtures/comments/red/block-comment.swift 1
    mjs-comment-not-kept semgrep-fixtures/comments/red/line-comment.mjs 1
    yaml-comment-not-kept semgrep-fixtures/comments/red/line-comment.yml 1
    EOF
    while read -r rule path want; do
        check .semgrep-voice.yml "$rule" "$path" "$want"
    done <<'EOF'
    ts-string-figurative semgrep-fixtures/voice/red/string-banned.ts 1
    ts-string-purpose-verb semgrep-fixtures/voice/red/string-banned.ts 1
    ts-string-hedge semgrep-fixtures/voice/red/string-banned.ts 1
    ts-string-first-person semgrep-fixtures/voice/red/string-banned.ts 1
    ts-string-temporal-filler semgrep-fixtures/voice/red/string-banned.ts 1
    ts-concat-figurative semgrep-fixtures/voice/red/string-banned.ts 1
    ts-comment-figurative semgrep-fixtures/voice/red/comment-banned.ts 1
    ts-comment-purpose-verb semgrep-fixtures/voice/red/comment-banned.ts 1
    ts-comment-hedge semgrep-fixtures/voice/red/comment-banned.ts 1
    ts-comment-temporal-filler semgrep-fixtures/voice/red/comment-banned.ts 1
    swift-string-figurative semgrep-fixtures/voice/red/string-banned.swift 2
    swift-string-purpose-verb semgrep-fixtures/voice/red/string-banned.swift 1
    swift-string-hedge semgrep-fixtures/voice/red/string-banned.swift 1
    swift-string-first-person semgrep-fixtures/voice/red/string-banned.swift 1
    swift-string-temporal-filler semgrep-fixtures/voice/red/string-banned.swift 1
    swift-string-concat-literal semgrep-fixtures/voice/red/string-banned.swift 1
    swift-comment-figurative semgrep-fixtures/voice/red/comment-banned.swift 1
    swift-comment-purpose-verb semgrep-fixtures/voice/red/comment-banned.swift 1
    swift-comment-hedge semgrep-fixtures/voice/red/comment-banned.swift 1
    swift-comment-temporal-filler semgrep-fixtures/voice/red/comment-banned.swift 1
    md-figurative semgrep-fixtures/voice/red/prose-banned.md 1
    md-purpose-verb semgrep-fixtures/voice/red/prose-banned.md 1
    md-hedge semgrep-fixtures/voice/red/prose-banned.md 1
    md-hedge-just semgrep-fixtures/voice/red/prose-banned.md 1
    md-first-person semgrep-fixtures/voice/red/prose-banned.md 1
    md-temporal-filler semgrep-fixtures/voice/red/prose-banned.md 1
    yaml-comment-authored-voice semgrep-fixtures/voice/red/comment-banned.yml 4
    EOF
    for kind in color font radius size; do
        for ext in ts swift; do
            check .semgrep-theme.yml "theme-$kind-literal" "semgrep-fixtures/theme/red/$kind.$ext" 1
        done
    done
    for path in semgrep-fixtures/comments/green/* semgrep-fixtures/voice/green/*; do
        check .semgrep-comments.yml ANY "$path" 0
        check .semgrep-voice.yml ANY "$path" 0
    done
    for path in semgrep-fixtures/theme/green/*; do
        check .semgrep-theme.yml ANY "$path" 0
    done
    [ -z "$fail" ]

# House rules over the Swift sources and the signing-identifier rule over project.yml.
semgrep-house-rules:
    semgrep scan --config .semgrep.yml --error --quiet --metrics=off App AppTests Extension project.yml

semgrep-comments:
    #!/usr/bin/env bash
    set -euo pipefail
    test -n "$(find src -name '*.ts')" || { echo "semgrep-comments: no .ts files" >&2; exit 1; }
    test -n "$(find App AppTests Extension -name '*.swift')" || { echo "semgrep-comments: no .swift files" >&2; exit 1; }
    test -n "$(find App -name '*.h' -o -name '*.m')" || { echo "semgrep-comments: no .h/.m files" >&2; exit 1; }
    semgrep scan --config .semgrep-comments.yml --error --quiet --metrics=off . .swiftlint.yml

semgrep-voice:
    #!/usr/bin/env bash
    set -euo pipefail
    test -n "$(find src -name '*.ts')" || { echo "semgrep-voice: no .ts files" >&2; exit 1; }
    test -n "$(find App AppTests Extension -name '*.swift')" || { echo "semgrep-voice: no .swift files" >&2; exit 1; }
    test -f AGENTS.md || { echo "semgrep-voice: AGENTS.md missing" >&2; exit 1; }
    semgrep scan --config .semgrep-voice.yml --error --quiet --metrics=off .

# No colour, font-family, radius or size literal outside the theme dependency.
semgrep-theme:
    #!/usr/bin/env bash
    set -euo pipefail
    test -n "$(find src -name '*.ts')" || { echo "semgrep-theme: no .ts files" >&2; exit 1; }
    test -n "$(find App Extension -name '*.swift')" || { echo "semgrep-theme: no .swift files" >&2; exit 1; }
    semgrep scan --config .semgrep-theme.yml --error --quiet --metrics=off src App Extension AppTests Resources

# The asset catalog cannot import Swift or TypeScript constants, so the accent colour is a copy of the theme file.
theme-accent:
    #!/usr/bin/env bash
    set -euo pipefail
    test -f "{{ theme }}/xcode/AccentColor.colorset/Contents.json" || { echo "theme-accent: {{ theme }}/xcode/AccentColor.colorset is missing; check out the theme repository beside this one." >&2; exit 1; }
    diff -r "{{ theme }}/xcode/AccentColor.colorset" App/Resources/Assets.xcassets/AccentColor.colorset

# Renders artwork/app-icon.svg into the icon set.
icons:
    #!/usr/bin/env bash
    set -euo pipefail
    dir=App/Resources/Assets.xcassets/AppIcon.appiconset
    for size in 16 32 64 128 256 512 1024; do
        rsvg-convert -w "$size" -h "$size" artwork/app-icon.svg | magick png:- -alpha off -depth 8 "PNG24:$dir/icon-$size.png"
    done

# Fails when a committed icon differs from a fresh render of the SVG, or when no icon exists.
icons-check:
    #!/usr/bin/env bash
    set -euo pipefail
    dir=App/Resources/Assets.xcassets/AppIcon.appiconset
    tmp=$(mktemp -d)
    n=0
    for size in 16 32 64 128 256 512 1024; do
        rsvg-convert -w "$size" -h "$size" artwork/app-icon.svg | magick png:- -alpha off -depth 8 "PNG24:$tmp/icon-$size.png"
        diff=$(magick compare -metric AE -fuzz 1% "$dir/icon-$size.png" "$tmp/icon-$size.png" null: 2>&1 || true)
        [ "${diff%% *}" = "0" ] || { echo "icons-check: $dir/icon-$size.png differs from artwork/app-icon.svg in $diff pixels; run just icons." >&2; exit 1; }
        n=$((n + 1))
    done
    [ "$n" -gt 0 ]

# Signs and opens the companion app; needs a Personal Team in DeveloperTeam.xcconfig.
install-app: extension-resources
    #!/usr/bin/env bash
    set -euo pipefail
    [ -f DeveloperTeam.xcconfig ] || {
        echo "install-app: DeveloperTeam.xcconfig is missing; copy DeveloperTeam.xcconfig.example and set DEVELOPMENT_TEAM." >&2
        exit 1
    }
    xcodegen generate
    xcodebuild -project Scrollmark.xcodeproj -scheme Scrollmark -configuration Debug \
        -allowProvisioningUpdates -derivedDataPath build/DerivedData build
    open "build/DerivedData/Build/Products/Debug/Scrollmark.app"

secrets:
    gitleaks dir . --redact --config .gitleaks.toml

actions-lint:
    test -n "$(find .github/workflows -name '*.yml')"
    actionlint

actions-pin:
    #!/usr/bin/env bash
    set -euo pipefail
    files=$(find .github/workflows -name '*.yml')
    test -n "$files" || { echo "actions-pin: no workflow files" >&2; exit 1; }
    pinact run --check $files

actions-audit:
    test -n "$(find .github/workflows -name '*.yml')"
    zizmor --offline --persona=pedantic .github/workflows
