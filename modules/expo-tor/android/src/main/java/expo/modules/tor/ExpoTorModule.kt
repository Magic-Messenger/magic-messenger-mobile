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
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.torproject.jni.TorService

class ExpoTorModule : Module() {
  private var torService: TorService? = null
  private var isBound = false
  private val TAG = "ExpoTorModule"

  private val torServiceConnection =
          object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
              val binder = service as? TorService.LocalBinder
              torService = binder?.getService()
              isBound = true
              Log.d(TAG, "Tor Service Connected")

              // Wait for Tor Control Connection
              Thread {
                        var attempts = 0
                        while (torService?.getTorControlConnection() == null && attempts < 20) {
                          try {
                            Thread.sleep(500)
                            attempts++
                          } catch (e: InterruptedException) {
                            e.printStackTrace()
                          }
                        }
                        if (torService?.getTorControlConnection() != null) {
                          sendEvent("onTorConnected", mapOf("connected" to true))
                        }
                      }
                      .start()
            }

            override fun onServiceDisconnected(name: ComponentName?) {
              torService = null
              isBound = false
              Log.d(TAG, "Tor Service Disconnected")
              sendEvent("onTorDisconnected", mapOf("connected" to false))
            }
          }

  private val statusReceiver =
          object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
              val status = intent?.getStringExtra(TorService.EXTRA_STATUS)
              Log.d(TAG, "Tor Status: $status")
              sendEvent("onTorStatus", mapOf("status" to status))
            }
          }

  override fun definition() = ModuleDefinition {
    Name("ExpoTor")

    // Defines event names that the module can send to JavaScript.
    Events("onTorStatus", "onTorConnected", "onTorDisconnected", "onTorError")

    // Start Tor Service
    AsyncFunction("startTor") { promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("Context is null")

        // Register status receiver
        val filter = IntentFilter(TorService.ACTION_STATUS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          context.registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
          context.registerReceiver(statusReceiver, filter)
        }

        // Start and bind to TorService
        val intent = Intent(context, TorService::class.java)
        context.bindService(intent, torServiceConnection, Context.BIND_AUTO_CREATE)

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

        if (isBound) {
          context.unbindService(torServiceConnection)
          isBound = false
        }

        try {
          context.unregisterReceiver(statusReceiver)
        } catch (e: Exception) {
          Log.w(TAG, "Receiver not registered", e)
        }

        torService = null

        promise.resolve(mapOf("success" to true, "message" to "Tor service stopped"))
      } catch (e: Exception) {
        Log.e(TAG, "Error stopping Tor", e)
        promise.reject("TOR_STOP_ERROR", e.message, e)
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
          promise.reject("TOR_INFO_ERROR", "Could not get info for key: $key", null)
        }
      } catch (e: Exception) {
        Log.e(TAG, "Error getting Tor info", e)
        promise.reject("TOR_INFO_ERROR", e.message, e)
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

        // Build request
        val requestBuilder = Request.Builder().url(url)

        // Add headers
        headers.forEach { (key, value) -> requestBuilder.addHeader(key, value) }

        // Add body if present
        if (body != null && (method == "POST" || method == "PUT" || method == "PATCH")) {
          val contentType = headers["Content-Type"] ?: "application/json"
          requestBuilder.method(method, body.toRequestBody(contentType.toMediaType()))
        } else {
          requestBuilder.method(method, null)
        }

        val request = requestBuilder.build()

        // Execute request in background
        Thread {
                  try {
                    client.newCall(request).execute().use { response ->
                      val responseBody = response.body?.string() ?: ""
                      val responseHeaders = mutableMapOf<String, String>()
                      response.headers.forEach { (name, value) -> responseHeaders[name] = value }

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
                  } catch (e: Exception) {
                    Log.e(TAG, "HTTP request error", e)
                    promise.reject("HTTP_REQUEST_ERROR", e.message, e)
                  }
                }
                .start()
      } catch (e: Exception) {
        Log.e(TAG, "Request setup error", e)
        promise.reject("REQUEST_SETUP_ERROR", e.message, e)
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
