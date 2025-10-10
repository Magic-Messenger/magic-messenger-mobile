# Expo Tor Module - Kullanım Kılavuzu

Bu modül, React Native Expo uygulamalarında Tor ağına bağlanmayı sağlar.

## Kurulum

Module zaten projenizde mevcut. Sadece import etmeniz yeterli.

## Temel Kullanım

### Tor'u Başlatma

```typescript
import ExpoTor from "expo-tor";

// Tor servisi başlat
async function startTor() {
  try {
    const result = await ExpoTor.startTor();
    console.log(result.message); // "Tor service starting..."
  } catch (error) {
    console.error("Tor başlatma hatası:", error);
  }
}
```

### Tor'u Durdurma

```typescript
async function stopTor() {
  try {
    const result = await ExpoTor.stopTor();
    console.log(result.message); // "Tor service stopped"
  } catch (error) {
    console.error("Tor durdurma hatası:", error);
  }
}
```

### Tor Durumunu Kontrol Etme

```typescript
// Senkron olarak mevcut durumu al
const status = ExpoTor.getTorStatus();
console.log("Tor Durumu:", status); // OFF, ON, STARTING, STOPPING

// Tor bağlantısını kontrol et
const isConnected = ExpoTor.isTorConnected();
console.log("Bağlı mı?", isConnected);
```

### SOCKS Proxy Port'unu Alma

```typescript
// Tor SOCKS proxy portunu al (genellikle 9050)
const socksPort = ExpoTor.getSocksPort();
console.log("SOCKS Port:", socksPort);

// HTTP Tunnel portunu al (genellikle 8118)
const httpPort = ExpoTor.getHttpTunnelPort();
console.log("HTTP Tunnel Port:", httpPort);
```

### Event Listener'lar

```typescript
import { useEffect } from 'react';
import ExpoTor from 'expo-tor';

function TorComponent() {
  useEffect(() => {
    // Tor durumu değişikliklerini dinle
    const statusListener = ExpoTor.addListener('onTorStatus', (event) => {
      console.log('Tor Status Changed:', event.status);
      // status: "OFF", "ON", "STARTING", "STOPPING"
    });

    // Tor bağlantı kurulduğunda
    const connectedListener = ExpoTor.addListener('onTorConnected', (event) => {
      console.log('Tor Connected!', event.connected);
    });

    // Tor bağlantısı kesildiğinde
    const disconnectedListener = ExpoTor.addListener('onTorDisconnected', (event) => {
      console.log('Tor Disconnected!', event.connected);
    });

    // Cleanup
    return () => {
      statusListener.remove();
      connectedListener.remove();
      disconnectedListener.remove();
    };
  }, []);

  return (
    // UI components
  );
}
```

### Tor Bilgisi Alma

```typescript
// Tor hakkında detaylı bilgi al
async function getTorInfo() {
  try {
    const listeners = await ExpoTor.getTorInfo("net/listeners/socks");
    console.log("SOCKS Listeners:", listeners);
  } catch (error) {
    console.error("Bilgi alma hatası:", error);
  }
}
```

## Tam Örnek

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import ExpoTor from 'expo-tor';

export default function TorExample() {
  const [torStatus, setTorStatus] = useState('OFF');
  const [isConnected, setIsConnected] = useState(false);
  const [socksPort, setSocksPort] = useState(-1);

  useEffect(() => {
    const statusListener = ExpoTor.addListener('onTorStatus', (event) => {
      setTorStatus(event.status);
    });

    const connectedListener = ExpoTor.addListener('onTorConnected', (event) => {
      setIsConnected(event.connected);
      // Tor bağlandığında port bilgisini al
      if (event.connected) {
        const port = ExpoTor.getSocksPort();
        setSocksPort(port);
      }
    });

    const disconnectedListener = ExpoTor.addListener('onTorDisconnected', (event) => {
      setIsConnected(event.connected);
      setSocksPort(-1);
    });

    return () => {
      statusListener.remove();
      connectedListener.remove();
      disconnectedListener.remove();
    };
  }, []);

  const handleStartTor = async () => {
    try {
      await ExpoTor.startTor();
    } catch (error) {
      console.error('Tor başlatma hatası:', error);
    }
  };

  const handleStopTor = async () => {
    try {
      await ExpoTor.stopTor();
    } catch (error) {
      console.error('Tor durdurma hatası:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Tor Module</Text>

      <View style={styles.statusContainer}>
        <Text>Durum: {torStatus}</Text>
        <Text>Bağlı: {isConnected ? 'Evet' : 'Hayır'}</Text>
        {socksPort > 0 && <Text>SOCKS Port: {socksPort}</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Tor'u Başlat" onPress={handleStartTor} />
        <Button title="Tor'u Durdur" onPress={handleStopTor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
  },
});
```

## SOCKS Proxy Kullanımı

Tor bağlantısı kurulduktan sonra, SOCKS proxy üzerinden internet istekleri yapabilirsiniz:

```typescript
// SOCKS port'unu al
const socksPort = ExpoTor.getSocksPort(); // Genellikle 9050

// Artık bu portu kullanarak istekler yapabilirsiniz
// Örnek: fetch ile SOCKS proxy kullanımı için bir kütüphane gerekebilir
// veya WebView ile Tor üzerinden tarayabilirsiniz
```

## Önemli Notlar

1. **İzinler**: Modül otomatik olarak `INTERNET` iznini ekler.
2. **İlk Bağlantı**: Tor'un ilk kez bağlanması 10-30 saniye sürebilir.
3. **Durum Kontrolü**: `onTorConnected` eventi geldiğinde Tor kullanıma hazırdır.
4. **Port Numaraları**: SOCKS port genellikle 9050, HTTP Tunnel port 8118'dir. Ancak portlar kullanımdaysa otomatik olarak başka portlar seçilir.
5. **Android Only**: Bu modül şu anda sadece Android'i desteklemektedir.

## API Referansı

### Metodlar

| Metod                     | Tip                                            | Açıklama                  |
| ------------------------- | ---------------------------------------------- | ------------------------- |
| `startTor()`              | `Promise<{success: boolean, message: string}>` | Tor servisini başlatır    |
| `stopTor()`               | `Promise<{success: boolean, message: string}>` | Tor servisini durdurur    |
| `getTorStatus()`          | `string`                                       | Mevcut Tor durumunu döner |
| `getSocksPort()`          | `number`                                       | SOCKS proxy portunu döner |
| `getHttpTunnelPort()`     | `number`                                       | HTTP tunnel portunu döner |
| `getTorInfo(key: string)` | `Promise<string>`                              | Tor bilgisi alır          |
| `isTorConnected()`        | `boolean`                                      | Tor bağlı mı kontrol eder |

### Event'ler

| Event               | Payload                | Açıklama                    |
| ------------------- | ---------------------- | --------------------------- |
| `onTorStatus`       | `{status: string}`     | Tor durumu değiştiğinde     |
| `onTorConnected`    | `{connected: boolean}` | Tor bağlandığında           |
| `onTorDisconnected` | `{connected: boolean}` | Tor bağlantısı kesildiğinde |
| `onTorError`        | `{error: string}`      | Hata oluştuğunda            |

### Durum Değerleri

- `OFF`: Tor kapalı
- `ON`: Tor açık ve çalışıyor
- `STARTING`: Tor başlatılıyor
- `STOPPING`: Tor durduruluyor
