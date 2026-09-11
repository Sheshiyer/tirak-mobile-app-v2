#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ios_dir=$(dirname "$script_dir")
plist="$ios_dir/Tirak/Info.plist"
project="$ios_dir/Tirak.xcodeproj/project.pbxproj"
app_delegate="$ios_dir/Tirak/AppDelegate.swift"
scene_delegate="$ios_dir/Tirak/SceneDelegate.swift"

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

deployment_targets=$(awk -F'= ' \
  '/IPHONEOS_DEPLOYMENT_TARGET =/ { gsub(/;/, "", $2); print $2 }' \
  "$project" | sort -u)
[ "$deployment_targets" = "15.1" ]

echo "Scene lifecycle contract verified (single scene, iOS target 15.1)."
