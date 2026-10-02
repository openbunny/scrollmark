#!/bin/sh
set -eu

if [ "${CODE_SIGNING_ALLOWED:-YES}" = "NO" ]; then
  exit 0
fi

if [ -z "${DEVELOPMENT_TEAM:-}" ]; then
  echo "error: DEVELOPMENT_TEAM is unset for the ${CONFIGURATION:-unknown} configuration. Copy DeveloperTeam.xcconfig.example to DeveloperTeam.xcconfig and set DEVELOPMENT_TEAM, or pass DEVELOPMENT_TEAM=<team id> to xcodebuild. Pass CODE_SIGNING_ALLOWED=NO for an unsigned build." >&2
  exit 1
fi
