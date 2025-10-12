import ExpoModulesCore
@preconcurrency import Tor

/**
 * ExpoTorModule - iOS Implementation
 *
 * This module provides complete Tor network functionality for iOS using the Tor.framework
 * from iCepa (https://github.com/iCepa/Tor.framework).
 *
 * Key Features:
 * - Background Tor thread management using TORThread
 * - SOCKS5 proxy configuration for network requests
 * - Event-based status updates (onTorStatus, onTorConnected, onTorDisconnected, onTorError)
 * - HTTP request proxy through Tor using URLSession with SOCKS proxy
 * - Complete API parity with Android implementation
 *
 * Architecture:
 * - TORThread runs Tor in background (non-blocking)
 * - TORController manages Tor control connection
 * - URLSession configured with SOCKS proxy for makeRequest
 * - All async operations handled on background threads
 */

public class ExpoTorModule: Module {

  // MARK: - Properties

  /// Tor thread instance that runs Tor in the background
  private var torThread: TorThread?

  /// Tor controller for communicating with the Tor process
  private var torController: TorController?

  /// Configuration for Tor
  private var torConfiguration: TorConfiguration?

  /// Current connection status
  private var isConnected: Bool = false

  /// Current Tor status string
  private var currentStatus: String = "STOPPED"

  /// SOCKS port for proxy connections (default 9050, but dynamically assigned)
  private var socksPort: Int = 9050

  /// HTTP tunnel port (control port)
  private var httpTunnelPort: Int = 9051

  /// Queue for background operations
  private let torQueue = DispatchQueue(label: "expo.tor.background", qos: .userInitiated)

  // MARK: - Module Definition

