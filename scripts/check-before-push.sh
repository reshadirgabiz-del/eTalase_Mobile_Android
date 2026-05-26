#!/usr/bin/env bash
# Run this before every push to main.
# Usage: ./scripts/check-before-push.sh
# Blocking checks: TypeScript build, unit tests.
# Non-blocking: ESLint (pre-existing issues exist — fix gradually).

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

ok()   { echo "  ✓ $1"; }
warn() { echo "  ! $1  [non-blocking]"; }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }
header() { echo ""; echo "── $1 ──────────────────────────────────────────"; }

# ── Backend ──────────────────────────────────────────────────────────────────
header "Backend"
cd "$ROOT/Backend"

echo "→ TypeScript build"
npm run build --silent > /dev/null 2>&1 \
  && ok "Nest build passed" \
  || fail "Nest build failed — run: cd Backend && npm run build"

echo "→ Unit tests"
npm test -- --passWithNoTests --silent > /dev/null 2>&1 \
  && ok "Jest passed" \
  || fail "Jest failed — run: cd Backend && npm test"

echo "→ Lint (non-blocking)"
npm run lint --silent > /dev/null 2>&1 \
  && ok "ESLint clean" \
  || warn "ESLint has issues — run: cd Backend && npm run lint"

# ── Frontend ─────────────────────────────────────────────────────────────────
header "Frontend"
cd "$ROOT/Frontend"

echo "→ TypeScript type-check"
npx tsc --noEmit --pretty false > /dev/null 2>&1 \
  && ok "TypeScript clean" \
  || fail "TypeScript errors — run: cd Frontend && npx tsc --noEmit"

echo "→ Lint (non-blocking)"
npm run lint --silent > /dev/null 2>&1 \
  && ok "ESLint clean" \
  || warn "ESLint has issues — run: cd Frontend && npm run lint"

# ── Summary ──────────────────────────────────────────────────────────────────
header "Summary"
if [ "$FAIL" -eq 0 ]; then
  echo "  All blocking checks passed. Safe to push."
  exit 0
else
  echo "  $FAIL blocking check(s) failed. Fix before pushing."
  exit 1
fi
