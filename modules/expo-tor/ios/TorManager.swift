import Foundation
import Tor

/// Tor ağı kontrolü ve yönetimi
class TorManager: NSObject {
    
    // Singleton instance
    static let shared = TorManager()
    
    // Tor configuration
    private var torThread: TorThread?
    private var torConfiguration: TorConfiguration?
    private var torController: TorController?
    
    // Thread-safe queue for property access
    private let queue = DispatchQueue(label: "com.expotor.manager", attributes: .concurrent)

    // Lock for concurrent startTor protection
    private let startLock = NSLock()

    // Status (private storage)
    private var _isStarted = false
    private var _isConnected = false
    private var _socksPort: Int = 0
    private var _httpTunnelPort: Int = 0

    // Thread-safe public properties
    private(set) var isStarted: Bool {
        get { queue.sync { _isStarted } }
        set { queue.async(flags: .barrier) { self._isStarted = newValue } }
    }

    private(set) var isConnected: Bool {
        get { queue.sync { _isConnected } }
        set { queue.async(flags: .barrier) { self._isConnected = newValue } }
    }

    private(set) var socksPort: Int {
        get { queue.sync { _socksPort } }
        set { queue.async(flags: .barrier) { self._socksPort = newValue } }
    }

    private(set) var httpTunnelPort: Int {
        get { queue.sync { _httpTunnelPort } }
        set { queue.async(flags: .barrier) { self._httpTunnelPort = newValue } }
    }
    
    // Callbacks
    var onStatusChanged: ((String) -> Void)?
    var onConnected: ((Bool) -> Void)?
    var onBootstrapProgress: ((Int) -> Void)?
    
    private override init() {
        super.init()
    }
    
    /// Tor servisini başlat
    func startTor(completion: @escaping (Result<Void, Error>) -> Void) {
        // Prevent concurrent startTor calls
        guard startLock.try() else {
            print("⚠️ [TOR] Start already in progress")
            completion(.success(()))
            return
        }

        defer { startLock.unlock() }

        guard !isStarted else {
            print("⚠️ [TOR] Already started")
            completion(.success(()))
            return
        }

        print("🚀 [TOR] Starting Tor service...")

        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }

