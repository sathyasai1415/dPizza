#!/usr/bin/env bash
# Deploy the MiSlice frontend to the target that actually serves the live domain.
#
#   mislice.online / www.mislice.online  ->  App Engine `default` service (via app.yaml)
#
# Firebase Hosting (xx-1-2e007.web.app) is a separate host and is NOT the live domain.
# Run this from the frontend/ directory:  ./deploy.sh
set -euo pipefail

PROJECT="xx-1-2e007"
cd "$(dirname "$0")"

echo "▶ Building production bundle..."
npm run build

echo "▶ Deploying to App Engine (serves mislice.online)..."
gcloud app deploy app.yaml --quiet --project "$PROJECT"

echo "▶ Verifying live bundle on mislice.online..."
LIVE=$(curl -s https://mislice.online/ | grep -o 'main-[A-Z0-9]*\.js' | head -1)
BUILT=$(ls dist/frontend/browser/ | grep -o 'main-[A-Z0-9]*\.js' | head -1)
echo "   built: $BUILT"
echo "   live : $LIVE"
if [ "$LIVE" = "$BUILT" ]; then
  echo "✅ Live matches build. (Hard-refresh your browser if you still see the old page — index.html caches for 10 min.)"
else
  echo "⚠ Live bundle differs — may be the 10-minute index.html cache; re-check shortly."
fi
