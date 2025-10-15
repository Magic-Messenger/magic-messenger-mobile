# Tor Axios Integration

Projedeki tüm API isteklerini otomatik olarak Tor üzerinden yapmanızı sağlayan akıllı wrapper sistemi.

## 🎯 Özellikler

- ✅ **Otomatik Tor Geçişi**: Tor bağlıysa otomatik olarak Tor üzerinden istek yapar
- ✅ **Fallback Desteği**: Tor bağlı değilse veya hata olursa normal Axios kullanır
- ✅ **Mevcut Interceptor Desteği**: Auth token ekleme gibi mevcut interceptor'lar çalışır
- ✅ **Axios Uyumlu API**: Mevcut kodlarınızı minimal değişiklikle kullanabilirsiniz
- ✅ **TypeScript Desteği**: Tam tip güvenliği

## 📦 Yapı

```
services/axios/tor/
├── TorManager.ts          # Tor bağlantı durumu yönetimi
├── TorHttpClient.ts       # Tor üzerinden HTTP istekleri
├── TorAxiosAdapter.ts     # Axios ve Tor arası köprü
└── index.ts               # Export'lar
```

## 🚀 Kullanım

### 1. Temel Kullanım (Önerilen)

Mevcut `AxiosInstance` yerine `AxiosInstanceTor` kullanın:

```typescript
// Eski:
import AxiosInstance from "@/services/axios/AxiosBase";

// Yeni:
import AxiosInstanceTor from "@/services/axios/AxiosBaseTor";

// Kullanım tamamen aynı!
const data = await AxiosInstanceTor<UserType>({
  url: "/api/users",
  method: "GET",
});
```

### 2. Tor'u Aktifleştirme

App başlarken veya kullanıcı ayarlarından:

```typescript
import { TorManager } from "@/services/axios/tor";
import ExpoTor from "expo-tor";

// 1. Tor servisini başlat
async function startTor() {
  await ExpoTor.startTor();

  // 2. Tor kullanımını aktifleştir
  TorManager.setEnabled(true);

  console.log("✅ Tor aktif, tüm istekler Tor üzerinden gidecek");
}

// Tor'u devre dışı bırak
TorManager.setEnabled(false);
```

### 3. Durum Kontrolü

```typescript
import { TorManager } from "@/services/axios/tor";

// Detaylı durum bilgisi
const status = TorManager.getConnectionStatus();
console.log({
  enabled: status.enabled, // Tor kullanımı aktif mi?
  connected: status.connected, // Tor'a bağlı mı?
  socksPort: status.socksPort, // SOCKS port
  ready: status.ready, // Kullanıma hazır mı?
});

// Kısa kontrol
if (TorManager.isReady()) {
  console.log("Tor hazır!");
}

// Durum değişikliklerini dinle
TorManager.addListener((ready) => {
  console.log("Tor durumu değişti:", ready);
});
```

### 4. Direkt Axios Benzeri Kullanım

```typescript
import { AxiosBaseTorInstance } from "@/services/axios/AxiosBaseTor";

// GET
const response = await AxiosBaseTorInstance.get("/api/users");
console.log(response.data);

// POST
const createResponse = await AxiosBaseTorInstance.post("/api/users", {
  name: "John Doe",
  email: "john@example.com",
});

// PUT, DELETE, PATCH da destekleniyor
await AxiosBaseTorInstance.put("/api/users/1", userData);
await AxiosBaseTorInstance.delete("/api/users/1");
```

### 5. Sadece Tor Üzerinden (Fallback Yok)

Eğer sadece Tor üzerinden istek yapmak istiyorsanız:

```typescript
import { TorHttpClient } from "@/services/axios/tor";

try {
  const response = await TorHttpClient.get("/api/data", {
    baseURL: "https://api.example.com",
  });
  console.log(response.data);
} catch (error) {
  // Tor hazır değilse hata fırlatır
  console.error("Tor kullanılamıyor:", error);
}
```

## 📱 Örnek Uygulama Akışı

### App.tsx (veya Root Component)

```typescript
import { useEffect } from 'react';
import { TorManager } from "@/services/axios/tor";
import ExpoTor from "expo-tor";

export default function App() {
  useEffect(() => {
    // Tor başlat
    const initTor = async () => {
      try {
        await ExpoTor.startTor();
        TorManager.setEnabled(true);
        console.log("✅ Tor başlatıldı");
      } catch (error) {
        console.error("Tor başlatılamadı:", error);
      }
    };

    initTor();

    // Cleanup
    return () => {
      ExpoTor.stopTor();
      TorManager.setEnabled(false);
    };
  }, []);

  return <YourApp />;
}
```

### API Service Örneği

