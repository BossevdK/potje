import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.time.Duration
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Een gepubliceerde versie krijgt een hoger nummer: minuten sinds 1 jan 2026 (Android installeert een update
// alleen met een hoger nummer). Alleen publiceer.ps1 vraagt dat (-PpotjePublish=true). Een testbouw houdt een vast nummer.
val publish = (findProperty("potjePublish") as String?) == "true"
val buildTime: LocalDateTime = LocalDateTime.now(ZoneId.of("Europe/Amsterdam"))
val potjeCode = if (publish) Duration.between(LocalDateTime.of(2026, 1, 1, 0, 0), buildTime).toMinutes().toInt() else 1
val potjeName: String = if (publish) buildTime.format(DateTimeFormatter.ofPattern("yyyy.MM.dd-HHmm")) else "test"
val updateRepo = (findProperty("potje.updateRepo") as String?)?.trim().orEmpty()

// Sleutel waarmee elke Potje-APK wordt ondertekend. Bewaar een kopie van keystore/ ergens veilig:
// zonder deze sleutel past geen update meer over de app heen.
val keyDir = rootProject.file("keystore")
val keyProps = Properties().apply {
    val f = File(keyDir, "keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "nl.potje.app"
    compileSdk = 34

    buildFeatures { buildConfig = true }

    signingConfigs {
        if (keyProps.isNotEmpty()) {
            create("potje") {
                storeFile = File(keyDir, keyProps.getProperty("storeFile"))
                storePassword = keyProps.getProperty("storePassword")
                keyAlias = keyProps.getProperty("keyAlias")
                keyPassword = keyProps.getProperty("keyPassword")
            }
        }
    }

    defaultConfig {
        applicationId = "nl.potje.app"
        minSdk = 26
        targetSdk = 34
        versionCode = potjeCode
        versionName = potjeName
        buildConfigField("String", "UPDATE_REPO", "\"$updateRepo\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (keyProps.isNotEmpty()) signingConfigs.getByName("potje") else signingConfigs.getByName("debug")
        }
        debug {
            if (keyProps.isNotEmpty()) signingConfig = signingConfigs.getByName("potje")
        }
    }

    lint { checkReleaseBuilds = false }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
