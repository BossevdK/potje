package nl.potje.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Updates via internet zonder Play Store: elke release op GitHub heeft een klein version.json en Potje.apk.
 * De app leest version.json van de nieuwste release, downloadt de APK en geeft die aan de installer van Android.
 * Android accepteert hem alleen over de geïnstalleerde app als hij met dezelfde sleutel is ondertekend.
 * Wordt gebruikt door de instellingen én door de crashpagina.
 */
class Updater(private val ctx: Context) {
    private val repo = BuildConfig.UPDATE_REPO.trim()

    val currentCode: Long get() = BuildConfig.VERSION_CODE.toLong()
    val currentName: String get() = BuildConfig.VERSION_NAME

    /** Bij het starten: een eerder gedownloade APK is na de update niet meer nodig. */
    fun opruimen() { File(ctx.cacheDir, "updates").deleteRecursively() }

    /** version.json van de nieuwste release. code 0 = nog geen release. Null = updates niet ingesteld. */
    suspend fun check(): JSONObject? = withContext(Dispatchers.IO) {
        if (repo.isEmpty()) return@withContext null
        val con = open("https://github.com/$repo/releases/latest/download/version.json")
        try {
            when (con.responseCode) {
                200 -> JSONObject(con.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() })
                404 -> JSONObject().put("code", 0)
                else -> throw IllegalStateException("http ${con.responseCode}")
            }
        } finally { con.disconnect() }
    }

    /**
     * Downloaden en de installer starten. Geeft "need_permission" als Android Potje eerst moet toestaan apps te
     * installeren (het instellingenscherm gaat open), of "started" als de installer getoond wordt.
     */
    suspend fun install(url: String, onProgress: (Int) -> Unit): String {
        require(repo.isNotEmpty() && url.startsWith("https://github.com/$repo/releases/download/")) { "bad_url" }
        if (Build.VERSION.SDK_INT >= 26 && !ctx.packageManager.canRequestPackageInstalls()) {
            ctx.startActivity(
                Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${ctx.packageName}"))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            return "need_permission"
        }
        val file = withContext(Dispatchers.IO) { download(url, onProgress) }
        // Alleen een Potje-APK doorgeven die echt nieuwer is.
        val info = ctx.packageManager.getPackageArchiveInfo(file.path, 0) ?: throw IllegalStateException("bad_apk")
        val code = if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()
        if (info.packageName != ctx.packageName || code <= currentCode) throw IllegalStateException("bad_apk")
        val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.files", file)
        ctx.startActivity(
            Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        return "started"
    }

    private fun download(url: String, onProgress: (Int) -> Unit): File {
        val dir = File(ctx.cacheDir, "updates").apply { mkdirs() }
        dir.listFiles()?.forEach { it.delete() }
        val out = File(dir, "Potje.apk")
        val con = open(url)
        try {
            if (con.responseCode != 200) throw IllegalStateException("http ${con.responseCode}")
            val total = con.contentLengthLong
            var done = 0L
            var last = -1
            con.inputStream.use { input ->
                out.outputStream().use { o ->
                    val buf = ByteArray(64 * 1024)
                    while (true) {
                        val n = input.read(buf)
                        if (n < 0) break
                        o.write(buf, 0, n)
                        done += n
                        if (total > 0) {
                            val pct = (done * 100 / total).toInt()
                            if (pct != last) { last = pct; onProgress(pct) }
                        }
                    }
                }
            }
        } finally { con.disconnect() }
        return out
    }

    private fun open(address: String) = (URL(address).openConnection() as HttpURLConnection).apply {
        connectTimeout = 15000
        readTimeout = 30000
        instanceFollowRedirects = true
        setRequestProperty("Accept", "application/json, application/octet-stream, */*")
    }
}