```typescript
// services/api/UserService.ts
import AxiosInstanceTor from "@/services/axios/AxiosBaseTor";

export const UserService = {
  async getUsers() {
    return AxiosInstanceTor<User[]>({
      url: "/api/users",
      method: "GET",
    });
  },

  async createUser(data: CreateUserDto) {
    return AxiosInstanceTor<User>({
      url: "/api/users",
      method: "POST",
      data,
    });
  },
};

// Kullanım - Tor otomatik devrede!
const users = await UserService.getUsers();
```

### Ayarlar Sayfası

```typescript
import { useState, useEffect } from 'react';
import { Switch, Text } from 'react-native';
import { TorManager } from "@/services/axios/tor";

export function SettingsScreen() {
  const [torEnabled, setTorEnabled] = useState(false);
  const [torStatus, setTorStatus] = useState(TorManager.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = TorManager.addListener(() => {
      setTorStatus(TorManager.getConnectionStatus());
    });
    return unsubscribe;
  }, []);

  const handleToggle = (value: boolean) => {
    setTorEnabled(value);
    TorManager.setEnabled(value);
  };

  return (
    <View>
      <Text>Tor Kullan</Text>
      <Switch value={torEnabled} onValueChange={handleToggle} />

      <Text>Durum: {torStatus.ready ? '🟢 Aktif' : '🔴 Devre Dışı'}</Text>
      {torStatus.connected && (
        <Text>SOCKS Port: {torStatus.socksPort}</Text>
      )}
    </View>
  );
}
```

## 🔄 Migration (Mevcut Kodları Güncelleme)

### Basit Değişiklik

```typescript
// Önce
import AxiosInstance from "@/services/axios/AxiosBase";
const data = await AxiosInstance({ url: "/api/data" });

// Sonra
import AxiosInstanceTor from "@/services/axios/AxiosBaseTor";
const data = await AxiosInstanceTor({ url: "/api/data" });
```

### Global Değiştirme

Tüm projede tek seferde değiştirmek için:

```bash
# Find & Replace (VSCode)
Find:    import AxiosInstance from "@/services/axios/AxiosBase"
Replace: import AxiosInstanceTor as AxiosInstance from "@/services/axios/AxiosBaseTor"
```

Bu şekilde hiçbir kodu değiştirmeden Tor desteği eklenmiş olur!

## 📊 Logging

Sistem otomatik olarak console'a log basar:

```
🔵 [ADAPTER] Tor üzerinden istek yapılıyor
🌐 [TOR] GET https://api.example.com/users
✅ [TOR] 200 https://api.example.com/users
```

veya

```
⏳ [ADAPTER] Tor etkin ama henüz bağlı değil, normal Axios kullanılıyor
🔵 [ADAPTER] Normal Axios üzerinden istek yapılıyor
```

## ⚙️ Configuration

### baseURL Kullanımı

```typescript
// Her istekte baseURL belirtme
const response = await TorHttpClient.get("/users", {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// veya mevcut AxiosBase zaten baseURL'i kullanıyor
const data = await AxiosInstanceTor({ url: "/users" });
// Otomatik olarak process.env.EXPO_PUBLIC_API_URL + '/users' olur
```

## 🐛 Troubleshooting

### "Tor is not ready" Hatası

```typescript
// Sorunu kontrol et
TorManager.logStatus();

// Output:
// 📊 Tor Durumu: {
//   enabled: '✅',
//   connected: '❌',  <- Bağlı değil!
//   socksPort: -1,
//   ready: '❌ HAZIR DEĞİL'
// }

// Çözüm: Tor'u başlat
await ExpoTor.startTor();
```

### İstekler Tor'dan Gitmiyor

```typescript
// 1. Tor etkin mi kontrol et
console.log(TorManager.getEnabled()); // false mu?
TorManager.setEnabled(true);

// 2. Bağlantı durumunu kontrol et
TorManager.logStatus();

// 3. Doğru wrapper'ı kullandığınızdan emin olun
import AxiosInstanceTor from "@/services/axios/AxiosBaseTor"; // ✅
// DEĞIL:
import AxiosInstance from "@/services/axios/AxiosBase"; // ❌
```

## 🔒 Güvenlik Notları

- Tor bağlantısı her istekte kontrol edilir
- Tor başarısız olursa otomatik olarak normal bağlantıya geçer
- Tüm auth token'lar ve header'lar korunur
- .onion sitelere erişim desteklenir

## 📝 Notlar

- Tor istekleri normal isteklerden daha yavaş olabilir
- İlk Tor bağlantısı 10-30 saniye sürebilir
- HTTPS istekleri desteklenir
- WebSocket henüz desteklenmiyor
