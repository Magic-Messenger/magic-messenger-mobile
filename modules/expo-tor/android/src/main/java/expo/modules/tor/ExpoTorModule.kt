package expo.modules.tor

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.InetSocketAddress
import java.net.Proxy
import java.net.URL
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.torproject.jni.TorService
import java.io.File

class ExpoTorModule : Module() {
  private var torService: TorService? = null
  private var isBound = false
  private var bindRequested = false  // Track if we requested a bind
  private var isReceiverRegistered = false
  private val TAG = "ExpoTorModule"
  private val moduleScope = CoroutineScope(Dispatchers.Main + Job())
  private var connectionCheckJob: Job? = null

  private val torServiceConnection =
          object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
              val binder = service as? TorService.LocalBinder
              torService = binder?.getService()
              isBound = true
              Log.d(TAG, "✅ Tor Service Connected")

              // Wait for Tor Control Connection using coroutines
              connectionCheckJob?.cancel() // Cancel any existing job
              connectionCheckJob = moduleScope.launch(Dispatchers.IO) {
                repeat(20) { attempt ->
                  val connection = torService?.getTorControlConnection()
                  Log.d(TAG, "🔍 Checking Tor control connection (attempt ${attempt + 1}/20): ${if (connection != null) "Connected" else "Not connected"}")
                  if (connection != null) {
                    withContext(Dispatchers.Main) {
                      Log.d(TAG, "✅ Tor Control Connection established!")
                      sendEvent("onTorConnected", mapOf("connected" to true))
                    }
                    return@launch
                  }
                  delay(500)
                }
                Log.w(TAG, "⚠️ Tor Control Connection not established after 10 seconds")
              }
            }

            override fun onServiceDisconnected(name: ComponentName?) {
              connectionCheckJob?.cancel()
              connectionCheckJob = null
              torService = null
              isBound = false
              bindRequested = false
              Log.d(TAG, "🔴 Tor Service Disconnected")
              sendEvent("onTorDisconnected", mapOf("connected" to false))
              sendEvent("onTorStatus", mapOf("status" to "OFF"))
            }
          }

  private val statusReceiver =
          object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
              val status = intent?.getStringExtra(TorService.EXTRA_STATUS)
              Log.d(TAG, "📡 Tor Status Update: $status")
              sendEvent("onTorStatus", mapOf("status" to status))
            }
          }

  override fun definition() = ModuleDefinition {
    Name("ExpoTor")

    // Defines event names that the module can send to JavaScript.
    Events("onTorStatus", "onTorConnected", "onTorDisconnected", "onTorError")

    // Cleanup on module destroy
    OnDestroy {
      try {
        // Cancel any pending coroutine jobs
        connectionCheckJob?.cancel()
        connectionCheckJob = null
        Log.d(TAG, "Coroutine jobs cancelled")

        val context = appContext.reactContext

        if (context != null && isReceiverRegistered) {
          try {
            context.unregisterReceiver(statusReceiver)
            isReceiverRegistered = false
            Log.d(TAG, "BroadcastReceiver unregistered in OnDestroy")
          } catch (e: Exception) {
            Log.w(TAG, "Receiver cleanup in OnDestroy", e)
          }
        }

        if (context != null && (isBound || bindRequested)) {
          try {
            context.unbindService(torServiceConnection)
            isBound = false
            bindRequested = false
            Log.d(TAG, "Service unbound in OnDestroy")
          } catch (e: Exception) {
            Log.w(TAG, "Error unbinding in OnDestroy", e)
          }
        }

        torService = null
      } catch (e: Exception) {
        Log.e(TAG, "Error in OnDestroy cleanup", e)
      }
    }

    // Start Tor Service
    AsyncFunction("startTor") { promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("Context is null")

        Log.d(TAG, "Starting Tor service...")

        // Register status receiver (only if not already registered)
        if (!isReceiverRegistered) {
          val filter = IntentFilter(TorService.ACTION_STATUS)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
          } else {
            context.registerReceiver(statusReceiver, filter)
          }
          isReceiverRegistered = true
          Log.d(TAG, "BroadcastReceiver registered")
        }

        // Bind to TorService (BIND_AUTO_CREATE will start the service if needed)
        val intent = Intent(context, TorService::class.java)
        val bound = context.bindService(intent, torServiceConnection, Context.BIND_AUTO_CREATE)
        bindRequested = bound
        Log.d(TAG, "🚀 Service bind requested (auto-create), result: $bound")

        if (!bound) {
          promise.reject("TOR_START_ERROR", "Failed to bind to Tor service", null)
          return@AsyncFunction
        }

        promise.resolve(mapOf("success" to true, "message" to "Tor service starting..."))
      } catch (e: Exception) {
        Log.e(TAG, "Error starting Tor", e)
        promise.reject("TOR_START_ERROR", e.message, e)
      }
    }

    // Stop Tor Service
    AsyncFunction("stopTor") { promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("Context is null")

        Log.d(TAG, "🛑 Stopping Tor service...")

        // Cancel any pending connection check jobs
        connectionCheckJob?.cancel()
        connectionCheckJob = null
        Log.d(TAG, "🛑 Connection check job cancelled")

        // Unbind from service (if we requested a bind, we must unbind)
        if (bindRequested || isBound) {
          try {
            Log.d(TAG, "🛑 Attempting to unbind service (bindRequested: $bindRequested, isBound: $isBound)")
            context.unbindService(torServiceConnection)
            isBound = false
            bindRequested = false
            Log.d(TAG, "🛑 Service unbound successfully")
          } catch (e: Exception) {
            Log.w(TAG, "⚠️ Error unbinding service", e)
            // Reset flags even if unbind failed
            isBound = false
            bindRequested = false
          }
        } else {
          Log.d(TAG, "⚠️ No service to unbind (bindRequested: $bindRequested, isBound: $isBound)")
        }

        // Unregister receiver
        if (isReceiverRegistered) {
          try {
            context.unregisterReceiver(statusReceiver)
            isReceiverRegistered = false
            Log.d(TAG, "🛑 BroadcastReceiver unregistered")
          } catch (e: Exception) {
            Log.w(TAG, "⚠️ Receiver not registered", e)
          }
        }

        torService = null
        Log.d(TAG, "✅ Tor service stopped")

        promise.resolve(mapOf("success" to true, "message" to "Tor service stopped"))
      } catch (e: Exception) {
        Log.e(TAG, "❌ Error stopping Tor", e)
        promise.reject("TOR_STOP_ERROR", "Failed to stop Tor service", e)
      }
    }

    // Get Tor Status
    Function("getTorStatus") { TorService.currentStatus }

    // Get SOCKS Port
    Function("getSocksPort") { torService?.getSocksPort() ?: -1 }

    // Get HTTP Tunnel Port
    Function("getHttpTunnelPort") { torService?.getHttpTunnelPort() ?: -1 }

    // Get Tor Info
    AsyncFunction("getTorInfo") { key: String, promise: Promise ->
      try {
        val info = torService?.getInfo(key)
        if (info != null) {
          promise.resolve(info)
        } else {
          promise.reject("TOR_NOT_READY", "Could not get info for key: $key. Tor may not be ready.", null)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Error getting Tor info", e)
        promise.reject("TOR_CONFIGURATION_ERROR", "Failed to retrieve Tor information", e)
      }
    }

    // Check if Tor is connected
    Function("isTorConnected") { isBound && torService?.getTorControlConnection() != null }

    // Make HTTP request through Tor
    AsyncFunction("makeRequest") { url: String, options: Map<String, Any>?, promise: Promise ->
      try {
        val socksPort = torService?.getSocksPort() ?: -1
        if (socksPort == -1) {
          promise.reject("TOR_NOT_READY", "Tor is not connected yet", null)
          return@AsyncFunction
        }

        // Create SOCKS proxy
        val proxy = Proxy(Proxy.Type.SOCKS, InetSocketAddress("127.0.0.1", socksPort))

        // Create OkHttp client with proxy
        val client =
                OkHttpClient.Builder()
                        .proxy(proxy)
                        .connectTimeout(30, TimeUnit.SECONDS)
                        .readTimeout(30, TimeUnit.SECONDS)
                        .writeTimeout(30, TimeUnit.SECONDS)
                        .build()

        // Parse options
        val method = options?.get("method") as? String ?: "GET"
        val headers = options?.get("headers") as? Map<String, String> ?: emptyMap()
        val body = options?.get("body") as? String
        val formData = options?.get("formData") as? Map<String, Any>

        // Build request
        val requestBuilder = Request.Builder().url(url)

        // Add headers (but exclude Content-Type for multipart, OkHttp will set it with boundary)
        val contentType = headers["Content-Type"]
        val isMultipart = contentType?.contains("multipart/form-data") == true

        headers.forEach { (key, value) ->
          if (!isMultipart || key != "Content-Type") {
            requestBuilder.addHeader(key, value)
          }
        }

        // Add body if present
        if (formData != null && isMultipart) {
          // Handle multipart/form-data
          Log.d(TAG, "📦 Processing formData: $formData")
          val multipartBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)

          formData.forEach { (key, value) ->
            Log.d(TAG, "📦 FormData key: $key, value type: ${value?.javaClass?.name}")
            when (value) {
              is Map<*, *> -> {
                // Handle file upload
                val fileMap = value as Map<String, Any>
                val uri = fileMap["uri"] as? String
                val name = fileMap["name"] as? String ?: "file"
                val type = fileMap["type"] as? String ?: "application/octet-stream"

                Log.d(TAG, "📦 File upload - uri: $uri, name: $name, type: $type")

                if (uri != null) {
                  val file = File(uri.replace("file://", ""))
                  Log.d(TAG, "📦 File path: ${file.absolutePath}, exists: ${file.exists()}, size: ${if (file.exists()) file.length() else 0}")
                  if (file.exists()) {
                    val requestBody = file.asRequestBody(type.toMediaType())
                    multipartBuilder.addFormDataPart(key, name, requestBody)
                    Log.d(TAG, "✅ Added file part: $key = $name")
                  } else {
                    Log.e(TAG, "❌ File does not exist: ${file.absolutePath}")
                  }
                }
              }
              is String -> {
                // Handle regular form field
                multipartBuilder.addFormDataPart(key, value)
                Log.d(TAG, "✅ Added text part: $key = $value")
              }
            }
          }

          val multipartBody = multipartBuilder.build()
          Log.d(TAG, "📦 Multipart body created with ${multipartBody.size} parts")
          requestBuilder.method(method, multipartBody)
        } else if (body != null && (method == "POST" || method == "PUT" || method == "PATCH")) {
          val bodyContentType = contentType ?: "application/json"
          requestBuilder.method(method, body.toRequestBody(bodyContentType.toMediaType()))
        } else {
          requestBuilder.method(method, null)
        }

        val request = requestBuilder.build()

        // Execute request in background using Coroutines
        moduleScope.launch(Dispatchers.IO) {
          try {
            client.newCall(request).execute().use { response ->
              val responseBody = response.body?.string() ?: ""
              val responseHeaders = mutableMapOf<String, String>()
              response.headers.forEach { (name, value) -> responseHeaders[name] = value }

              withContext(Dispatchers.Main) {
                promise.resolve(
                  mapOf(
                    "status" to response.code,
                    "statusText" to response.message,
                    "headers" to responseHeaders,
                    "data" to responseBody,
                    "url" to url
                  )
                )
              }
            }
          } catch (e: Exception) {
            Log.e(TAG, "HTTP request error", e)
            withContext(Dispatchers.Main) {
              promise.reject("HTTP_REQUEST_ERROR", "HTTP request failed: ${e.message}", e)
            }
          }
        }
      } catch (e: Exception) {
        Log.e(TAG, "Request setup error", e)
        promise.reject("REQUEST_SETUP_ERROR", "Failed to setup HTTP request: ${e.message}", e)
      }
    }

    // Enables the module to be used as a native view.
    View(ExpoTorView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: ExpoTorView, url: URL -> view.webView.loadUrl(url.toString()) }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }
  }
}
