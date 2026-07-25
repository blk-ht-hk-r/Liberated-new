module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Required for expo-router path aliases and reanimated (must be last).
      "react-native-reanimated/plugin",
    ],
  };
};
