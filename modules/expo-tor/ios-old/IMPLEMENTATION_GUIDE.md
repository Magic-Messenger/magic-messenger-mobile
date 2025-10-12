# ExpoTor iOS Implementation Guide

## Overview

This guide explains how to integrate and use the ExpoTor iOS module, which provides complete Tor network functionality using the iCepa Tor.framework.

## Architecture

### Components

1. **ExpoTorModule.swift** - Main module implementation

   - Manages Tor lifecycle (start/stop)
   - Handles Tor configuration and directory setup
   - Provides SOCKS proxy for network requests
   - Emits events for status updates

2. **TORThread** - Background Tor process

   - Runs Tor in a separate thread (non-blocking)
   - Automatically manages Tor daemon lifecycle
   - Handles bootstrap process

3. **TORController** - Control connection to Tor

   - Communicates with Tor via control socket
   - Retrieves status and configuration info
   - Monitors bootstrap progress

4. **URLSession with SOCKS Proxy** - HTTP requests
   - Configured with SOCKS5 proxy pointing to Tor
   - Automatically routes traffic through Tor network

## Installation Steps

### 1. Download Tor.framework

Download the latest Tor.framework from the iCepa releases:

```bash
# Visit: https://github.com/iCepa/Tor.framework/releases
# Download: Tor.xcframework.zip or Tor.framework.zip

# Extract and place in your project
mkdir -p modules/expo-tor/ios/Frameworks
# Move Tor.framework or Tor.xcframework to this directory
```

**Recommended approach**: Use the pre-built XCFramework from iCepa releases (includes all architectures)

### 2. Alternative: Build Tor.framework from Source

If you need to build from source:

```bash
git clone https://github.com/iCepa/Tor.framework.git
cd Tor.framework
./build-all.sh
```

### 3. Verify Podspec Configuration

The `ExpoTor.podspec` is already configured to use vendored frameworks. Ensure the path is correct:

```ruby
s.vendored_frameworks = 'Frameworks/Tor.framework'
# or for XCFramework:
# s.vendored_frameworks = 'Frameworks/Tor.xcframework'
```

### 4. Install Dependencies

```bash
# From your React Native project root
cd ios
pod install
cd ..
```

### 5. Add Required GeoIP Files (Optional but Recommended)

Tor uses GeoIP databases for optimal routing. Download from:

```
https://github.com/iCepa/Tor.framework/tree/main/Tor/geoip
```

Add `geoip` and `geoip6` files to your iOS app bundle:

1. Drag files into Xcode project
2. Ensure "Copy Bundle Resources" includes them

## API Reference

### Methods

All methods match the Android API exactly for cross-platform compatibility.

#### `startTor(): Promise<{ success: boolean, message: string }>`

Starts the Tor service in the background.

**Example:**

```typescript
import ExpoTorModule from "expo-tor";

const result = await ExpoTorModule.startTor();
console.log(result.message); // "Tor service starting..."
```

**Implementation Details:**

- Creates Tor data directories in app's Application Support folder
- Initializes TORConfiguration with dynamic SOCKS port (auto-assigned to avoid conflicts)
- Starts TORThread in background
- Establishes control connection with retry logic (up to 20 seconds)
- Monitors bootstrap progress via TORController

#### `stopTor(): Promise<{ success: boolean, message: string }>`

Stops the Tor service and cleans up resources.

**Example:**

```typescript
await ExpoTorModule.stopTor();
```

#### `getTorStatus(): string`

Returns current Tor status. Possible values:

- `"STOPPED"` - Tor is not running
- `"STARTING"` - Tor is initializing
- `"BOOTSTRAPPING: X%"` - Tor is connecting (X = progress 0-100)
- `"CONNECTED"` - Tor is fully connected and ready

**Example:**

```typescript
const status = ExpoTorModule.getTorStatus();
console.log(status); // "CONNECTED"
```

#### `getSocksPort(): number`

Returns the SOCKS proxy port number. Returns `-1` if Tor is not running.

**Example:**

```typescript
const port = ExpoTorModule.getSocksPort();
console.log(port); // 9050 (or dynamically assigned port)
```

#### `getHttpTunnelPort(): number`

Returns the HTTP tunnel (control) port. Returns `-1` if not running.

#### `isTorConnected(): boolean`

Returns `true` if Tor is connected and ready for requests.

**Example:**

```typescript
if (ExpoTorModule.isTorConnected()) {
  // Safe to make requests
}
```

#### `getTorInfo(key: string): Promise<string>`

Retrieves information from Tor using the GETINFO command.

**Common keys:**

