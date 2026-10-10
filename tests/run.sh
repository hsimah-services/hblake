#!/usr/bin/env bash
# Runs the acceptance suite against a fresh stack. See tests/README.md.
#
#   tests/run.sh                 gates, then Playwright, then ops
#   tests/run.sh playwright      only Playwright (still starts a fresh stack)
#   PLAYWRIGHT_ARGS="--project=api --grep publish" tests/run.sh playwright
#
# Needs bash, python3 and podman or docker on the host; Node runs in a container.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARNESS="$ROOT/scripts/acceptance"
STAGES="${1:-all}"
PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble"

export BASE_URL="${BASE_URL:-http://localhost:8080}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-operator@example.test}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(18))')}"
export ADMIN_DISPLAY_NAME="${ADMIN_DISPLAY_NAME:-Site Operator}"

ENGINE="$(command -v podman || command -v docker || true)"
[ -n "$ENGINE" ] || { echo "podman or docker is required" >&2; exit 2; }

failures=()
stage() { echo; echo "==> $*"; }
run() { local name="$1"; shift; "$@" || failures+=("$name"); }
want() { [ "$STAGES" = all ] || [ "$STAGES" = "$1" ]; }

missing=()
for script in gates up down bootstrap install backup restore expire-sessions set-active; do
  [ -x "$HARNESS/$script" ] || missing+=("scripts/acceptance/$script")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing harness scripts (tests/README.md describes each):" >&2
  printf '  %s\n' "${missing[@]}" >&2
fi

if want gates; then
  stage "Build gates"
  if [ -x "$HARNESS/gates" ]; then run gates "$HARNESS/gates"; else failures+=(gates); fi
fi

if want playwright || want ops; then
  stage "Starting a fresh stack at $BASE_URL"
  if [ -x "$HARNESS/up" ] && "$HARNESS/up"; then
    trap '[ -x "$HARNESS/down" ] && "$HARNESS/down"' EXIT
  else
    failures+=(up)
  fi
fi

if want playwright; then
  stage "Playwright"
  run playwright "$ENGINE" run --rm --network host --ipc host \
    -v "$ROOT:/repo:z" -w /repo/tests/acceptance \
    -e BASE_URL -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_DISPLAY_NAME -e REPO_ROOT=/repo -e CI=1 \
    "$PLAYWRIGHT_IMAGE" \
    bash -c "npm ci --no-audit --no-fund --loglevel=error && npx playwright test ${PLAYWRIGHT_ARGS:-}"
fi

if want ops; then
  stage "Operator procedures"
  run ops python3 -I "$ROOT/tests/ops/test_ops.py"
fi

echo
if [ ${#failures[@]} -gt 0 ]; then
  echo "FAILED: ${failures[*]}"
  exit 1
fi
echo "All acceptance stages passed."
