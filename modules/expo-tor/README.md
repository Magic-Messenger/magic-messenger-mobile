# Expo Tor Module

React Native Expo uygulamalarında Tor ağına bağlanmayı sağlayan native modül.

## Özellikler

- ✅ Tor servisini başlatma ve durdurma
- ✅ Tor durumunu gerçek zamanlı takip etme
- ✅ SOCKS proxy desteği
- ✅ HTTP Tunnel desteği
- ✅ Event-based durum bildirimleri
- ✅ TypeScript tip desteği
- ✅ Tor 0.4.8.18 sürümü

## Kurulum

Bu modül zaten projenizde mevcut ve Expo Modules API kullanılarak geliştirilmiştir.

## Hızlı Başlangıç

```typescript
import ExpoTor from "expo-tor";

// Tor'u başlat
await ExpoTor.startTor();

// Durum kontrolü
const status = ExpoTor.getTorStatus();
console.log("Tor Status:", status);

// SOCKS port al
const socksPort = ExpoTor.getSocksPort();
console.log("SOCKS Port:", socksPort);
```

Detaylı kullanım için [USAGE.md](./USAGE.md) dosyasına bakın.

## Teknik Detaylar

### Android

- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 35
- **Tor Version**: 0.4.8.18
- **Dependencies**:
  - `info.guardianproject:jtorctl:0.4.5.7`
  - `androidx.localbroadcastmanager:localbroadcastmanager:1.1.0`

### Native Libraries

Modül aşağıdaki mimarileri destekler:

- `armeabi-v7a`
- `arm64-v8a`
- `x86`
- `x86_64`

### Bağımlılıklar

Modül Guardian Project'in Tor Android implementasyonunu kullanır:

- Tor: 0.4.8.18
- libevent: 2.1.12
- OpenSSL: 3.5.3
- zlib: 1.3.1
- zstd: 1.5.7

## API Dokümantasyonu

### Metodlar

#### `startTor(): Promise<TorStartResponse>`

Tor servisini başlatır.

```typescript
const result = await ExpoTor.startTor();
// { success: true, message: "Tor service starting..." }
```

#### `stopTor(): Promise<TorStopResponse>`

Tor servisini durdurur.

```typescript
const result = await ExpoTor.stopTor();
// { success: true, message: "Tor service stopped" }
```

#### `getTorStatus(): string`

Mevcut Tor durumunu döner (`OFF`, `ON`, `STARTING`, `STOPPING`).

#### `isTorConnected(): boolean`

Tor'un bağlı olup olmadığını kontrol eder.

#### `getSocksPort(): number`

SOCKS proxy port numarasını döner.

#### `getHttpTunnelPort(): number`

HTTP Tunnel port numarasını döner.

#### `getTorInfo(key: string): Promise<string>`

Tor'dan bilgi alır.

### Event'ler

#### `onTorStatus`

Tor durumu değiştiğinde tetiklenir.

```typescript
ExpoTor.addListener("onTorStatus", (event) => {
  console.log("Status:", event.status);
});
```

#### `onTorConnected`

Tor bağlandığında tetiklenir.

```typescript
ExpoTor.addListener("onTorConnected", (event) => {
  console.log("Connected:", event.connected);
});
```

#### `onTorDisconnected`

Tor bağlantısı kesildiğinde tetiklenir.

#### `onTorError`

Bir hata oluştuğunda tetiklenir.

## Proje Yapısı

```
expo-tor/
├── android/                    # Android native kodu
│   ├── src/main/
│   │   ├── java/
│   │   │   ├── expo/modules/tor/
│   │   │   │   ├── ExpoTorModule.kt      # Ana modül
│   │   │   │   └── ExpoTorView.kt        # WebView komponenti
│   │   │   └── org/torproject/jni/
│   │   │       └── TorService.java       # Tor servisi
│   │   ├── jniLibs/                      # Native .so dosyaları
│   │   │   ├── armeabi-v7a/libtor.so
│   │   │   ├── arm64-v8a/libtor.so
│   │   │   ├── x86/libtor.so
│   │   │   └── x86_64/libtor.so
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── ios/                        # iOS (Henüz uygulanmadı)
├── src/                        # TypeScript kodu
│   ├── ExpoTor.types.ts        # Tip tanımları
│   ├── ExpoTorModule.ts        # Ana modül export
│   ├── ExpoTorView.tsx         # React komponenti
│   └── ...
├── tor-android/                # Kaynak tor-android projesi
└── index.ts                    # Module giriş noktası
```

## Build

### Android

```bash
cd android
./gradlew assembleDebug
```

## Lisans

Bu modül Guardian Project'in Tor Android implementasyonunu kullanır ve aynı lisans altında dağıtılır.

## Kaynaklar

- [Tor Project](https://www.torproject.org/)
- [Guardian Project - Tor Android](https://github.com/guardianproject/tor-android)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/)

## Notlar

- ⚠️ Bu modül şu anda sadece **Android** platformunu desteklemektedir
- ⚠️ iOS desteği henüz eklenmemiştir
- ⚠️ Web platformu desteklenmemektedir

## Geliştirme

Modülü geliştirmek için:

1. Android Studio'da projeyi açın
2. `android/` klasörüne gidin
3. Değişikliklerinizi yapın
4. Build edin ve test edin

## Sorun Giderme

### Tor bağlanamıyor

- İnternet bağlantınızı kontrol edin
- Firewall ayarlarınızı kontrol edin
- Tor'un tamamen başlaması 10-30 saniye sürebilir

### Build hataları

- Gradle cache'i temizleyin: `./gradlew clean`
- Android SDK versiyonlarını kontrol edin
- Dependencies güncel mi kontrol edin

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen:

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request açın

## Destek

Sorularınız veya sorunlarınız için:

- Issue açın
- Dokümantasyonu kontrol edin
- USAGE.md dosyasına bakın
