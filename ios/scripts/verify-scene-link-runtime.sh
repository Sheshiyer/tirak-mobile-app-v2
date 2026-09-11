#!/bin/sh

set -eu

simulator_id=${TIRAK_SIMULATOR_ID:-booted}
app_path=${TIRAK_APP_PATH:-}
bundle_id=${TIRAK_BUNDLE_ID:-com.tirak.pineapple}
cold_url=${TIRAK_COLD_LINK_URL:-tirak://messages?scene-link-receipt=cold}
warm_url=${TIRAK_WARM_LINK_URL:-tirak://messages?scene-link-receipt=warm}
universal_url=${TIRAK_UNIVERSAL_LINK_URL:-}
entitlements_file=${TIRAK_ENTITLEMENTS_FILE:-ios/Tirak/Tirak.entitlements}

if [ -z "$app_path" ] || [ ! -d "$app_path" ]; then
  echo "Set TIRAK_APP_PATH to a built Tirak.app directory." >&2
  exit 2
fi

if [ ! -f "$app_path/main.jsbundle" ]; then
  echo "Runtime receipt verification requires Tirak.app/main.jsbundle; a native-only Debug build cannot prove JavaScript consumption." >&2
  exit 2
fi

receipts_since() {
  start_time=$1
  xcrun simctl spawn "$simulator_id" log show \
    --start "$start_time" \
    --style compact \
    --predicate 'process == "Tirak" AND eventMessage CONTAINS "[TirakSceneLink"' \
    2>/dev/null || true
}

wait_for_receipt() {
  start_time=$1
  expected=$2
  attempts=0

  while [ "$attempts" -lt 30 ]; do
    if receipts_since "$start_time" | grep -Fq "$expected"; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done

  echo "Missing runtime receipt: $expected" >&2
  echo "If iOS is showing an 'Open in Tirak?' confirmation, accept it and rerun this verifier." >&2
  receipts_since "$start_time" >&2
  return 1
}

xcrun simctl install "$simulator_id" "$app_path"
xcrun simctl terminate "$simulator_id" "$bundle_id" >/dev/null 2>&1 || true

custom_start=$(date '+%Y-%m-%d %H:%M:%S')
xcrun simctl openurl "$simulator_id" "$cold_url"
wait_for_receipt "$custom_start" '[TirakSceneLink] preserved cold custom-scheme'
wait_for_receipt "$custom_start" '[TirakSceneLinkJS] consumed cold custom-scheme'

xcrun simctl openurl "$simulator_id" "$warm_url"
wait_for_receipt "$custom_start" '[TirakSceneLink] delivered warm custom-scheme'
wait_for_receipt "$custom_start" '[TirakSceneLinkJS] consumed warm custom-scheme'

echo "Custom-scheme cold and warm native/JavaScript receipts verified."
receipts_since "$custom_start" | grep -F '[TirakSceneLink'

if [ -z "$universal_url" ] || [ ! -f "$entitlements_file" ] || \
  ! grep -q 'com.apple.developer.associated-domains' "$entitlements_file" || \
  ! grep -q 'applinks:' "$entitlements_file"; then
  echo "Universal-link runtime UNCLAIMED: requires TIRAK_UNIVERSAL_LINK_URL and an applinks Associated Domains entitlement."
  exit 0
fi

xcrun simctl terminate "$simulator_id" "$bundle_id" >/dev/null 2>&1 || true
universal_start=$(date '+%Y-%m-%d %H:%M:%S')
xcrun simctl openurl "$simulator_id" "$universal_url"
wait_for_receipt "$universal_start" '[TirakSceneLink] preserved cold universal-link'
wait_for_receipt "$universal_start" '[TirakSceneLinkJS] consumed cold universal-link'

xcrun simctl openurl "$simulator_id" "$universal_url"
wait_for_receipt "$universal_start" '[TirakSceneLink] delivered warm universal-link'
wait_for_receipt "$universal_start" '[TirakSceneLinkJS] consumed warm universal-link'

echo "Universal-link cold and warm native/JavaScript receipts verified."
receipts_since "$universal_start" | grep -F '[TirakSceneLink'
