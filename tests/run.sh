#!/usr/bin/env bash
# Runs the acceptance suite against a fresh stack. See tests/README.md.
#
#   tests/run.sh                 gates, then the browser and HTTP tests, then ops
#   tests/run.sh playwright      only the browser and HTTP tests (still starts a fresh stack)
#   TEST_ARGS="-class Hsimah.Acceptance.Http.AuthTests" tests/run.sh playwright
#
# Needs bash, python3 and podman or docker on the host; .NET, Node and the browsers run in containers.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARNESS="$ROOT/scripts/acceptance"
STAGES="${1:-all}"

export BASE_URL="${BASE_URL:-http://localhost:8080}"
export ADMIN_USERNAME="${ADMIN_USERNAME:-acceptance-operator}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(18))')}"
export ADMIN_DISPLAY_NAME="${ADMIN_DISPLAY_NAME:-Site Operator}"

ENGINE="${CONTAINER_ENGINE:-$(command -v podman || command -v docker || true)}"
[ -n "$ENGINE" ] || { echo "podman or docker is required" >&2; exit 2; }

failures=()
stage() { echo; echo "==> $*"; }
run() { local name="$1"; shift; "$@" || failures+=("$name"); }
want() { [ "$STAGES" = all ] || [ "$STAGES" = "$1" ]; }

# The Cosmos DB Linux emulator occasionally crashes mid-run, which turns every later test into a misleading failure. If a stage fails and the
# emulator is no longer running, say so, start a fresh stack and run the stage once more; a failure with the emulator still up is real.
emulator_running() { [ "$("$ENGINE" container inspect hblake-acceptance-cosmos --format '{{.State.Running}}' 2>/dev/null)" = true ]; }
run_with_retry() {
  local name="$1"; shift
  if "$@"; then return 0; fi
  if emulator_running; then failures+=("$name"); return 0; fi
  echo; echo "==> The Cosmos DB emulator stopped during $name; its failures are not test results. Starting a fresh stack and running it once more."
  "$ENGINE" logs --tail 40 hblake-acceptance-cosmos >&2 2>/dev/null || true
  if "$HARNESS/up" && "$@"; then return 0; fi
  failures+=("$name")
}

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
  stage "Browser and HTTP tests"
  # Stages run in order against the one stack: static reads the repository, fresh asserts the empty site (so it must see the
  # database before anything is created), http is the contract, ui drives the browser. The tests share the database, so they run
  # one at a time, in the order they are written.
  if [ -n "${TEST_ARGS:-}" ]; then
    selection="dotnet run --no-build --project tests/Hsimah.Acceptance -- -noColor $TEST_ARGS"
  else
    selection="for stage in Static Fresh Http Ui; do dotnet run --no-build --project tests/Hsimah.Acceptance -- -noColor -namespace Hsimah.Acceptance.\$stage || status=1; done; exit \${status:-0}"
  fi
  run_with_retry playwright "$ROOT/scripts/tests-dotnet" bash -c "dotnet build tests/Hsimah.Acceptance --nologo -v quiet && $selection"
fi

if want ops; then
  stage "Operator procedures"
  # Built self-contained in a container, so the host runs them without a .NET install and they can run the harness scripts.
  if "$ROOT/scripts/dotnet" dotnet publish tests/Hsimah.Acceptance.Ops -c Release -r linux-x64 --self-contained -o .cache/ops --nologo -v quiet; then
    run_with_retry ops env REPO_ROOT="$ROOT" "$ROOT/.cache/ops/Hsimah.Acceptance.Ops" -noColor
  else
    failures+=(ops-build)
  fi
fi

echo
if [ ${#failures[@]} -gt 0 ]; then
  echo "FAILED: ${failures[*]}"
  exit 1
fi
echo "All acceptance stages passed."
