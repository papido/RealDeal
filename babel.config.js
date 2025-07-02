module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // or ['module:metro-react-native-babel-preset'] if not using Expo
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./",
            "@components": "./src/components",
            "@assets": "./assets",
          },
        },
      ],
    ],
  };
};
