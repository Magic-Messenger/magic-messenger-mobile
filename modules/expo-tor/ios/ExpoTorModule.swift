import ExpoModulesCore

public class ExpoTorModule: Module {
  
  private let torManager = TorManager.shared
  
  public func definition() -> ModuleDefinition {
    Name("ExpoTor")

    // Event names
    Events("onTorStatus", "onTorConnected", "onTorDisconnected", "onTorError")
    
    // Lifecycle
    OnCreate {
      self.setupTorCallbacks()
    }

    // Start Tor
    AsyncFunction("startTor") { (promise: Promise) in
      self.torManager.startTor { result in
        switch result {
        case .success:
          promise.resolve([
            "success": true,
            "message": "Tor service starting..."
          ])
        case .failure(let error):
          let errorCode = (error as? TorError)?.errorCode ?? "TOR_START_ERROR"
          promise.reject(errorCode, error.localizedDescription)
        }
      }
    }

    // Stop Tor
    AsyncFunction("stopTor") { (promise: Promise) in
      self.torManager.stopTor {
        promise.resolve([
          "success": true,
          "message": "Tor service stopped"
        ])
      }
    }

    // Get Tor Status
    Function("getTorStatus") { () -> String in
      if self.torManager.isConnected {
        return "ON"
      } else if self.torManager.isStarted {
        return "STARTING"
      } else {
        return "OFF"
      }
    }

    // Get SOCKS Port
    Function("getSocksPort") { () -> Int in
      return self.torManager.socksPort
    }

    // Get HTTP Tunnel Port (iOS doesn't have this, return -1)
    Function("getHttpTunnelPort") { () -> Int in
      return self.torManager.httpTunnelPort
    }

    // Get Tor Info (Simplified for iOS)
    AsyncFunction("getTorInfo") { (key: String, promise: Promise) in
      // iOS Tor.framework doesn't expose full GETINFO, return basic info
      promise.resolve("Not available on iOS")
    }

    // Check if Tor is connected
    Function("isTorConnected") { () -> Bool in
      return self.torManager.isConnected
    }

    // Make HTTP request through Tor
    AsyncFunction("makeRequest") { (url: String, options: [String: Any]?, promise: Promise) in
      let method = options?["method"] as? String ?? "GET"
      let headers = options?["headers"] as? [String: String]
      let body = options?["body"] as? String
      let formData = options?["formData"] as? [String: Any]

      TorHTTPClient.shared.makeRequest(
        url: url,
        method: method,
        headers: headers,
        body: body,
        formData: formData
      ) { result in
        switch result {
        case .success(let response):
          promise.resolve(response.toDictionary())
        case .failure(let error):
          let errorCode = (error as? TorError)?.errorCode ?? "HTTP_REQUEST_ERROR"
          promise.reject(errorCode, error.localizedDescription)
        }
      }
    }

    // View support
    View(ExpoTorView.self) {
      Prop("url") { (view: ExpoTorView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }
      Events("onLoad")
    }
  }
  
  // Setup Tor callbacks
  private func setupTorCallbacks() {
    torManager.onStatusChanged = { [weak self] status in
      self?.sendEvent("onTorStatus", ["status": status])
    }
    
    torManager.onConnected = { [weak self] connected in
      if connected {
        self?.sendEvent("onTorConnected", ["connected": true])
      } else {
        self?.sendEvent("onTorDisconnected", ["connected": false])
      }
    }
  }
}
