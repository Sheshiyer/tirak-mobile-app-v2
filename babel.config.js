module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Custom plugin to transform import.meta for web compatibility
      function (babel) {
        const { types: t } = babel;
        return {
          name: 'transform-import-meta',
          visitor: {
            MetaProperty(path) {
              // Check if this is import.meta
              if (
                path.node.meta &&
                path.node.meta.name === 'import' &&
                path.node.property &&
                path.node.property.name === 'meta'
              ) {
                // Replace with a safe object that works in browsers
                path.replaceWithSourceString(
                  '({ url: (typeof window !== "undefined" ? window.location.href : ""), env: { MODE: "development", DEV: true, PROD: false } })'
                );
              }
            },
          },
        };
      },
      // Must be last — initializes Reanimated Worklets native runtime
      'react-native-reanimated/plugin',
    ],
  };
};