- `"version"` - Tor version
- `"status/bootstrap-phase"` - Current bootstrap status
- `"net/listeners/socks"` - SOCKS listener info
- `"circuit-status"` - Current circuit status

**Example:**

```typescript
const version = await ExpoTorModule.getTorInfo("version");
console.log(version); // "Tor 0.4.8.12"
```

#### `makeRequest(url: string, options?: TorRequestOptions): Promise<TorRequestResponse>`

Makes an HTTP request through the Tor SOCKS proxy.

**Request Options:**

```typescript
type TorRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
  headers?: Record<string, string>;
  body?: string;
};
```

**Response:**

```typescript
type TorRequestResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  url: string;
};
```

**Example:**

```typescript
const response = await ExpoTorModule.makeRequest(
  "https://check.torproject.org/api/ip",
  {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  }
);

console.log(JSON.parse(response.data));
// { "IsTor": true, "IP": "xxx.xxx.xxx.xxx" }
```

**Implementation Details:**

- Uses URLSession with SOCKS proxy configuration
- Automatically routes through 127.0.0.1:socksPort
- Timeout: 30 seconds
- Runs on background queue (non-blocking)

### Events

Subscribe to events using Expo's event emitter:

```typescript
import { EventEmitter } from "expo-modules-core";
import ExpoTorModule from "expo-tor";

const emitter = new EventEmitter(ExpoTorModule);

// Status updates
emitter.addListener("onTorStatus", (event) => {
  console.log("Tor Status:", event.status);
});

// Connected
emitter.addListener("onTorConnected", (event) => {
  console.log("Tor Connected:", event.connected);
});

// Disconnected
emitter.addListener("onTorDisconnected", (event) => {
  console.log("Tor Disconnected:", event.connected);
});

// Errors
emitter.addListener("onTorError", (event) => {
  console.error("Tor Error:", event.error);
});
```

## Implementation Notes

### 1. Background Thread Management

Tor runs on a background thread using `TORThread`:

```swift
torThread = TORThread(configuration: config)
torThread?.start()
```

This ensures:

- UI never blocks
- Tor initializes asynchronously
- Clean lifecycle management

### 2. Directory Structure

Tor creates the following directory structure:

```
Application Support/
└── tor/
    ├── data/              # Tor state and cache
    │   └── control_auth_cookie
    ├── cache/             # Additional cache
    └── control.socket     # Unix socket for control connection
```

### 3. SOCKS Proxy Configuration

The module uses dynamic port assignment (port 0) to avoid conflicts:

```swift
config.socksPort = 0  // Auto-assign
```

After Tor starts, the actual port is retrieved via:

```swift
controller.getInfoForKeys(["net/listeners/socks"])
```

### 4. Control Connection with Retry Logic

Connection establishment includes retry logic:

- Max attempts: 40 (20 seconds total)
- Retry interval: 500ms
- Initial delay: 1 second (allows Tor to initialize)

### 5. URLSession SOCKS Proxy

HTTP requests use URLSession with SOCKS configuration:

```swift
sessionConfig.connectionProxyDictionary = [
  kCFNetworkProxiesSOCKSEnable: true,
  kCFNetworkProxiesSOCKSProxy: "127.0.0.1",
  kCFNetworkProxiesSOCKSPort: socksPort,
  kCFProxyTypeKey: kCFProxyTypeSOCKS
]
```

This routes all network traffic through Tor's SOCKS proxy automatically.

### 6. Bootstrap Monitoring

The module monitors bootstrap progress in real-time:

```swift
controller.addObserver(forStatusEvents: { (type, severity, action, arguments) -> Bool in
  if action == "BOOTSTRAP" {
    if let progress = arguments?["PROGRESS"] {
      // Send status update
      sendEvent("onTorStatus", ["status": "BOOTSTRAPPING: \(progress)%"])
    }
  }
  return true
})
```

## Testing

### 1. Verify Tor Connection

```typescript
// Test if IP changes after connecting to Tor
const checkIP = async () => {
  // Regular request (without Tor)
  const normalResponse = await fetch("https://api.ipify.org?format=json");
  const normalIP = await normalResponse.json();
  console.log("Normal IP:", normalIP.ip);

  // Start Tor
  await ExpoTorModule.startTor();

  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Request through Tor
  const torResponse = await ExagepoTorModule.makeRequest(
    "https://api.ipify.org?format=json"
  );
  const torIP = JSON.parse(torResponse.data);
  console.log("Tor IP:", torIP.ip);

  // IPs should be different
  console.log("IPs match:", normalIP.ip === torIP.ip); // Should be false
};
```

### 2. Test Tor Project Check

