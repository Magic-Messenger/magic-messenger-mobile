const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function overrideReadMediaPermission(config) {
  return withAndroidManifest(config, (config) => {
    let androidManifest = config.modResults;

    // Some Expo versions nest actual manifest inside "manifest"
    const manifest = androidManifest.manifest ?? androidManifest;

    // Ensure root attributes exist
    if (!manifest.$) {
      manifest.$ = {};
    }

    // Ensure tools namespace exists
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Ensure <uses-permission> array exists
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    // Check if the permission already exists
    let readMedia = manifest["uses-permission"].find(
      (p) => p.$["android:name"] === "android.permission.READ_MEDIA_IMAGES",
    );

    if (!readMedia) {
      // Add permission
      readMedia = {
        $: {
          "android:name": "android.permission.READ_MEDIA_IMAGES",
        },
      };
      manifest["uses-permission"].push(readMedia);
    }

    // Apply overrides
    readMedia.$["android:maxSdkVersion"] = "34";
    readMedia.$["tools:replace"] = "android:maxSdkVersion";

    return config;
  });
};
