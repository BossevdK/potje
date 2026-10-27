package nl.potje.app

import android.app.Application
import android.content.Intent
import android.os.Build
import android.os.Process
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import kotlin.system.exitProcess

/** Vangt elke onverwachte fout op en toont de crashpagina (eigen proces) in plaats van het standaard Android-venster. */
class PotjeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val inCrashProcess = Build.VERSION.SDK_INT >= 28 && getProcessName().endsWith(":crash")
        if (inCrashProcess) return
        Thread.setDefaultUncaughtExceptionHandler { thread, error ->
            try {
                val sw = StringWriter()
                error.printStackTrace(PrintWriter(sw))
                val tekst = "Potje ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})\n" +
                    "Android ${Build.VERSION.RELEASE} (${Build.MANUFACTURER} ${Build.MODEL})\n" +
                    "Thread: ${thread.name}\n\n$sw"
                File(filesDir, "crash.txt").writeText(tekst)
                startCrashPage(this, tekst)
            } catch (_: Throwable) {
            }
            Process.killProcess(Process.myPid())
            exitProcess(10)
        }
    }

    companion object {
        fun startCrashPage(ctx: android.content.Context, tekst: String) {
            ctx.startActivity(
                Intent(ctx, CrashActivity::class.java)
                    .putExtra("tekst", tekst.take(20000))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            )
        }
    }
}
