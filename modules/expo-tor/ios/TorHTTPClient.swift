import Foundation

/// Tor üzerinden HTTP istekleri yapmak için helper
class TorHTTPClient {
    
    static let shared = TorHTTPClient()
    
    private init() {}
    
    /// Tor üzerinden HTTP request yap
    func makeRequest(
        url: String,
        method: String = "GET",
        headers: [String: String]? = nil,
        body: String? = nil,
        completion: @escaping (Result<HTTPResponse, Error>) -> Void
    ) {
        // Tor bağlı mı kontrol et
        guard TorManager.shared.isConnected else {
            print("❌ [TOR] Not connected - isConnected: \(TorManager.shared.isConnected), isStarted: \(TorManager.shared.isStarted)")
            completion(.failure(TorError.notReady))
            return
        }
        
        guard let requestURL = URL(string: url) else {
            completion(.failure(URLError(.badURL)))
            return
        }
        
        // URLRequest oluştur
        var request = URLRequest(url: requestURL)
        request.httpMethod = method
        
        // Headers ekle
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        // Body ekle
        if let body = body {
            request.httpBody = body.data(using: .utf8)
        }
        
        // SOCKS proxy konfigürasyonu
        let sessionConfig = URLSessionConfiguration.ephemeral
        if let proxyConfig = TorManager.shared.getProxyConfiguration() {
            print("🔧 [TOR] Proxy Config: \(proxyConfig)")
            sessionConfig.connectionProxyDictionary = proxyConfig
        } else {
            print("❌ [TOR] No proxy config available!")
        }
        
        // URLSession oluştur
        let session = URLSession(configuration: sessionConfig)
        
        // Request yap
        let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(URLError(.badServerResponse)))
                return
            }
            
            let responseData = data ?? Data()
            let responseString = String(data: responseData, encoding: .utf8) ?? ""
            
            // Headers'ı dictionary'ye çevir
            var responseHeaders: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                if let key = key as? String, let value = value as? String {
                    responseHeaders[key] = value
                }
            }
            
            let response = HTTPResponse(
                status: httpResponse.statusCode,
                statusText: HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode),
                headers: responseHeaders,
                data: responseString,
                url: url
            )
            
            completion(.success(response))
        }
        
        task.resume()
    }
}

// MARK: - Response Model

struct HTTPResponse {
    let status: Int
    let statusText: String
    let headers: [String: String]
    let data: String
    let url: String
    
    func toDictionary() -> [String: Any] {
        return [
            "status": status,
            "statusText": statusText,
            "headers": headers,
            "data": data,
            "url": url
        ]
    }
}

