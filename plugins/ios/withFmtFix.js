const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const PATCH_MARKER = "FMT_USE_CONSTEVAL 0";
const ANCHOR =
  "    # This is necessary for Xcode 14, because it signs resource bundles by default";
const BAD_SENTRY_BUNDLE_LINE =
  `/bin/sh \`\\"$NODE_BINARY\\" --print \\"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode.sh'\\"\` \`\\"$NODE_BINARY\\" --print \\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\"\``;
const QUOTED_SENTRY_BUNDLE_BLOCK = [
  `SENTRY_XCODE=\`\\"$NODE_BINARY\\" --print \\"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode.sh'\\"\``,
  `REACT_NATIVE_XCODE=\`\\"$NODE_BINARY\\" --print \\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\"\``,
  `/bin/sh \\"$SENTRY_XCODE\\" \\"$REACT_NATIVE_XCODE\\"`,
].join("\\n");
const BAD_SENTRY_DEBUG_FILES_LINE =
  `/bin/sh \`\${NODE_BINARY:-node} --print \\"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode-debug-files.sh'\\"\``;
const QUOTED_SENTRY_DEBUG_FILES_BLOCK = [
  `SENTRY_DEBUG_FILES_SCRIPT=\`\\"\${NODE_BINARY:-node}\\" --print \\"require('path').dirname(require.resolve('@sentry/react-native/package.json')) + '/scripts/sentry-xcode-debug-files.sh'\\"\``,
  `/bin/sh \\"$SENTRY_DEBUG_FILES_SCRIPT\\"`,
].join("\\n");
const FMT_PATCH = [
  "    # Fix fmt consteval compilation errors with Xcode 26+",
  "    fmt_files = [",
  "      File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h'),",
  "      File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'format.h'),",
  "      File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'format-inl.h'),",
  "    ]",
  "    fmt_files.each do |fmt_file|",
  "      next unless File.exist?(fmt_file)",
  "      content = File.read(fmt_file)",
  "      patched = content.gsub(/#\\s*define\\s+FMT_USE_CONSTEVAL\\s+1/, '# define FMT_USE_CONSTEVAL 0')",
  "      if patched != content",
  "        File.chmod(0644, fmt_file)",
  "        File.write(fmt_file, patched)",
  "      end",
  "    end",
  "",
  "    # Fix React Native build scripts when the project path contains spaces.",
  "    with_environment = File.join(config[:reactNativePath], 'scripts', 'xcode', 'with-environment.sh')",
  "    if File.exist?(with_environment)",
  "      content = File.read(with_environment)",
  "      patched = content.gsub(\"  $1\\n\", \"  \\\"$@\\\"\\n\")",
  "      if patched != content",
  "        File.chmod(0755, with_environment)",
  "        File.write(with_environment, patched)",
  "      end",
  "      File.chmod(0755, with_environment)",
  "    end",
  "",
  "    installer.pods_project.targets.each do |target|",
  "      target.shell_script_build_phases.each do |phase|",
  "        next unless phase.shell_script",
  "",
  "        phase.shell_script = phase.shell_script.gsub(",
  "          '/bin/sh -c \"$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT\"',",
  "          '\"$WITH_ENVIRONMENT\" \"$SCRIPT_PHASES_SCRIPT\"'",
  "        )",
  "",
  "        phase.shell_script = phase.shell_script.gsub(",
  "          'bash -l -c \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"',",
  "          'bash -l \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"'",
  "        )",
  "      end",
  "    end",
  "",
  "    expo_constants_script = File.expand_path(",
  "      '../node_modules/expo-constants/scripts/get-app-config-ios.sh',",
  "      Pod::Config.instance.installation_root.to_s",
  "    )",
  "    if File.exist?(expo_constants_script)",
  "      content = File.read(expo_constants_script)",
  "      patched = content.gsub('PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)', 'PROJECT_DIR_BASENAME=$(basename \"$PROJECT_DIR\")')",
  "      if patched != content",
  "        File.chmod(0755, expo_constants_script)",
  "        File.write(expo_constants_script, patched)",
  "      end",
  "      File.chmod(0755, expo_constants_script)",
  "    end",
  "",
  "    expo_constants_podspec = File.expand_path(",
  "      '../node_modules/expo-constants/ios/EXConstants.podspec',",
  "      Pod::Config.instance.installation_root.to_s",
  "    )",
  "    if File.exist?(expo_constants_podspec)",
  "      content = File.read(expo_constants_podspec)",
  "      patched = content.gsub(",
  "        'bash -l -c \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"',",
  "        'bash -l \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"'",
  "      )",
  "      if patched != content",
  "        File.chmod(0644, expo_constants_podspec)",
  "        File.write(expo_constants_podspec, patched)",
  "      end",
  "    end",
].join("\n");

function withFmtFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) {
        return modConfig;
      }

      const podfile = fs.readFileSync(podfilePath, "utf8");
      if (!podfile.includes(PATCH_MARKER)) {
        let updatedPodfile;
        if (podfile.includes(ANCHOR)) {
          updatedPodfile = podfile.replace(ANCHOR, `${FMT_PATCH}\n\n${ANCHOR}`);
        } else {
          updatedPodfile = podfile.replace(/\n  end\nend\s*$/, `\n${FMT_PATCH}\n  end\nend\n`);
        }

        fs.writeFileSync(podfilePath, updatedPodfile);
      }

      const xcodeProjectDir = fs
        .readdirSync(modConfig.modRequest.platformProjectRoot)
        .find((entry) => entry.endsWith(".xcodeproj"));
      if (xcodeProjectDir) {
        const projectFilePath = path.join(
          modConfig.modRequest.platformProjectRoot,
          xcodeProjectDir,
          "project.pbxproj"
        );
        if (fs.existsSync(projectFilePath)) {
          const projectFile = fs.readFileSync(projectFilePath, "utf8");
          const updatedProjectFile = projectFile.replace(
            BAD_SENTRY_BUNDLE_LINE,
            QUOTED_SENTRY_BUNDLE_BLOCK
          );
          const fullyUpdatedProjectFile = updatedProjectFile.replace(
            BAD_SENTRY_DEBUG_FILES_LINE,
            QUOTED_SENTRY_DEBUG_FILES_BLOCK
          );
          if (fullyUpdatedProjectFile !== projectFile) {
            fs.writeFileSync(projectFilePath, fullyUpdatedProjectFile);
          }
        }
      }

      return modConfig;
    },
  ]);
}

module.exports = withFmtFix;
