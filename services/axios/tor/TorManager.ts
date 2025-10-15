import ExpoTor from "expo-tor";

/**
 * Tor bağlantı durumunu yöneten singleton class
 */
class TorManager {
  private static instance: TorManager;
  private isConnected: boolean = false;
  private isEnabled: boolean = false;
  private socksPort: number = -1;
  private listeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {
    this.initialize();
  }

  static getInstance(): TorManager {
    if (!TorManager.instance) {
      TorManager.instance = new TorManager();
    }
    return TorManager.instance;
  }

  private initialize() {
    // Tor durum değişikliklerini dinle
    ExpoTor.addListener("onTorConnected", (event) => {
      this.isConnected = event.connected;
      this.socksPort = ExpoTor.getSocksPort();

      // Tor bağlandığında otomatik olarak enabled yap
      if (!this.isEnabled) {
        this.isEnabled = true;
        console.log("🟢 Tor bağlandı, otomatik olarak aktifleştirildi!");
      }

      this.notifyListeners();
      console.log("🟢 Tor bağlandı, SOCKS Port:", this.socksPort);
    });

    ExpoTor.addListener("onTorDisconnected", (event) => {
      this.isConnected = event.connected;
      this.socksPort = -1;
      this.notifyListeners();
      console.log("🔴 Tor bağlantısı kesildi");
    });

    ExpoTor.addListener("onTorStatus", (event) => {
      if (event.status === "ON") {
        this.isConnected = true;
        this.socksPort = ExpoTor.getSocksPort();

        // Tor açıkken otomatik enable et
        if (!this.isEnabled) {
          this.isEnabled = true;
          console.log("🟢 Tor ON durumunda, otomatik olarak aktifleştirildi!");
        }
      } else if (event.status === "OFF") {
        this.isConnected = false;
        this.socksPort = -1;
      }
      this.notifyListeners();
    });

    // Başlangıçta Tor durumunu kontrol et
    this.checkInitialStatus();
  }

  private checkInitialStatus() {
    try {
      const status = ExpoTor.getTorStatus();
      const isTorConnected = ExpoTor.isTorConnected();

      if (status === "ON" && isTorConnected) {
        this.isConnected = true;
        this.socksPort = ExpoTor.getSocksPort();

        // Tor zaten açıksa otomatik enable et
        if (!this.isEnabled) {
          this.isEnabled = true;
          console.log(
            "🟢 Tor zaten çalışıyor, otomatik olarak aktifleştirildi!",
          );
        }

        this.notifyListeners();
      }
    } catch (error) {
      // Tor henüz başlatılmamış, sorun değil
    }
  }

  /**
   * Tor kullanımını etkinleştir/devre dışı bırak
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`⚙️ Tor kullanımı ${enabled ? "aktif" : "devre dışı"}`);
    this.notifyListeners();
  }

  /**
   * Tor bağlantısının aktif olup olmadığını kontrol et
   */
  isReady(): boolean {
    return this.isEnabled && this.isConnected && this.socksPort > 0;
  }

  /**
   * Tor'un etkin olup olmadığını kontrol et (bağlantı olup olmadığına bakmaksızın)
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Bağlantı durumunu al
   */
  getConnectionStatus(): {
    enabled: boolean;
    connected: boolean;
    socksPort: number;
    ready: boolean;
  } {
    return {
      enabled: this.isEnabled,
      connected: this.isConnected,
      socksPort: this.socksPort,
      ready: this.isReady(),
    };
  }

  /**
   * Durum değişikliklerini dinle
   */
  addListener(callback: (connected: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isReady()));
  }

  /**
   * Mevcut durumu logla
   */
  logStatus() {
    const status = this.getConnectionStatus();
    console.log("📊 Tor Durumu:", {
      enabled: status.enabled ? "✅" : "❌",
      connected: status.connected ? "✅" : "❌",
      socksPort: status.socksPort,
      ready: status.ready ? "✅ HAZIR" : "❌ HAZIR DEĞİL",
    });
  }
}

export default TorManager.getInstance();
