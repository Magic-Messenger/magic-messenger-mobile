const { withAppDelegate } = require("@expo/config-plugins");

function withClearKeychain(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    // 1️⃣ Security import edilmemişse en üste ekle
    if (!contents.includes("import Security")) {
      contents = `import Security\n${contents}`;
    }

    // 2️⃣ clearKeychainIfNecessary fonksiyonunu ekle
    if (!contents.includes("func clearKeychainIfNecessary")) {
      const funcClearKeychain = `
    private func clearKeychainIfNecessary() {
        let defaults = UserDefaults.standard
        if defaults.bool(forKey: "HAS_RUN_BEFORE") == false {
            defaults.set(true, forKey: "HAS_RUN_BEFORE")

            let secItemClasses: [CFTypeRef] = [
                kSecClassGenericPassword,
                kSecClassInternetPassword,
                kSecClassCertificate,
                kSecClassKey,
                kSecClassIdentity
            ]

            for secItemClass in secItemClasses {
                let spec: NSDictionary = [kSecClass: secItemClass]
                SecItemDelete(spec)
            }

            print("✅ Keychain temizlendi")
        }
    }
`;

      // Fonksiyonu public override func application metodunun üstüne ekle
      contents = contents.replace(
        /(public override func application\()/,
        `${funcClearKeychain}\n$1`,
      );
    }

    // 3️⃣ didFinishLaunchingWithOptions içinde çağrı ekle
    const didFinishRegex =
      /public override func application\(\s*_ application: UIApplication,[\s\S]*?return super.application\(application, didFinishLaunchingWithOptions: launchOptions\)/;
    contents = contents.replace(didFinishRegex, (match) => {
      return match.replace(/\{/, `{\n        clearKeychainIfNecessary()`);
    });

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withClearKeychain;
