#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ios_dir=$(dirname "$script_dir")
plist="$ios_dir/Tirak/Info.plist"
project="$ios_dir/Tirak.xcodeproj/project.pbxproj"
app_delegate="$ios_dir/Tirak/AppDelegate.swift"
scene_delegate="$ios_dir/Tirak/SceneDelegate.swift"
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
grep -q 'RCTContentDidAppearNotification' "$app_delegate"
grep -q 'preserveColdStartURL' "$app_delegate"
grep -q 'preserveColdStartUserActivity' "$app_delegate"
grep -q 'deliverPendingSceneLink' "$app_delegate"
grep -q 'appDelegate.preserveColdStartURL' "$scene_delegate"
grep -q 'appDelegate.preserveColdStartUserActivity' "$scene_delegate"
grep -q 'preserved cold custom-scheme' "$app_delegate"
grep -q 'delivered deferred custom-scheme' "$app_delegate"
grep -q 'delivered warm custom-scheme' "$app_delegate"
[ -x "$runtime_verifier" ]

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

echo "Scene lifecycle and deferred cold-link contract verified (single scene, iOS target 15.1)."
