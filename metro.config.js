const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    // Optional dev-only shim to disable expo-keep-awake when NO_KEEP_AWAKE=1
    extraNodeModules: process.env.NO_KEEP_AWAKE === "1"
      ? {
          ...(resolver.extraNodeModules || {}),
          "expo-keep-awake": path.resolve(__dirname, "src/shims/expo-keep-awake"),
        }
      : resolver.extraNodeModules,
  };

  return config;
})();
