module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Required for expo-router path aliases and reanimated/worklets (must be last).
      "react-native-worklets/plugin",
    ],
  };
};
