package com.barcodescannersdk;

import android.content.Context
import com.socketmobile.capture.AppKey
import com.socketmobile.capture.client.CaptureClient
import com.socketmobile.capture.client.Configuration
import com.socketmobile.tools.jewel.Jewel
import android.util.Log
import java.util.logging.Level

object CaptureClientProvider {
  private var _capture: CaptureClient? = null
  private val logTag = "CAPTURE_CLIENT_PROVIDER"
  val capture: CaptureClient
    /**
     * Getter that returns shared instance of an already configured [CaptureClient].
     *
     * @throws IllegalStateException if [initializeCapture] has not been called.
     */
    get() = _capture ?: throw IllegalStateException("CaptureClientProvider.initializeCapture must be called in MainApplication.java")

  /**
   * Static method that initializes a shared instance of [CaptureClient].
   * This method should be called in the entrypoint of your application
   * where it has access to your BuildConfig fields. The recommended place to call initializeCapture
   * is in your MainApplication.java/kt onCreate() method.
   *
   * @param context: an instance of [Context] needed to make the capture client context aware.
   * @param appId: the [String] value of the APPLICATION_ID value.
   * @param socketSignature: the [String] value of your specific socket signature.
   *        This value is unique for each appId including debug/internal build variants.
   * @param socketDevId: the [String] value of your developer id.
   *        This value represents your company/organization and is shared between all app.
   * @param isDebugMode: A [Boolean] to determine if the app is running in debug mode.
   * If true the log level for the capture sdk will be set to [Level.ALL] else [Level.SEVERE].
   * The default value for this parameter is false.
   *
   */
  @JvmStatic
  fun initializeCapture(
    context: Context,
    appId: String,
    socketSignature: String,
    socketDevId: String,
    isDebugMode: Boolean = false
  ) {
    val parsedAppId = "android:$appId"
    Log.i(
      logTag,
      "configuring capture client with appId: $parsedAppId, " +
        "socketSignature: $socketSignature, " +
        "socketDevId: $socketDevId " +
        "isDebug: $isDebugMode"
    )

    /*
    This is needed view capture sdk logs in logcat
       - More information can be found here: https://github.com/SocketMobileTools/jewel
    */
    Jewel.install()
    val configuration = Configuration().apply {
      appKey(
        AppKey(socketSignature, parsedAppId, socketDevId)
      )
      setContext(context.applicationContext)
      enableLogging(if (isDebugMode) Level.ALL else Level.SEVERE)
    }
    _capture = CaptureClient(configuration)
  }
}
