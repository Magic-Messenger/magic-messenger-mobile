const {
  withAppDelegate,
  withDangerousMod,
  withXcodeProject,
  withPlugins,
  withPodfile,
  withInfoPlist,
  IOSConfig,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

/**
 * 🔹 AppDelegate.swift
 * - import Firebase ekler
 * - FirebaseApp.configure() inject eder
 */
const withFirebaseAppDelegate = (config) => {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    /**
     * 1️⃣ import Firebase
     */
    if (!contents.includes("import Firebase")) {
      contents = contents.replace(
        /import ReactAppDependencyProvider\n/,
        `import ReactAppDependencyProvider\nimport Firebase\n`,
      );
    }

    /**
     * 2️⃣ FirebaseApp.configure()
     */
    if (!contents.includes("FirebaseApp.configure()")) {
      contents = contents.replace(
        /didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\? = nil\s*\)\s*-> Bool \{/,
        (match) =>
          `${match}

    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
`,
      );
    }

    /**
     * 3️⃣ APNs → Firebase Messaging delegate
     */
    if (
      !contents.includes("didRegisterForRemoteNotificationsWithDeviceToken")
    ) {
      const apnsDelegate = `
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
  }
`;

      // AppDelegate class kapanmadan hemen önce ekle
      contents = contents.replace(
        /}\n\nclass ReactNativeDelegate:/,
        `${apnsDelegate}\n}\n\nclass ReactNativeDelegate:`,
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

/**
 * 🔹 iOS GoogleService-Info.plist
 */
const withIOSFirebaseFiles = (config) => {
  // 1️⃣ Dosyayı kopyala
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const src = path.join(
        config.modRequest.projectRoot,
        "GoogleService-Info.plist",
      );

      const dest = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        "GoogleService-Info.plist",
      );

      if (!fs.existsSync(src)) {
        throw new Error("❌ GoogleService-Info.plist bulunamadı");
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);

      return config;
    },
  ]);

  // 2️⃣ Xcode target + bundle resource’a ekle
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;

    const filePath = `${projectName}/GoogleService-Info.plist`;

    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: filePath,
      groupName: projectName,
      project,
      isBuildFile: true,
      verbose: true,
    });

    return config;
  });
};

/**
 * 🔹 Android google-services.json
 */
const withAndroidFirebaseFiles = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const src = path.join(
        config.modRequest.projectRoot,
        "google-services.json",
      );

      const dest = path.join(
        config.modRequest.platformProjectRoot,
        "app/google-services.json",
      );

      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }

      return config;
    },
  ]);
};

const FIREBASE_PODS_BLOCK = `
# 🔥 Firebase Swift pod’ları için ZORUNLU
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true

  # Firebase paketleri
  pod 'Firebase/Messaging', :modular_headers => true
`;

const withFirebasePods = (config) => {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    // Zaten ekliyse tekrar ekleme
    if (podfile.includes("pod 'FirebaseCore', :modular_headers => true")) {
      return config;
    }

    /**
     * target 'MagicRN' do
     *   use_expo_modules!
     *   ...
     */
    const targetRegex = /target\s+'[^']+'\s+do[\s\S]*?use_expo_modules!\n/;

    config.modResults.contents = podfile.replace(
      targetRegex,
      (match) => `${match}${FIREBASE_PODS_BLOCK}\n`,
    );

    return config;
  });
};

const withFirebaseInfoPlist = (config) => {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    /**
     * 🔔 Push Notifications (background)
     */
    infoPlist.UIBackgroundModes = Array.from(
      new Set([...(infoPlist.UIBackgroundModes || []), "remote-notification"]),
    );

    /**
     * 🔥 Firebase – AppDelegate proxy
     * react-native-firebase + Expo birlikte çalışırken genelde false önerilir
     */
    if (infoPlist.FirebaseAppDelegateProxyEnabled === undefined) {
      infoPlist.FirebaseAppDelegateProxyEnabled = false;
    }

    /**
     * (Opsiyonel) APNs environment
     * Debug / release ayrımı iOS otomatik yapar, elle gerekmez
     * ama istersen burada set edebilirsin
     */
    // infoPlist['aps-environment'] = 'development';

    config.modResults = infoPlist;
    return config;
  });
};

/**
 * 🔹 Master plugin
 */
const withFirebase = (config) => {
  return withPlugins(config, [
    withIOSFirebaseFiles,
    withAndroidFirebaseFiles,
    withFirebaseAppDelegate,
    withFirebasePods,
    withFirebaseInfoPlist,
  ]);
};

module.exports = withFirebase;
