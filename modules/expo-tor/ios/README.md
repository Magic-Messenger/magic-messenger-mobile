# Expo Tor - iOS Installation

## 🍎 iOS Kurulum Adımları

### 1. Pod Install

iOS dizinine gidin ve pod install yapın:

```bash
cd /Users/kadirbarcin/Desktop/Dev/ReactNative/magic-mobil-expo/ios
pod install
```

### 2. Xcode ile Aç

```bash
open magic-mobil-expo.xcworkspace
```

### 3. Build Settings Kontrol

Xcode'da:

- **Target** → expo-tor seçin
- **Build Settings** → **Swift Language Version** → 5.0
- **Build Phases** → **Link Binary With Libraries** → Tor.framework olmalı

### 4. Info.plist Güncelleme

Ana projenizin `Info.plist` dosyasına ekleyin:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 5. Capabilities (Opsiyonel)

Eğer network extension kullanmak isterseniz:

- **Target** → **Signing & Capabilities**
- **+ Capability** → **Network Extensions**

## 📦 Eklenen Dosyalar

```
ios/
├── ExpoTor.podspec          # ✅ Tor dependency eklendi
├── ExpoTorModule.swift      # ✅ Güncellendi
├── TorController.swift      # ✅ YENİ - Tor controller
└── TorHTTPClient.swift      # ✅ YENİ - HTTP client
```

## 🚀 Kullanım

TypeScript kodu Android ile aynı!

```typescript
import ExpoTor from "expo-tor";

// Tor başlat
await ExpoTor.startTor();

// HTTP request
const response = await ExpoTor.makeRequest(
  "https://check.torproject.org/api/ip"
);
console.log(JSON.parse(response.data));
```

## ⚠️ Önemli Notlar

### App Store Submission

App Store'a gönderirken:

1. **Export Compliance** - Tor şifreleme kullanır
2. **Privacy Policy** - Tor kullanımını açıklayın
3. **App Description** - Neden Tor kullandığınızı belirtin

### Tor Framework Hakkında

- **Version**: 408.11
- **Source**: [iCepa/Tor.framework](https://github.com/iCepa/Tor.framework)
- **License**: BSD
- **Size**: ~30MB (strip edilebilir)

### Bilinen Sınırlamalar

1. ❌ **HTTP Tunnel Port** yok (sadece Android)
2. ❌ **getTorInfo** sınırlı (Tor.framework kısıtlaması)
3. ⚠️ **İlk başlatma** 30-60 saniye sürebilir
4. ⚠️ **App boyutu** ~25-30MB artar

## 🔧 Troubleshooting

### "Module 'Tor' not found"

```bash
cd ios
pod deintegrate
pod install
```

### "Could not find module 'ExpoModulesCore'"

```bash
cd ..
npx expo prebuild --clean
cd ios
pod install
```

### Build hatası

1. Xcode'u temizleyin: **Product** → **Clean Build Folder**
2. Derived data silin
3. `pod install` tekrar yapın

## 📊 Performance

- **İlk başlatma**: 30-60 saniye
- **Sonraki başlatmalar**: 10-20 saniye
- **HTTP Request overhead**: +500ms - 2s
- **Memory kullanımı**: +50-80MB

## 🎯 Next Steps

1. `pod install` yapın
2. Xcode'da build edin
3. Test edin!
