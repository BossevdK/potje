package nl.potje.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONArray
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit
import java.time.Duration

/** Elke dag op het gekozen uur één tip uit de lijst die de web-interface heeft doorgegeven. */
class TipWorker(private val ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val tips = try { JSONArray(prefs(ctx).getString("tips", "[]")) } catch (_: Exception) { JSONArray() }
        if (tips.length() == 0) return Result.success()
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return Result.success()

        val tekst = tips.getString(LocalDate.now().dayOfYear % tips.length())
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel(KANAAL, "Dagelijkse tip", NotificationManager.IMPORTANCE_DEFAULT))
        val open = PendingIntent.getActivity(ctx, 0, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        nm.notify(1, NotificationCompat.Builder(ctx, KANAAL)
            .setSmallIcon(R.drawable.ic_stat_potje)
            .setContentTitle("Tip van de dag")
            .setContentText(tekst)
            .setStyle(NotificationCompat.BigTextStyle().bigText(tekst))
            .setContentIntent(open)
            .setAutoCancel(true)
            .build())
        return Result.success()
    }

    companion object {
        private const val KANAAL = "tips"
        private const val WERK = "dagtip"
        fun prefs(ctx: Context) = ctx.getSharedPreferences("potje", Context.MODE_PRIVATE)

        fun plan(ctx: Context, aan: Boolean, uur: Int, tipsJson: String) {
            val wm = WorkManager.getInstance(ctx)
            if (!aan) { wm.cancelUniqueWork(WERK); return }
            prefs(ctx).edit().putString("tips", tipsJson).apply()
            val nu = LocalDateTime.now(ZoneId.of("Europe/Amsterdam"))
            var eerste = nu.toLocalDate().atTime(uur.coerceIn(0, 23), 0)
            if (!eerste.isAfter(nu)) eerste = eerste.plusDays(1)
            val vertraging = Duration.between(nu, eerste).toMinutes()
            wm.enqueueUniquePeriodicWork(
                WERK, ExistingPeriodicWorkPolicy.UPDATE,
                PeriodicWorkRequestBuilder<TipWorker>(24, TimeUnit.HOURS).setInitialDelay(vertraging, TimeUnit.MINUTES).build()
            )
        }
    }
}