            do {
                // Tor data directory
                let dataDir = try self.getTorDataDirectory()
                print("📁 [TOR] Data directory: \(dataDir.path)")

                // Tor configuration
                let config = TorConfiguration()
                config.dataDirectory = dataDir

                // SOCKS port ayarla (otomatik = 0, varsayılan 9050 kullanır)
                config.socksPort = 9050

                // Control port dosyası - önce varsa temizle
                let controlPortFile = dataDir.appendingPathComponent("control_port")
                if FileManager.default.fileExists(atPath: controlPortFile.path) {
                    try? FileManager.default.removeItem(at: controlPortFile)
                    print("🧹 [TOR] Cleaned up old control port file")
                }
                print("🔌 [TOR] Control port file will be: \(controlPortFile.path)")

                // Use TCP control port instead of Unix socket to avoid path length issues
                // Arguments ile control port ve authentication ayarları
                config.arguments = [
                    "--ClientOnly", "1",
                    "--AvoidDiskWrites", "1",
                    "--DisableDebuggerAttachment", "0",
                    "--HTTPTunnelPort", "8118",  // Sabit port kullan (auto yerine)
                    "--ControlPort", "auto",
                    "--ControlPortWriteToFile", controlPortFile.path,
                    "--CookieAuthentication", "1"
                ]

                self.torConfiguration = config
                print("⚙️ [TOR] Configuration created")

                // Tor thread başlat (sadece yoksa oluştur)
                if self.torThread == nil {
                    print("🧵 [TOR] Creating new Tor thread...")
                    self.torThread = TorThread(configuration: config)
                    self.torThread?.start()
                    print("✅ [TOR] Tor thread started")
                } else {
                    // Zaten var, yeniden başlat
                    if self.torThread?.isExecuting == false {
                        print("🔄 [TOR] Restarting existing Tor thread...")
                        self.torThread?.start()
                    } else {
                        print("⚠️ [TOR] Tor thread already executing")
                    }
                }

                // Tor'un control port dosyasını oluşturmasını bekle
                print("⏳ [TOR] Waiting for Tor to create control port file...")
                let maxWaitTime = 10.0 // 10 saniye
                let checkInterval = 0.5 // 500ms
                var elapsed = 0.0

                while elapsed < maxWaitTime {
                    if FileManager.default.fileExists(atPath: controlPortFile.path) {
                        print("✅ [TOR] Control port file created at: \(controlPortFile.path)")
                        break
                    }
                    Thread.sleep(forTimeInterval: checkInterval)
                    elapsed += checkInterval
                }

                if !FileManager.default.fileExists(atPath: controlPortFile.path) {
                    print("❌ [TOR] Control port file not created after \(maxWaitTime) seconds")
                    throw TorError.connectionFailed
                }

                // Control port'a bağlan
                print("🔌 [TOR] Connecting to control port...")
                try self.connectToControlPort()
                print("✅ [TOR] Connected to control port")

                self.isStarted = true
                self.onStatusChanged?("STARTING")
                print("✅ [TOR] Service started - Status: STARTING")

                DispatchQueue.main.async {
                    completion(.success(()))
                }

            } catch {
                print("❌ [TOR] Start error: \(error.localizedDescription)")
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
    
    /// Control port'a bağlan
    private func connectToControlPort() throws {
        guard let config = torConfiguration else {
            print("❌ [TOR] Configuration error - no tor configuration")
            throw TorError.configurationError
        }

        // Control port dosyasının yolunu oluştur
        let controlPortFile = config.dataDirectory!.appendingPathComponent("control_port")
        print("🔌 [TOR] Reading control port from: \(controlPortFile.path)")

        // Control port dosyasını oku (Format: "PORT=9051\n" veya "127.0.0.1:9051")
        guard let portContent = try? String(contentsOf: controlPortFile, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines) else {
            print("❌ [TOR] Failed to read control port file")
            throw TorError.configurationError
        }

        print("📄 [TOR] Control port file content: \(portContent)")

        // Port numarasını parse et
        var port: UInt16 = 0
        if portContent.contains(":") {
            // Format: "127.0.0.1:9051"
            let parts = portContent.split(separator: ":")
            if let lastPart = parts.last, let parsedPort = UInt16(lastPart) {
                port = parsedPort
            }
        } else if portContent.hasPrefix("PORT=") {
            // Format: "PORT=9051"
            let portStr = portContent.replacingOccurrences(of: "PORT=", with: "")
            port = UInt16(portStr) ?? 0
        } else {
            // Sadece port numarası
            port = UInt16(portContent) ?? 0
        }

        guard port > 0 else {
            print("❌ [TOR] Invalid control port: \(portContent)")
            throw TorError.configurationError
        }

        print("🔌 [TOR] Control port: \(port)")

        // Control connection oluştur (TCP port ile)
        let controller = TorController(socketHost: "127.0.0.1", port: port)
        print("🔌 [TOR] TorController created for 127.0.0.1:\(port)")

        // Biraz bekle - connection establish olsun
        Thread.sleep(forTimeInterval: 0.5)

        // Cookie authentication
        var authError: Error?
        var authSuccess = false
        let semaphore = DispatchSemaphore(value: 0)

        print("🔐 [TOR] Authenticating with cookie...")

        // Cookie dosyasını oku
        let cookieFile = config.dataDirectory!.appendingPathComponent("control_auth_cookie")
        if FileManager.default.fileExists(atPath: cookieFile.path) {
            if let cookieData = try? Data(contentsOf: cookieFile) {
                print("🍪 [TOR] Cookie loaded, size: \(cookieData.count) bytes")
                print("🔐 [TOR] Calling authenticate...")
                controller.authenticate(with: cookieData) { success, error in
                    print("🔐 [TOR] Authentication callback received - success: \(success)")
                    authSuccess = success
                    if let error = error {
                        print("❌ [TOR] Authentication error: \(error.localizedDescription)")
                        authError = error
                    } else {
                        print("✅ [TOR] Authentication successful")
                    }
                    semaphore.signal()
                }
                print("🔐 [TOR] Authenticate call made, waiting for callback...")
            } else {
                print("❌ [TOR] Failed to read cookie file")
                throw TorError.configurationError
            }
        } else {
            // Cookie yoksa boş data ile authenticate et
            print("⚠️ [TOR] No cookie file, trying empty auth...")
            controller.authenticate(with: Data()) { success, error in
                print("🔐 [TOR] Authentication callback received - success: \(success)")
                authSuccess = success
                if let error = error {
                    print("❌ [TOR] Authentication error: \(error.localizedDescription)")
                    authError = error
                } else {
                    print("✅ [TOR] Authentication successful")
                }
                semaphore.signal()
            }
        }

        let result = semaphore.wait(timeout: .now() + 30)
        if result == .timedOut {
            print("⏱️ [TOR] Authentication timeout after 30 seconds")
            throw TorError.connectionFailed
        }

        if let error = authError {
            throw error
        }

        self.torController = controller
        print("✅ [TOR] Controller assigned")

        // Bootstrap progress observer
        self.observeBootstrapProgress()
    }
    
    /// Bootstrap progress'i takip et
    private func observeBootstrapProgress() {
        print("🔄 [TOR] Setting up bootstrap observer...")

        torController?.addObserver(forCircuitEstablished: { [weak self] established in
            guard let self = self else { return }

            print("🔄 [TOR] Circuit established callback - established: \(established)")

            if established {
                self.isConnected = true
                self.getSocksPortNumber()
                self.onStatusChanged?("ON")
                self.onConnected?(true)
                print("✅ [TOR] Connected successfully - isConnected: \(self.isConnected)")
            }
        })

        print("🔄 [TOR] Bootstrap observer setup complete")
    }
    
    /// SOCKS ve HTTP Tunnel port numaralarını al
    private func getSocksPortNumber() {
        // Tor.framework'ün modern versiyonunda port bilgisi configuration'dan alınır
        // Eğer otomatik port seçildiyse (0), Tor varsayılan olarak 9050 kullanır
        if let config = torConfiguration {
            // SOCKS port
            let socksPort = config.socksPort ?? 9050
            self.socksPort = Int(socksPort)
            print("🔌 SOCKS Port: \(self.socksPort)")
            
            // HTTP Tunnel port (varsayılan 8118)
            // Not: Tor'un HTTPTunnelPort'u auto ise rastgele port seçer,
            // bunu controller üzerinden öğrenmemiz gerekir
            self.getHTTPTunnelPort()
        } else {
            // Fallback: varsayılan portlar
            self.socksPort = 9050
            self.httpTunnelPort = 8118
            print("🔌 Ports (default) - SOCKS: \(self.socksPort), HTTP: \(self.httpTunnelPort)")
        }
    }
    
    /// HTTP Tunnel portunu al
    private func getHTTPTunnelPort() {
        // Sabit port kullanıyoruz (configuration'da 8118 olarak ayarlandı)
        self.httpTunnelPort = 8118
        print("✅ [TOR] Using fixed HTTP Tunnel Port: \(self.httpTunnelPort)")
    }
    
    /// Tor'u durdur
    func stopTor(completion: @escaping () -> Void) {
        guard isStarted else {
            completion()
            return
        }

        print("🛑 [TOR] Stopping Tor service...")

        torController?.disconnect()
        torThread?.cancel()

        // Clean up control port file
        if let dataDir = torConfiguration?.dataDirectory {
            let controlPortFile = dataDir.appendingPathComponent("control_port")
            let path = controlPortFile.path
            if FileManager.default.fileExists(atPath: path) {
                try? FileManager.default.removeItem(atPath: path)
                print("🧹 [TOR] Cleaned up control port file at: \(path)")
            }
        }

        isStarted = false
        isConnected = false
        socksPort = 0
        httpTunnelPort = 0
        torConfiguration = nil
        torController = nil

        onStatusChanged?("OFF")
        onConnected?(false)

        print("✅ [TOR] Tor service stopped")
        completion()
    }
    
    /// Tor data directory
    private func getTorDataDirectory() throws -> URL {
        let fileManager = FileManager.default
        let appSupport = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        
        let torDir = appSupport.appendingPathComponent("tor", isDirectory: true)
        
        if !fileManager.fileExists(atPath: torDir.path) {
            try fileManager.createDirectory(at: torDir, withIntermediateDirectories: true)
        }
        
        return torDir
    }
    
    /// HTTP Tunnel proxy konfigürasyonu döndür
    func getProxyConfiguration() -> [AnyHashable: Any]? {
        guard isConnected, httpTunnelPort > 0 else {
            print("⚠️ [TOR] Cannot get proxy config - Connected: \(isConnected), HTTP Port: \(httpTunnelPort)")
            return nil
        }
        
        // iOS URLSession için HTTP proxy konfigürasyonu
        // URLSession SOCKS'ı desteklemediği için HTTP Tunnel kullanıyoruz
        let proxyDict: [AnyHashable: Any] = [
            "HTTPEnable": 1,
            "HTTPProxy": "127.0.0.1",
            "HTTPPort": httpTunnelPort,
            "HTTPSEnable": 1,
            "HTTPSProxy": "127.0.0.1",
            "HTTPSPort": httpTunnelPort
        ]
        
        print("✅ [TOR] Proxy config created - HTTP Tunnel Port: \(httpTunnelPort)")
        return proxyDict
    }
}

// MARK: - Errors

enum TorError: Error {
    case configurationError
    case notStarted
    case connectionFailed
    case startError
    case stopError
    case notReady
    case requestSetupError

    var errorCode: String {
        switch self {
        case .configurationError:
            return "TOR_CONFIGURATION_ERROR"
        case .notStarted:
            return "TOR_NOT_STARTED"
        case .connectionFailed:
            return "TOR_CONNECTION_FAILED"
        case .startError:
            return "TOR_START_ERROR"
        case .stopError:
            return "TOR_STOP_ERROR"
        case .notReady:
            return "TOR_NOT_READY"
        case .requestSetupError:
            return "REQUEST_SETUP_ERROR"
        }
    }

    var localizedDescription: String {
        switch self {
        case .configurationError:
            return "Tor configuration error"
        case .notStarted:
            return "Tor is not started"
        case .connectionFailed:
            return "Failed to connect to Tor"
        case .startError:
            return "Failed to start Tor service"
        case .stopError:
            return "Failed to stop Tor service"
        case .notReady:
            return "Tor is not connected yet"
        case .requestSetupError:
            return "Failed to setup HTTP request"
        }
    }
}

