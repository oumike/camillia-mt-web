#!/usr/bin/env bash
#
# update-container.sh — put the published site image on this host and run it.
#
# Run this ON THE SERVER that hosts the container, from the repo checkout.
#
# What changed, and it matters: the image is no longer built here. Releases are
# cut by .github/workflows/release.yml, which builds, smoke-tests and publishes
# ghcr.io/oumike/camillia-mt-web. This script pulls that image and recreates the
# container. The host needs Docker and this checkout — no Node, and the source
# tree is now only here for docker-compose.yml and this script.
#
# CONSEQUENCE WORTH KNOWING: nginx.conf is baked into the image. Editing it on
# this host and re-running this script has no effect. An nginx change now means
# a commit and a release. This is the most likely way to lose an hour after the
# migration to published images.
#
#   ./update-container.sh                 pull :latest and recreate
#   ./update-container.sh --tag 1.0.1     pull an exact version (rollback)
#   ./update-container.sh --git-pull      git pull first (for compose/script changes)
#   ./update-container.sh --build         build locally instead of pulling
#   ./update-container.sh --no-prune      skip the image prune step
#
set -euo pipefail

# Always operate from the repo root (the dir this script lives in).
cd "$(dirname "$0")" || exit 1

# Pick whichever Compose is installed: `docker compose` (v2) or `docker-compose`.
#
# An array, not a string: `docker compose` is two words, so a plain "$COMPOSE"
# would be one command name with a space in it and an unquoted $COMPOSE is an
# SC2086 that CI's shellcheck step would reject. "${COMPOSE[@]}" is both correct
# and quiet.
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "error: neither 'docker compose' nor 'docker-compose' is available" >&2
  exit 1
fi

DO_GIT_PULL=0
DO_PRUNE=1
DO_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --git-pull)
      DO_GIT_PULL=1
      ;;
    --pull)
      # Kept as an alias because it is in muscle memory, but it is ambiguous now
      # that there are two things to pull — git and the image.
      echo "warn: --pull is now --git-pull (the image is pulled by default)" >&2
      DO_GIT_PULL=1
      ;;
    --build)
      DO_BUILD=1
      ;;
    --tag)
      shift || { echo "error: --tag needs a version, e.g. --tag 1.0.1" >&2; exit 1; }
      # Accept both 1.0.1 and v1.0.1; the image tags carry no leading v.
      CAMILLIA_WEB_TAG="${1#v}"
      export CAMILLIA_WEB_TAG
      ;;
    --no-prune)
      DO_PRUNE=0
      ;;
    *)
      echo "error: unknown option '$1'" >&2
      echo "usage: ./update-container.sh [--tag X.Y.Z] [--git-pull] [--build] [--no-prune]" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$DO_GIT_PULL" -eq 1 ]]; then
  echo "==> Pulling latest source (compose file and this script)"
  git pull --ff-only
fi

if [[ "$DO_BUILD" -eq 1 ]]; then
  # Escape hatch: GHCR unreachable, or testing an unreleased branch in place.
  # Uses the dev overlay so the result is tagged camillia-mt-web:local and
  # cannot be mistaken for a published image.
  echo "==> Building locally (not pulling)"
  "${COMPOSE[@]}" -f docker-compose.yml -f docker-compose.dev.yml build
  echo "==> Recreating container from the local build"
  "${COMPOSE[@]}" -f docker-compose.yml -f docker-compose.dev.yml up -d
else
  echo "==> Pulling image (${CAMILLIA_WEB_TAG:-latest})"
  if ! "${COMPOSE[@]}" pull; then
    echo "error: pull failed. The daemon's own message is above; the two causes" >&2
    echo "that look like a broken image name are:" >&2
    echo "  * 401 / denied - the GHCR package is private. Make it public, or run" >&2
    echo "    'docker login ghcr.io' here with a token that has read:packages." >&2
    echo "  * no matching manifest for $(uname -m) - the release did not publish" >&2
    echo "    this architecture. Check 'platforms:' in .github/workflows/release.yml." >&2
    exit 1
  fi
  echo "==> Recreating container"
  "${COMPOSE[@]}" up -d
fi

if [[ "$DO_PRUNE" -eq 1 ]]; then
  echo "==> Pruning dangling images (best effort; 20s timeout)"
  # Dangling only, on purpose: previously published versions stay on disk
  # because they are the rollback targets for --tag. If disk pressure ever
  # matters, the knob is `docker image prune -a --filter until=2160h`, not this.
  if ! timeout 20s docker image prune -f >/dev/null 2>&1; then
    echo "warn: skipping prune (already running, timed out, or daemon busy)" >&2
  fi
else
  echo "==> Skipping image prune (--no-prune)"
fi

echo "==> Status"
"${COMPOSE[@]}" ps

echo "==> Running image"
docker inspect camillia-mt-web \
  --format 'version={{index .Config.Labels "org.opencontainers.image.version"}} revision={{index .Config.Labels "org.opencontainers.image.revision"}}' \
  2>/dev/null || echo "(no OCI labels - locally built image)"

echo "Done. Site is live (container port 80 -> host 8080)."
