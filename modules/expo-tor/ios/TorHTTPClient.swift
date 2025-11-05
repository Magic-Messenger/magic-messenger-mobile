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
        formData: [String: Any]? = nil,
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

        // Check if this is multipart/form-data
        let isMultipart = headers?["Content-Type"]?.contains("multipart/form-data") == true

        // Headers ekle (multipart için Content-Type'ı sonra ayarlayacağız)
        if let headers = headers {
            for (key, value) in headers {
                if !isMultipart || key != "Content-Type" {
                    request.setValue(value, forHTTPHeaderField: key)
                }
            }
        }

        // FormData varsa multipart body oluştur
        if let formData = formData, isMultipart {
            print("📦 [TOR iOS] Processing formData: \(formData)")
            let boundary = "Boundary-\(UUID().uuidString)"
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.httpBody = createMultipartBody(formData: formData, boundary: boundary)
        }
        // Body ekle
        else if let body = body {
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

    /// Multipart body oluştur
    private func createMultipartBody(formData: [String: Any], boundary: String) -> Data {
        var body = Data()

        for (key, value) in formData {
            // Dosya mı kontrol et
            if let fileData = value as? [String: Any],
               let uriString = fileData["uri"] as? String,
               let fileName = fileData["name"] as? String,
               let mimeType = fileData["type"] as? String {

                print("📦 [TOR iOS] Processing file: \(fileName), uri: \(uriString)")

                // URI'yi URL'e çevir
                let cleanUri = uriString.replacingOccurrences(of: "file://", with: "")
                guard let fileURL = URL(string: "file://\(cleanUri)") else {
                    print("❌ [TOR iOS] Invalid file URL: \(cleanUri)")
                    continue
                }

                // Dosyayı oku
                guard let fileContent = try? Data(contentsOf: fileURL) else {
                    print("❌ [TOR iOS] Cannot read file at: \(fileURL.path)")
                    continue
                }

                print("✅ [TOR iOS] File loaded: \(fileName), size: \(fileContent.count) bytes")

                // Multipart boundary
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
                body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
                body.append(fileContent)
                body.append("\r\n".data(using: .utf8)!)

            } else if let stringValue = value as? String {
                // String değer
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(stringValue)\r\n".data(using: .utf8)!)
            }
        }

        // Son boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        print("📦 [TOR iOS] Multipart body created, total size: \(body.count) bytes")
        return body
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

