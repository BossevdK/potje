package nl.potje.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.WindowManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.JavascriptInterface
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

/**
 * Potje is een Kotlin-schil met een web-interface (assets/index.html). De schil doet wat een webpagina niet kan:
 * updates via GitHub, bestanden delen, vergrendelen met vingerafdruk of pincode, een dagelijkse melding en
 * de crashpagina. Alle gegevens blijven op de telefoon.
 */
class MainActivity : FragmentActivity() {
    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private lateinit var updater: Updater
    private var updateJob: Job? = null
    private var gestoptOp = 0L

    private var chooserCb: ValueCallback<Array<Uri>>? = null
    private val chooser = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        chooserCb?.onReceiveValue(uri?.let { arrayOf(it) })
        chooserCb = null
    }
    private val meldingToestemming = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        js("window.onMeldingToestemming && window.onMeldingToestemming($ok)")
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        updater = Updater(this)
        updater.opruimen()

        root = FrameLayout(this)
        root.setBackgroundColor(ContextCompat.getColor(this, R.color.bg))
        web = WebView(this)
        web.setBackgroundColor(Color.TRANSPARENT)
        root.addView(web, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }
        web.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == "appassets.androidplatform.net") return false
                try { startActivity(Intent(Intent.ACTION_VIEW, request.url)) } catch (_: Exception) {}
                return true
            }

            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                PotjeApp.startCrashPage(this@MainActivity, "De web-interface is gestopt (WebView-proces).\ncrash=${if (Build.VERSION.SDK_INT >= 26) detail.didCrash() else "?"}")
                finish()
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(w: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                chooserCb?.onReceiveValue(null)
                chooserCb = cb
                chooser.launch(arrayOf("*/*"))
                return true
            }
        }
        web.addJavascriptInterface(Bridge(), "PotjeNative")
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.onNativeBack ? window.onNativeBack() : false") { handled ->
                    if (handled != "true") finish()
                }
            }
        })
    }

    override fun onStop() {
        gestoptOp = SystemClock.elapsedRealtime()
        super.onStop()
    }

    override fun onStart() {
        super.onStart()
        if (gestoptOp > 0) {
            val weg = SystemClock.elapsedRealtime() - gestoptOp
            js("window.onAppTerug && window.onAppTerug($weg)")
        }
    }

    override fun onDestroy() {
        chooserCb?.onReceiveValue(null)
        web.removeJavascriptInterface("PotjeNative")
        web.destroy()
        super.onDestroy()
    }

    private fun js(code: String) = runOnUiThread { if (!isDestroyed) web.evaluateJavascript(code, null) }

    private fun melding(tekst: String) = runOnUiThread { Toast.makeText(this, tekst, Toast.LENGTH_SHORT).show() }

    /** Alles wat de web-interface van de schil kan vragen. Draait op een achtergrondthread van WebView. */
    inner class Bridge {
        @JavascriptInterface
        fun versie(): String = JSONObject()
            .put("code", updater.currentCode).put("name", updater.currentName)
            .put("repo", BuildConfig.UPDATE_REPO).toString()

        /** Zoekt de nieuwste release; antwoord komt terug via window.onUpdate({...}). */
        @JavascriptInterface
        fun zoekUpdate() {
            if (updateJob?.isActive == true) return
            updateJob = lifecycleScope.launch {
                val antwoord = JSONObject()
                try {
                    val v = updater.check()
                    if (v == null) antwoord.put("status", "uit")
                    else {
                        val code = v.optLong("code")
                        antwoord.put("status", if (code > updater.currentCode) "nieuw" else "actueel")
                            .put("name", v.optString("name")).put("notes", v.optString("notes")).put("apk", v.optString("apk"))
                    }
                } catch (e: Exception) {
                    antwoord.put("status", "fout")
                }
                js("window.onUpdate && window.onUpdate($antwoord)")
            }
        }

        /** Download en start de installer; voortgang via window.onUpdateVoortgang(p), einde via window.onUpdateKlaar(status). */
        @JavascriptInterface
        fun installeer(url: String) {
            if (updateJob?.isActive == true) return
            updateJob = lifecycleScope.launch {
                val status = try {
                    updater.install(url) { p -> js("window.onUpdateVoortgang && window.onUpdateVoortgang($p)") }
                } catch (e: Exception) { "fout" }
                js("window.onUpdateKlaar && window.onUpdateKlaar(${JSONObject.quote(status)})")
            }
        }

        /** Een bestand (back-up of export) delen via het deelmenu van Android. */
        @JavascriptInterface
        fun deel(naam: String, tekst: String, mime: String) {
            try {
                val dir = File(cacheDir, "export").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
                val veilig = naam.replace(Regex("[^A-Za-z0-9._-]"), "_").ifEmpty { "potje.txt" }
                val bestand = File(dir, veilig).apply { writeText(tekst, Charsets.UTF_8) }
                val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", bestand)
                val send = Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                runOnUiThread { startActivity(Intent.createChooser(send, "Bewaar of deel").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)) }
            } catch (e: Exception) {
                melding("Delen is niet gelukt")
            }
        }

        @JavascriptInterface
        fun kopieer(tekst: String) {
            runOnUiThread {
                (getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Potje", tekst))
                Toast.makeText(this@MainActivity, "Gekopieerd", Toast.LENGTH_SHORT).show()
            }
        }

        /** Heeft deze telefoon een schermvergrendeling of vingerafdruk? Zonder kan Potje zich niet vergrendelen. */
        @JavascriptInterface
        fun kanVergrendelen(): Boolean =
            BiometricManager.from(this@MainActivity).canAuthenticate(BIOMETRIC_WEAK or DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS

        /** Aan: bedragen verdwijnen uit het app-overzicht van Android en schermafbeeldingen zijn geblokkeerd. */
        @JavascriptInterface
        fun beschermScherm(aan: Boolean) = runOnUiThread {
            if (aan) window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
            else window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }

        /** Vraagt vingerafdruk of pincode; antwoord via window.onOntgrendeld(true/false). */
        @JavascriptInterface
        fun ontgrendel() = runOnUiThread {
            val prompt = BiometricPrompt(this@MainActivity, ContextCompat.getMainExecutor(this@MainActivity),
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        js("window.onOntgrendeld && window.onOntgrendeld(true)")
                    }
                    override fun onAuthenticationError(code: Int, msg: CharSequence) {
                        js("window.onOntgrendeld && window.onOntgrendeld(false)")
                    }
                })
            prompt.authenticate(
                BiometricPrompt.PromptInfo.Builder().setTitle("Potje ontgrendelen")
                    .setAllowedAuthenticators(BIOMETRIC_WEAK or DEVICE_CREDENTIAL).build()
            )
        }

        /** Kleur van de statusbalk-iconen en de achtergrond achter de web-interface, passend bij donker of licht thema. */
        @JavascriptInterface
        fun zetThema(licht: Boolean) = runOnUiThread {
            val ctrl = WindowCompat.getInsetsController(window, window.decorView)
            ctrl.isAppearanceLightStatusBars = licht
            ctrl.isAppearanceLightNavigationBars = licht
            root.setBackgroundColor(if (licht) Color.parseColor("#EEF1F4") else ContextCompat.getColor(this@MainActivity, R.color.bg))
        }

        @JavascriptInterface
        fun vraagMeldingToestemming() = runOnUiThread {
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) meldingToestemming.launch(Manifest.permission.POST_NOTIFICATIONS)
            else js("window.onMeldingToestemming && window.onMeldingToestemming(true)")
        }

        @JavascriptInterface
        fun zetMelding(aan: Boolean, uur: Int, tipsJson: String) = TipWorker.plan(applicationContext, aan, uur, tipsJson)

        /** Een fout in de web-interface die niet te herstellen is: toon de crashpagina. */
        @JavascriptInterface
        fun crash(tekst: String) {
            PotjeApp.startCrashPage(this@MainActivity, "Potje ${BuildConfig.VERSION_NAME}\n\n$tekst")
            runOnUiThread { finish() }
        }
    }
}
