package com.nyra.safetyapp

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.concurrent.Executor

class CallModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "CallModule"
    private var mediaPlayer: MediaPlayer? = null
    private var telephonyManager: TelephonyManager? = null
    private var telephonyCallback: Any? = null // Can be PhoneStateListener or TelephonyCallback
    private var callStateExecutor: Executor? = null

    override fun getName(): String {
        return "CallModule"
    }

    /**
     * Make an emergency call to a single contact
     * Automatically dials the number and plays pre-recorded audio when call connects
     */
    @ReactMethod
    fun makeEmergencyCall(phoneNumber: String, audioFilePath: String?, promise: Promise) {
        try {
            Log.d(TAG, "Attempting emergency call to: $phoneNumber")

            // Check for CALL_PHONE permission
            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.CALL_PHONE) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "CALL_PHONE permission not granted")
                promise.reject("PERMISSION_ERROR", "CALL_PHONE permission not granted")
                return
            }

            // Clean phone number
            val cleanNumber = phoneNumber.replace(Regex("[\\s\\-\\(\\)]"), "")
            
            // ALWAYS set up call state monitoring to enable Dual Protection SMS backup
            setupCallStateMonitoring(audioFilePath)

            // Create call intent
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$cleanNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }

            // Start the call
            reactContext.startActivity(callIntent)
            
            Log.d(TAG, "Emergency call initiated to: $phoneNumber")
            
            val resultMap = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("phoneNumber", phoneNumber)
                putBoolean("hasAudio", !audioFilePath.isNullOrEmpty())
            }
            promise.resolve(resultMap)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to make emergency call to: $phoneNumber", e)
            promise.reject("CALL_ERROR", "Failed to make call: ${e.message}", e)
        }
    }

    /**
     * Make emergency calls to multiple contacts
     * Calls each contact with a delay between calls
     */
    @ReactMethod
    fun makeEmergencyCalls(phoneNumbers: ReadableArray, audioFilePath: String?, promise: Promise) {
        try {
            Log.d(TAG, "Making emergency calls to ${phoneNumbers.size()} contacts")
            Log.d(TAG, "DEBUG: audioFilePath parameter = $audioFilePath")
            Log.d(TAG, "DEBUG: audioFilePath is null? ${audioFilePath == null}")
            Log.d(TAG, "DEBUG: audioFilePath is empty? ${audioFilePath?.isEmpty()}")

            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.CALL_PHONE) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_ERROR", "CALL_PHONE permission not granted")
                return
            }

            val successList = mutableListOf<String>()
            val failedList = mutableListOf<String>()

            // Call the first contact immediately
            if (phoneNumbers.size() > 0) {
                val firstNumber = phoneNumbers.getString(0)
                if (firstNumber != null) {
                    try {
                        val cleanNumber = firstNumber.replace(Regex("[\\s\\-\\(\\)]"), "")
                        
                        // ALWAYS set up call state monitoring to enable Dual Protection SMS backup
                        setupCallStateMonitoring(audioFilePath)
                        
                        val callIntent = Intent(Intent.ACTION_CALL).apply {
                            data = Uri.parse("tel:$cleanNumber")
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }

                        reactContext.startActivity(callIntent)
                        successList.add(firstNumber)
                        Log.d(TAG, "Called: $firstNumber")
                    } catch (e: Exception) {
                        failedList.add(firstNumber)
                        Log.e(TAG, "Failed to call: $firstNumber", e)
                    }
                }
            }

            // Note: Due to Android limitations, we can only auto-dial one number at a time
            // Subsequent calls would require user interaction or a custom dialer UI
            // For safety apps, calling the first contact is usually sufficient

            val result = Arguments.createMap().apply {
                putInt("success", successList.size)
                putInt("failed", failedList.size)
                putInt("total", phoneNumbers.size())
                putInt("called", successList.size)
                putString("note", "Only first contact auto-called due to Android limitations")
            }

            promise.resolve(result)

        } catch (e: Exception) {
            Log.e(TAG, "Error in makeEmergencyCalls", e)
            promise.reject("CALL_ERROR", "Failed to make calls: ${e.message}", e)
        }
    }

    /**
     * Setup call state monitoring for SMS triggers and optional audio playback 
     */
    private fun setupCallStateMonitoring(audioFilePath: String?) {
        try {
            Log.d(TAG, "Setting up call state monitoring. Audio file: $audioFilePath")
            
            // Initialize telephony manager for call state monitoring
            if (telephonyManager == null) {
                telephonyManager = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            }

            // Check for READ_PHONE_STATE permission
            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "READ_PHONE_STATE permission not granted, cannot monitor call state")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setupModernCallbackListener(audioFilePath)
            } else {
                setupLegacyCallStateListener(audioFilePath)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error setting up call state monitoring", e)
        }
    }

    /**
     * Setup modern TelephonyCallback for Android 12+
     */
    @RequiresApi(Build.VERSION_CODES.S)
    private fun setupModernCallbackListener(audioFilePath: String?) {
        callStateExecutor = Executor { it.run() }
        val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) {
                handleCallStateChange(state, audioFilePath)
            }
        }
        telephonyCallback = callback
        telephonyManager?.registerTelephonyCallback(callStateExecutor!!, callback)
        Log.d(TAG, "Registered TelephonyCallback (Android 12+)")
    }

    /**
     * Setup legacy PhoneStateListener for Android 11 and below
     */
    private fun setupLegacyCallStateListener(audioFilePath: String?) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            // Only compile this code for older Android versions
            val listener = object : android.telephony.PhoneStateListener() {
                @Deprecated("Deprecated in API 31")
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    handleCallStateChange(state, audioFilePath)
                }
            }
            telephonyCallback = listener
            @Suppress("DEPRECATION")
            telephonyManager?.listen(listener, android.telephony.PhoneStateListener.LISTEN_CALL_STATE)
            Log.d(TAG, "Registered PhoneStateListener (Android 11 and below)")
        }
    }

    /**
     * Handle call state changes
     */
    private fun handleCallStateChange(state: Int, audioFilePath: String?) {
        Log.d(TAG, "📞 Call state changed: $state")
        when (state) {
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                // Call connected - play audio after a delay to ensure call is fully connected
                Log.d(TAG, "📞 Call state: OFFHOOK (call connected)")
                if (!audioFilePath.isNullOrEmpty()) {
                    Handler(Looper.getMainLooper()).postDelayed({
                        playAudioInCall(audioFilePath)
                    }, 5000) // 5 second delay to ensure call audio routing is stable
                } else {
                    Log.d(TAG, "📞 No audio file provided, skipping playback.")
                }
            }
            TelephonyManager.CALL_STATE_IDLE -> {
                // Call ended - cleanup and trigger SMS backup
                Log.d(TAG, "📞 Call state: IDLE (call ended)")
                Log.d(TAG, "📞 Stopping audio playback...")
                stopAudioPlayback()
                
                // Emit event to JavaScript to trigger SMS as backup
                try {
                    Log.d(TAG, "📞 Attempting to emit onEmergencyCallEnded event to JavaScript...")
                    val params = Arguments.createMap()
                    params.putString("timestamp", System.currentTimeMillis().toString())
                    params.putString("reason", "call_ended")
                    
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onEmergencyCallEnded", params)
                    
                    Log.d(TAG, "✅ Successfully emitted onEmergencyCallEnded event for SMS backup")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Error emitting call ended event: ${e.message}", e)
                    e.printStackTrace()
                }
            }
            TelephonyManager.CALL_STATE_RINGING -> {
                Log.d(TAG, "📞 Call state: RINGING")
            }
            else -> {
                Log.d(TAG, "📞 Call state: Unknown state $state")
            }
        }
    }

    /**
     * Play the emergency audio during the call
     */
    private fun playAudioInCall(audioFilePath: String) {
        try {
            Log.d(TAG, "Attempting to play emergency audio: $audioFilePath")

            // Convert file:// URI to absolute path if needed
            val absolutePath = if (audioFilePath.startsWith("file://")) {
                audioFilePath.substring(7) // Remove "file://" prefix
            } else {
                audioFilePath
            }
            
            Log.d(TAG, "Converted path: $absolutePath")

            val audioFile = File(absolutePath)
            if (!audioFile.exists()) {
                Log.e(TAG, "Audio file not found: $absolutePath")
                return
            }

            Log.d(TAG, "Audio file exists, size: ${audioFile.length()} bytes")

            // Release any existing media player
            mediaPlayer?.release()

            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            
            // Save current audio mode and settings
            val originalMode = audioManager.mode
            Log.d(TAG, "Current audio mode: $originalMode")
            
            // CRITICAL STEPS FOR AUDIO TRANSMISSION:
            // 1. Turn on speakerphone at MAXIMUM volume
            audioManager.isSpeakerphoneOn = true
            
            // 2. Set mode to IN_COMMUNICATION for better audio routing during calls
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            
            // 3. Set voice call volume to maximum for better transmission
            val maxVoiceVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
            audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxVoiceVolume, 0)
            Log.d(TAG, "Voice call volume set to maximum: $maxVoiceVolume")
            
            Log.d(TAG, "Audio mode set to MODE_IN_COMMUNICATION with speaker ON at max volume")

            // Create new media player with proper audio attributes
            mediaPlayer = MediaPlayer().apply {
                setDataSource(absolutePath)  // Use converted absolute path
                
                // Use USAGE_VOICE_COMMUNICATION for in-call audio routing
                // This ensures the audio goes through the call's microphone path
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setLegacyStreamType(AudioManager.STREAM_VOICE_CALL)
                        .build()
                )
                Log.d(TAG, "Using AudioAttributes with USAGE_VOICE_COMMUNICATION for call transmission")
                
                // Set volume to maximum for this MediaPlayer instance
                setVolume(1.0f, 1.0f)

                setOnPreparedListener { mp ->
                    Log.d(TAG, "MediaPlayer prepared, starting emergency message playback")
                    Log.d(TAG, "Playing audio through speakerphone for transmission to recipient")
                    mp.start()
                }
                
                setOnCompletionListener {
                    Log.d(TAG, "Emergency audio message playback completed")
                    // Keep speakerphone ON during call for conversation
                    // Maintain communication mode
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                    Log.d(TAG, "Audio transmitted - speakerphone remains active")
                }
                
                setOnErrorListener { mp, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    audioManager.mode = AudioManager.MODE_NORMAL
                    audioManager.isSpeakerphoneOn = false
                    true
                }

                prepareAsync()
            }

            Log.d(TAG, "MediaPlayer configured and preparing audio")

        } catch (e: Exception) {
            Log.e(TAG, "Error playing audio in call", e)
            e.printStackTrace()
        }
    }

    /**
     * Stop audio playback and cleanup
     */
    private fun stopAudioPlayback() {
        try {
            Log.d(TAG, "Stopping audio playback and cleaning up")
            
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
            mediaPlayer = null

            // Unregister listeners based on Android version
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                unregisterModernCallback()
            } else {
                unregisterLegacyListener()
            }

            // Reset audio mode
            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_NORMAL
            audioManager.isSpeakerphoneOn = false

            Log.d(TAG, "Audio playback stopped and cleaned up")

        } catch (e: Exception) {
            Log.e(TAG, "Error stopping audio playback", e)
        }
    }

    /**
     * Unregister modern TelephonyCallback (Android 12+)
     */
    @RequiresApi(Build.VERSION_CODES.S)
    private fun unregisterModernCallback() {
        telephonyCallback?.let {
            if (it is TelephonyCallback) {
                telephonyManager?.unregisterTelephonyCallback(it)
            }
        }
        telephonyCallback = null
        callStateExecutor = null
    }

    /**
     * Unregister legacy PhoneStateListener (Android 11 and below)
     */
    private fun unregisterLegacyListener() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            telephonyCallback?.let {
                if (it is android.telephony.PhoneStateListener) {
                    @Suppress("DEPRECATION")
                    telephonyManager?.listen(it, android.telephony.PhoneStateListener.LISTEN_NONE)
                }
            }
            telephonyCallback = null
        }
    }

    /**
     * Check if device can make phone calls
     */
    @ReactMethod
    fun canMakePhoneCalls(promise: Promise) {
        try {
            val hasCallPermission = ActivityCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.CALL_PHONE
            ) == PackageManager.PERMISSION_GRANTED

            val hasPhoneStatePermission = ActivityCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED

            val hasTelephony = reactContext.packageManager.hasSystemFeature(
                PackageManager.FEATURE_TELEPHONY
            )

            val resultMap = Arguments.createMap().apply {
                putBoolean("canCall", hasCallPermission && hasTelephony)
                putBoolean("hasPermission", hasCallPermission)
                putBoolean("hasPhoneStatePermission", hasPhoneStatePermission)
                putBoolean("hasTelephony", hasTelephony)
            }
            
            promise.resolve(resultMap)

        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", "Failed to check call capability: ${e.message}", e)
        }
    }

    /**
     * Request CALL_PHONE permission
     */
    @ReactMethod
    fun requestCallPermission(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available")
                return
            }

            val hasPermission = ActivityCompat.checkSelfPermission(
                reactContext,
                Manifest.permission.CALL_PHONE
            ) == PackageManager.PERMISSION_GRANTED

            if (hasPermission) {
                promise.resolve(true)
            } else {
                // Note: Actual permission request should be handled by expo-permissions or similar
                promise.reject("NO_PERMISSION", "CALL_PHONE permission not granted. Please grant it in app settings.")
            }

        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Failed to check permission: ${e.message}", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        stopAudioPlayback()
    }
}
