#!/bin/bash
# Start Chrome with remote debugging for Chrome DevTools MCP
# Usage: ./scripts/start-chrome-debug.sh

# Kill any existing Chrome debug instances
pkill -f "chrome.*remote-debugging-port=9222" 2>/dev/null

echo "🚀 Starting Chrome with remote debugging..."
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile \
  --no-sandbox \
  --disable-setuid-sandbox \
  --disable-dev-shm-usage \
  --headless=new \
  > /dev/null 2>&1 &

sleep 2

# Check if Chrome started successfully
if curl -s http://localhost:9222/json/version > /dev/null 2>&1; then
  echo "✅ Chrome started successfully on port 9222"
  echo "🔗 You can now use Chrome DevTools MCP in Claude Code"
else
  echo "❌ Failed to start Chrome"
  exit 1
fi
