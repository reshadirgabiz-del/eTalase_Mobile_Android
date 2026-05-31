#!/usr/bin/env bash
set -e

PORT=3002

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$DEV_PID" 2>/dev/null
  lsof -ti tcp:"$PORT" | xargs kill -9 2>/dev/null || true
  echo "Port $PORT released."
}

trap cleanup EXIT INT TERM

echo "Starting Admin app on http://localhost:$PORT ..."
npm run dev:web &
DEV_PID=$!

# Wait until the port is open, then launch browser
for i in $(seq 1 30); do
  if lsof -ti tcp:"$PORT" &>/dev/null; then
    open "http://localhost:$PORT"
    break
  fi
  sleep 1
done

wait "$DEV_PID"
