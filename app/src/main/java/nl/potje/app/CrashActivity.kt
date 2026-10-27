package nl.potje.app

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * De crashpagina. Draait in een eigen proces en bestaat uit gewone Android-views (geen WebView),
 * zodat hij ook werkt als de web-interface de oorzaak van de crash is.
 * Heeft een knop om te zoeken naar updates, want een nieuwe versie kan de fout al verholpen hebben.
 */
class CrashActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var updater: Updater
    private lateinit var status: TextView
    private lateinit var updateKnop: Button
    private var gevonden: JSONObject? = null
    private var bezig: Job? = null

    private val inkt = Color.parseColor("#101820")
    private val paneel = Color.parseColor("#18232F")
    private val lijn = Color.parseColor("#2B3A4A")
    private val papier = Color.parseColor("#E9E6DD")
    private val gedempt = Color.parseColor("#8FA0B2")
    private val messing = Color.parseColor("#C8A45C")

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        updater = Updater(this)
        val tekst = intent.getStringExtra("tekst") ?: "Geen details beschikbaar."

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(inkt)
            setPadding(dp(24), dp(56), dp(24), dp(24))
            fitsSystemWindows = true
        }
        root.addView(TextView(this).apply {
            text = "Potje is gestopt"
            setTextColor(papier)
            textSize = 28f
            typeface = Typeface.SERIF
        })
        root.addView(TextView(this).apply {
            text = "Er ging iets mis. Je gegevens staan nog op je telefoon. Een nieuwe versie kan dit al verholpen hebben."
            setTextColor(gedempt)
            textSize = 15f
            setLineSpacing(0f, 1.25f)
            setPadding(0, dp(10), 0, dp(20))
        })

        updateKnop = knop("Zoek naar updates", true) { klikUpdate() }
        root.addView(updateKnop, balk())
        status = TextView(this).apply {
            setTextColor(gedempt)
            textSize = 14f
        }
        root.addView(status, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8); bottomMargin = dp(8) })

        val rij = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        rij.addView(knop("Opnieuw starten", false) { opnieuw() }, LinearLayout.LayoutParams(0, dp(48), 1f).apply { rightMargin = dp(6) })
        rij.addView(knop("Kopieer fout", false) { kopieer(tekst) }, LinearLayout.LayoutParams(0, dp(48), 1f).apply { leftMargin = dp(6) })
        root.addView(rij, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(4) })

        val scroll = ScrollView(this).apply {
            background = GradientDrawable().apply { setColor(paneel); cornerRadius = dp(8).toFloat(); setStroke(dp(1), lijn) }
            setPadding(dp(12), dp(12), dp(12), dp(12))
        }
        scroll.addView(TextView(this).apply {
            this.text = tekst
            setTextColor(gedempt)
            textSize = 11f
            typeface = Typeface.MONOSPACE
            setTextIsSelectable(true)
        })
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f).apply { topMargin = dp(20) })
        setContentView(root)
    }

    private fun balk() = LinearLayout.LayoutParams(-1, dp(52))

    private fun knop(label: String, primair: Boolean, actie: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 16f
        stateListAnimator = null
        setTextColor(if (primair) inkt else papier)
        background = GradientDrawable().apply {
            cornerRadius = dp(8).toFloat()
            if (primair) setColor(messing) else { setColor(Color.TRANSPARENT); setStroke(dp(1), lijn) }
        }
        setOnClickListener { actie() }
    }

    private fun klikUpdate() {
        if (bezig?.isActive == true) return
        val nieuw = gevonden
        bezig = scope.launch {
            try {
                if (nieuw == null) {
                    updateKnop.isEnabled = false
                    status.text = "Zoeken…"
                    val v = updater.check()
                    when {
                        v == null -> status.text = "Updates zijn in deze versie niet ingesteld."
                        v.optLong("code") > updater.currentCode -> {
                            gevonden = v
                            status.text = "Versie ${v.optString("name")} is beschikbaar."
                            updateKnop.text = "Installeer versie ${v.optString("name")}"
                        }
                        else -> status.text = "Je hebt de nieuwste versie (${updater.currentName})."
                    }
                } else {
                    updateKnop.isEnabled = false
                    status.text = "Downloaden…"
                    val r = updater.install(nieuw.optString("apk")) { p -> runOnUiThread { status.text = "Downloaden… $p%" } }
                    status.text = if (r == "need_permission")
                        "Sta Potje toe om apps te installeren en tik daarna opnieuw op de knop."
                    else "Volg de stappen van Android om te installeren."
                }
            } catch (e: Exception) {
                status.text = "Lukt niet: controleer je internetverbinding en probeer opnieuw."
            } finally {
                updateKnop.isEnabled = true
            }
        }
    }

    private fun opnieuw() {
        startActivity(Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
        finish()
    }

    private fun kopieer(tekst: String) {
        (getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("Potje-fout", tekst))
        Toast.makeText(this, "Gekopieerd", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
