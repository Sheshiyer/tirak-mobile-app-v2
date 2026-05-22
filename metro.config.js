// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const os = require('os');

// Polyfill for Node.js < 19
if (!os.availableParallelism) {
  os.availableParallelism = () => os.cpus().length;
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize for ViewManager stability and prevent crashes
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle ViewManager issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Optimize transformer for better ViewManager compatibility
config.transformer.minifierConfig = {
  // Preserve ViewManager references during minification
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Handle import.meta and ESM modules for web builds
// Add mjs to source extensions so they're transformed by Babel (not treated as assets)
const defaultSourceExts = config.resolver.sourceExts || [];
config.resolver.sourceExts = [...defaultSourceExts.filter(ext => ext !== 'mjs'), 'mjs', 'cjs'];

// Configure transformer to handle modern JS features and transform all files through Babel
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Force transform of node_modules that might contain import.meta
// By default, Metro doesn't transform node_modules
config.watchFolders = [__dirname];
config.transformer.babelTransformerPath = require.resolve('@expo/metro-config/babel-transformer');

// Add unstable_allowRequireContext for better module resolution
config.transformer.unstable_allowRequireContext = true;

// Add serializer configuration for better Android compatibility
config.serializer.createModuleIdFactory = function() {
  const fileToIdMap = new Map();
  let nextId = 0;
  return (path) => {
    if (!fileToIdMap.has(path)) {
      fileToIdMap.set(path, nextId++);
    }
    return fileToIdMap.get(path);
  };
};

module.exports = config;
