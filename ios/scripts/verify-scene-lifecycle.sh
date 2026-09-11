#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ios_dir=$(dirname "$script_dir")
plist="$ios_dir/Tirak/Info.plist"
project="$ios_dir/Tirak.xcodeproj/project.pbxproj"
app_delegate="$ios_dir/Tirak/AppDelegate.swift"
scene_delegate="$ios_dir/Tirak/SceneDelegate.swift"
scene_link_header="$ios_dir/Tirak/SceneLinkModule.h"
scene_link_module="$ios_dir/Tirak/SceneLinkModule.m"
app_layout="$ios_dir/../app/_layout.tsx"
scene_link_js="$ios_dir/../utils/scene-link-consumption.ts"
runtime_verifier="$script_dir/verify-scene-link-runtime.sh"

scene_class=$(/usr/libexec/PlistBuddy -c \
  "Print :UIApplicationSceneManifest:UISceneConfigurations:UIWindowSceneSessionRoleApplication:0:UISceneDelegateClassName" \
  "$plist")
multiple_scenes=$(/usr/libexec/PlistBuddy -c \
  "Print :UIApplicationSceneManifest:UIApplicationSupportsMultipleScenes" \
  "$plist")

[ "$scene_class" = '$(PRODUCT_MODULE_NAME).SceneDelegate' ]
[ "$multiple_scenes" = "false" ]
grep -q 'SceneDelegate.swift in Sources' "$project"
grep -q 'window.windowScene = windowScene' "$scene_delegate"
grep -q 'window.makeKeyAndVisible()' "$scene_delegate"
grep -q 'self.window = window' "$app_delegate"
grep -q 'let bootstrapWindow = UIWindow(frame: UIScreen.main.bounds)' "$app_delegate"
grep -q 'startReactNative(in: bootstrapWindow)' "$app_delegate"
grep -q 'Bundle.main.url(forResource: "main", withExtension: "jsbundle")' "$app_delegate"
grep -q 'preserveColdStartURL' "$app_delegate"
grep -q 'preserveColdStartUserActivity' "$app_delegate"
grep -q 'TirakSceneLinkRegistry.preserve' "$app_delegate"
grep -q 'appDelegate.preserveColdStartURL' "$scene_delegate"
grep -q 'appDelegate.preserveColdStartUserActivity' "$scene_delegate"
grep -q 'preserved cold custom-scheme' "$app_delegate"
grep -q 'delivered warm custom-scheme' "$app_delegate"
grep -q 'RCT_EXPORT_MODULE(TirakSceneLink)' "$scene_link_module"
grep -q 'getPendingLink' "$scene_link_module"
grep -q 'acknowledgePendingLink' "$scene_link_module"
grep -q 'acknowledgeWarmLink' "$scene_link_module"
grep -q 'SceneLinkModule.m in Sources' "$project"
grep -q 'consumePendingSceneLink' "$scene_link_js"
grep -q 'consumeWarmSceneLink' "$scene_link_js"
grep -q 'consumePendingSceneLink' "$app_layout"
grep -q 'consumeWarmSceneLink' "$app_layout"
[ -f "$scene_link_header" ]
[ -x "$runtime_verifier" ]

if grep -q 'RCTContentDidAppearNotification\|deliverPendingSceneLink' "$app_delegate"; then
  echo "Cold scene links must wait for an explicit JavaScript acknowledgement." >&2
  exit 1
fi

if grep -q 'self.scene(scene, openURLContexts: connectionOptions.urlContexts)' "$scene_delegate"; then
  echo "SceneDelegate must not emit a cold URL before React content appears." >&2
  exit 1
fi

if grep -q 'self.scene(scene, continue: userActivity)' "$scene_delegate"; then
  echo "SceneDelegate must not emit cold user activity before React content appears." >&2
  exit 1
fi

deployment_targets=$(awk -F'= ' \
  '/IPHONEOS_DEPLOYMENT_TARGET =/ { gsub(/;/, "", $2); print $2 }' \
  "$project" | sort -u)
[ "$deployment_targets" = "15.1" ]

echo "Scene lifecycle and JavaScript-acknowledged cold-link contract verified (single scene, iOS target 15.1)."