```typescript
const checkTorConnection = async () => {
  const response = await ExpoTorModule.makeRequest(
    "https://check.torproject.org/api/ip"
  );
  const result = JSON.parse(response.data);
  console.log("Is using Tor:", result.IsTor); // Should be true
};
```

## Troubleshooting

### Issue: "Tor controller not connected"

**Solution:**

- Ensure `startTor()` has completed before making requests
- Check that `isTorConnected()` returns `true`
- Listen to `onTorConnected` event before making requests

### Issue: "Failed to create Tor controller"

**Possible causes:**

- Tor.framework not properly linked
- Missing vendored framework in podspec
- Framework not added to "Copy Bundle Resources"

**Solution:**

```bash
cd ios
pod deintegrate
pod install
```

### Issue: HTTP requests fail with timeout

**Possible causes:**

- Tor not fully bootstrapped
- Network restrictions blocking Tor
- Firewall blocking SOCKS connections

**Solution:**

- Wait for `onTorConnected` event
- Check `getTorStatus()` shows "CONNECTED"
- Increase timeout in URLSession configuration

### Issue: "Could not find application support directory"

**Solution:**

- Ensure app has proper permissions
- Check iOS simulator/device has storage available

## Performance Considerations

1. **Startup Time**: Tor takes 5-15 seconds to bootstrap fully

   - Listen to `onTorStatus` events for progress
   - Show loading indicator to user

2. **Request Latency**: Tor adds ~1-5 seconds latency per request

   - Expect slower response times vs. direct connections
   - Use appropriate timeout values (30s recommended)

3. **Memory Usage**: Tor requires ~50-100MB RAM

   - Consider stopping Tor when not needed
   - Monitor memory in production apps

4. **Battery Impact**: Tor uses additional CPU/network
   - Implement connection pooling
   - Reuse Tor instance across requests
   - Stop Tor when app backgrounds (optional)

## Security Best Practices

1. **Always validate SSL certificates** when using Tor
2. **Don't mix Tor and non-Tor requests** for the same session
3. **Clear sensitive data** when stopping Tor
4. **Use HTTPS** even through Tor (defense in depth)
5. **Don't leak user info** in request headers/user-agents

## Cross-Platform API Parity

The iOS implementation maintains 100% API parity with Android:

| Function            | iOS | Android | Notes                         |
| ------------------- | --- | ------- | ----------------------------- |
| startTor()          | ✅  | ✅      | Same return structure         |
| stopTor()           | ✅  | ✅      | Same return structure         |
| getTorStatus()      | ✅  | ✅      | Same status strings           |
| getSocksPort()      | ✅  | ✅      | Returns -1 when not running   |
| getHttpTunnelPort() | ✅  | ✅      | Returns -1 when not running   |
| getTorInfo()        | ✅  | ✅      | Same GETINFO keys             |
| isTorConnected()    | ✅  | ✅      | Same boolean logic            |
| makeRequest()       | ✅  | ✅      | Same request/response format  |
| Events              | ✅  | ✅      | Same event names and payloads |

## Example: Complete Integration

```typescript
import { useEffect, useState } from "react";
import { EventEmitter } from "expo-modules-core";
import ExpoTorModule from "expo-tor";

export function useTor() {
  const [status, setStatus] = useState("STOPPED");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const emitter = new EventEmitter(ExpoTorModule);

    const statusListener = emitter.addListener("onTorStatus", (event) => {
      setStatus(event.status);
    });

    const connectedListener = emitter.addListener("onTorConnected", () => {
      setConnected(true);
    });

    const disconnectedListener = emitter.addListener(
      "onTorDisconnected",
      () => {
        setConnected(false);
      }
    );

    return () => {
      statusListener.remove();
      connectedListener.remove();
      disconnectedListener.remove();
    };
  }, []);

  const start = async () => {
    try {
      const result = await ExpoTorModule.startTor();
      console.log(result.message);
    } catch (error) {
      console.error("Failed to start Tor:", error);
    }
  };

  const stop = async () => {
    try {
      await ExpoTorModule.stopTor();
    } catch (error) {
      console.error("Failed to stop Tor:", error);
    }
  };

  const makeRequest = async (url: string) => {
    if (!connected) {
      throw new Error("Tor not connected");
    }
    return ExpoTorModule.makeRequest(url);
  };

  return {
    status,
    connected,
    start,
    stop,
    makeRequest,
  };
}
```

## Support

For issues specific to:

- **ExpoTor module**: Check module implementation
- **Tor.framework**: Visit https://github.com/iCepa/Tor.framework
- **Tor network**: Visit https://www.torproject.org

## License

Tor.framework is provided by iCepa under BSD license.
ExpoTor module implementation follows your project's license.
