const { withProjectBuildGradle } = require("@expo/config-plugins");

const withNotifeeAndroidRepo = (config) =>
  withProjectBuildGradle(config, (config) => {
    if (
      !config.modResults.contents.includes("@notifee/react-native/android/libs")
    ) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        `allprojects {
  repositories {
    maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`,
      );
    }
    return config;
  });

module.exports = withNotifeeAndroidRepo;
