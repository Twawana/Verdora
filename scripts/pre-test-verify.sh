#!/usr/bin/env bash
# Pre-test automated checks — run from repo root: npm run verify
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Checking tracked .env files (should be empty)"
TRACKED_ENV="$(git ls-files | grep -iE '(^|/)\.env$|\.env\.local' | grep -vi '\.env\.example' || true)"
if [ -n "$TRACKED_ENV" ]; then
  echo "FAIL: .env files are tracked in git:"
  echo "$TRACKED_ENV"
  exit 1
fi
echo "OK: no .env files in git index"

echo ""
echo "==> TypeScript (frontend)"
npm run typecheck

echo ""
echo "==> Pre-test verify passed"