  public func definition() -> ModuleDefinition {
    Name("ExpoTor")

    // Define event names that match Android implementation exactly
    Events("onTorStatus", "onTorConnected", "onTorDisconnected", "onTorError")

    // MARK: - Start Tor
    /**
     * Starts the Tor service in background
     * Returns: Promise<{ success: boolean, message: string }>
     */
    AsyncFunction("startTor") { (promise: Promise) in
      self.torQueue.async {
        do {
          // Check if already running
          if self.torThread != nil {
            DispatchQueue.main.async {
              promise.resolve([
                "success": true,
                "message": "Tor is already running"
              ])
            }
            return
          }

          // Initialize Tor configuration
          try self.initializeTorConfiguration()

          // Create and start Tor thread
          guard let config = self.torConfiguration else {
            throw NSError(domain: "ExpoTor", code: 1, userInfo: [
              NSLocalizedDescriptionKey: "Failed to create Tor configuration"
            ])
          }

          self.torThread = TorThread(configuration: config)

          // Start Tor thread
          self.torThread?.start()

          self.currentStatus = "STARTING"
          self.sendEvent("onTorStatus", ["status": "STARTING"])

          // Wait for Tor to start and establish control connection
          self.establishControlConnection { success in
            if success {
              DispatchQueue.main.async {
                promise.resolve([
                  "success": true,
                  "message": "Tor service starting..."
                ])
              }
            } else {
              DispatchQueue.main.async {
                promise.reject("TOR_START_ERROR", "Failed to establish Tor control connection")
              }
            }
          }

        } catch {
          DispatchQueue.main.async {
            promise.reject("TOR_START_ERROR", error.localizedDescription)
          }
        }
      }
    }

    // MARK: - Stop Tor
    /**
     * Stops the Tor service
     * Returns: Promise<{ success: boolean, message: string }>
     */
    AsyncFunction("stopTor") { (promise: Promise) in
      self.torQueue.async {
        // Disconnect controller
        if let controller = self.torController, controller.isConnected {
          controller.disconnect()
        }

        // Cancel Tor thread
        self.torThread?.cancel()
        self.torThread = nil
        self.torController = nil

        self.isConnected = false
        self.currentStatus = "STOPPED"

        self.sendEvent("onTorDisconnected", ["connected": false])

        DispatchQueue.main.async {
          promise.resolve([
            "success": true,
            "message": "Tor service stopped"
          ])
        }
      }
    }

    // MARK: - Get Tor Status
    /**
     * Returns current Tor status as string
     * Synchronous function
     */
    Function("getTorStatus") { () -> String in
      return self.currentStatus
    }

    // MARK: - Get SOCKS Port
    /**
     * Returns the SOCKS proxy port number
     * Returns -1 if not available
     * Synchronous function
     */
    Function("getSocksPort") { () -> Int in
      return self.socksPort
    }

    // MARK: - Get HTTP Tunnel Port
    /**
     * Returns the HTTP tunnel (control) port number
     * Returns -1 if not available
     * Synchronous function
     */
    Function("getHttpTunnelPort") { () -> Int in
      return self.httpTunnelPort
    }

    // MARK: - Get Tor Info
    /**
     * Gets information from Tor using GETINFO command
     * @param key: The info key to query (e.g., "version", "status/bootstrap-phase")
     * Returns: Promise<string>
     */
    AsyncFunction("getTorInfo") { (key: String, promise: Promise) in
      self.torQueue.async {
        guard let controller = self.torController, controller.isConnected else {
          DispatchQueue.main.async {
            promise.reject("TOR_INFO_ERROR", "Tor controller not connected")
          }
          return
        }

        // Use GETINFO command to retrieve information
        // Note: getInfoForKeys returns [String] array
        controller.getInfoForKeys([key]) { response in
          if let value = response.first {
            DispatchQueue.main.async {
              promise.resolve(value)
            }
          } else {
            DispatchQueue.main.async {
              promise.reject("TOR_INFO_ERROR", "Could not get info for key: \(key)")
            }
          }
        }
      }
    }

    // MARK: - Is Tor Connected
    /**
     * Checks if Tor is connected and ready
     * Synchronous function
     */
    Function("isTorConnected") { () -> Bool in
      return self.isConnected && self.torController?.isConnected == true
    }

    // MARK: - Make Request
    /**
     * Makes an HTTP request through the Tor SOCKS proxy
     * @param url: The URL to request
     * @param options: Optional request options (method, headers, body)
     * Returns: Promise<TorRequestResponse>
     */
    AsyncFunction("makeRequest") { (url: String, options: [String: Any]?, promise: Promise) in
      self.torQueue.async {
        // Check if Tor is ready
        guard self.isConnected, self.socksPort > 0 else {
          DispatchQueue.main.async {
            promise.reject("TOR_NOT_READY", "Tor is not connected yet")
          }
          return
        }

        // Parse options
        let method = options?["method"] as? String ?? "GET"
        let headers = options?["headers"] as? [String: String] ?? [:]
        let body = options?["body"] as? String

        // Create URL
        guard let requestUrl = URL(string: url) else {
          DispatchQueue.main.async {
            promise.reject("INVALID_URL", "Invalid URL: \(url)")
          }
          return
        }

        // Configure URLSession with SOCKS proxy
        // Using string keys for iOS compatibility
        let sessionConfig = URLSessionConfiguration.ephemeral
        sessionConfig.connectionProxyDictionary = [
          "SOCKSEnable": 1,
          "SOCKSProxy": "127.0.0.1",
          "SOCKSPort": self.socksPort
        ] as [String: Any]

        sessionConfig.timeoutIntervalForRequest = 30
        sessionConfig.timeoutIntervalForResource = 30

        let session = URLSession(configuration: sessionConfig)

        // Create request
        var request = URLRequest(url: requestUrl)
        request.httpMethod = method

        // Add headers
        for (key, value) in headers {
          request.setValue(value, forHTTPHeaderField: key)
        }

        // Add body if present
        if let bodyString = body, ["POST", "PUT", "PATCH"].contains(method) {
          request.httpBody = bodyString.data(using: .utf8)
          if request.value(forHTTPHeaderField: "Content-Type") == nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
          }
        }

        // Execute request
        let task = session.dataTask(with: request) { data, response, error in
          if let error = error {
            DispatchQueue.main.async {
              promise.reject("HTTP_REQUEST_ERROR", error.localizedDescription)
            }
            return
          }

          guard let httpResponse = response as? HTTPURLResponse else {
            DispatchQueue.main.async {
              promise.reject("HTTP_REQUEST_ERROR", "Invalid response")
            }
            return
          }

          // Parse response
          let responseData = data != nil ? String(data: data!, encoding: .utf8) ?? "" : ""

          // Convert headers to dictionary
          var responseHeaders: [String: String] = [:]
          for (key, value) in httpResponse.allHeaderFields {
            if let keyString = key as? String, let valueString = value as? String {
              responseHeaders[keyString] = valueString
            }
          }

          // Get status text
          let statusText = HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode)

          // Resolve with response
          DispatchQueue.main.async {
            promise.resolve([
              "status": httpResponse.statusCode,
              "statusText": statusText,
              "headers": responseHeaders,
              "data": responseData,
              "url": url
            ])
          }
        }

        task.resume()
      }
    }

    // MARK: - View Definition (for compatibility)
    View(ExpoTorView.self) {
      Prop("url") { (view: ExpoTorView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }
      Events("onLoad")
    }
  }

  // MARK: - Private Helper Methods

  /**
   * Initializes Tor configuration with proper directories and settings
   * Creates necessary directories in app's documents folder
   */
  private func initializeTorConfiguration() throws {
    // Get app support directory for Tor data
    guard let appSupportDir = FileManager.default.urls(
      for: .applicationSupportDirectory,
      in: .userDomainMask
    ).first else {
      throw NSError(domain: "ExpoTor", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "Could not find application support directory"
      ])
    }

    // Create Tor directory structure
    let torDir = appSupportDir.appendingPathComponent("tor", isDirectory: true)
    let dataDir = torDir.appendingPathComponent("data", isDirectory: true)
    let cacheDir = torDir.appendingPathComponent("cache", isDirectory: true)

    // Create directories if they don't exist
    try FileManager.default.createDirectory(at: torDir, withIntermediateDirectories: true)
    try FileManager.default.createDirectory(at: dataDir, withIntermediateDirectories: true)
    try FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)

    // Create Tor configuration
    let config = TorConfiguration()
    config.dataDirectory = dataDir
    config.controlSocket = torDir.appendingPathComponent("control.socket")

    // Configure SOCKS port (use 0 for auto-assign to avoid conflicts)
    config.socksPort = 0 // Will be dynamically assigned

    // Additional Tor options for better connectivity
    config.options = [
      "Log": "notice stdout",
      "GeoIPFile": Bundle.main.path(forResource: "geoip", ofType: nil) ?? "",
      "GeoIPv6File": Bundle.main.path(forResource: "geoip6", ofType: nil) ?? ""
    ]

    // Store configuration
    self.torConfiguration = config

    // The actual SOCKS port will be retrieved after connection
  }

  /**
   * Establishes control connection to Tor and monitors bootstrap progress
   * Sends events to JavaScript as Tor bootstraps
   */
  private func establishControlConnection(completion: @escaping (Bool) -> Void) {
    guard let config = self.torConfiguration,
          let controlSocket = config.controlSocket else {
      completion(false)
      return
    }

    // Retry logic for establishing connection
    let maxAttempts = 40 // 20 seconds total (500ms * 40)

    func attemptConnection(currentAttempt: Int) {
      let attempts = currentAttempt + 1

      // Create controller (TorController initializer is not optional in newer versions)
      let controller = TorController(socketURL: controlSocket)

      // Try to connect
      do {
        try controller.connect()

        // Authenticate (no password needed for socket)
        guard let dataDir = config.dataDirectory else {
          self.sendEvent("onTorError", ["error": "Data directory not configured"])
          completion(false)
          return
        }

        let cookiePath = dataDir.appendingPathComponent("control_auth_cookie")
        let cookie = try Data(contentsOf: cookiePath)

        controller.authenticate(with: cookie) { [weak self] success, error in
          guard let self = self else { return }

          if success {
            self.torController = controller

            // Get actual SOCKS port
            controller.getInfoForKeys(["net/listeners/socks"]) { response in
              if let socksInfo = response.first,
                 let portRange = socksInfo.range(of: ":(\\d+)", options: .regularExpression) {
                let portString = String(socksInfo[portRange]).replacingOccurrences(of: ":", with: "")
                self.socksPort = Int(portString) ?? 9050
              }
            }

            // Monitor bootstrap progress
            self.monitorBootstrapProgress()

            completion(true)
          } else {
            self.sendEvent("onTorError", ["error": error?.localizedDescription ?? "Authentication failed"])
            completion(false)
          }
        }
      } catch {
        if attempts < maxAttempts {
          // Wait and retry
          DispatchQueue.global().asyncAfter(deadline: .now() + 0.5) {
            attemptConnection(currentAttempt: attempts)
          }
        } else {
          self.sendEvent("onTorError", ["error": error.localizedDescription])
          completion(false)
        }
      }
    }

    // Start first attempt after short delay to let Tor initialize
    DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
      attemptConnection(currentAttempt: 0)
    }
  }

  /**
   * Monitors Tor bootstrap progress and sends status updates
   * Updates connection status when bootstrap completes
   */
  private func monitorBootstrapProgress() {
    guard let controller = self.torController else { return }

    // Add observer for bootstrap events
    controller.addObserver(forStatusEvents: { (type, severity, action, arguments) -> Bool in

      // Check bootstrap progress
      if action == "BOOTSTRAP" {
        if let progress = arguments?["PROGRESS"] {
          self.currentStatus = "BOOTSTRAPPING: \(progress)%"
          self.sendEvent("onTorStatus", ["status": self.currentStatus])

          // Check if fully bootstrapped (100%)
          if progress == "100" {
            self.isConnected = true
            self.currentStatus = "CONNECTED"
            self.sendEvent("onTorStatus", ["status": "CONNECTED"])
            self.sendEvent("onTorConnected", ["connected": true])
          }
        }
      }

      // Return true to continue receiving events
      return true
    })

    // Get initial bootstrap status
    controller.getInfoForKeys(["status/bootstrap-phase"]) { [weak self] response in
      guard let self = self else { return }
      if let phase = response.first {
        self.sendEvent("onTorStatus", ["status": phase])
      }
    }
  }
}
