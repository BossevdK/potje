# Bouwt een nieuwe Potje-versie en zet hem op GitHub. Telefoons met Potje vinden hem met "Zoek naar updates".
# Gebruik:  .\publiceer.ps1 "Wat er nieuw is"
param([string]$Notes = "")
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

$tools = "$env:USERPROFILE\android-tools"
$env:JAVA_HOME = "$tools\jdk"
$env:ANDROID_HOME = "$tools\sdk"
$gradle = "$tools\gradle-8.7\bin\gradle.bat"
$repo = ((Get-Content gradle.properties) -match '^potje.updateRepo=' -replace '^potje.updateRepo=', '').Trim()
if (-not $repo) { Write-Host "Vul potje.updateRepo in, in gradle.properties."; exit 1 }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Host "GitHub CLI (gh) ontbreekt."; exit 1 }
if (-not (Test-Path keystore\potje-release.jks)) { Write-Host "keystore\potje-release.jks ontbreekt: zonder die sleutel kan de update niet over de app heen."; exit 1 }

& $gradle assembleRelease "-PpotjePublish=true" --console=plain
if ($LASTEXITCODE -ne 0) { Write-Host "Bouwen mislukt."; exit 1 }

$el = (Get-Content app\build\outputs\apk\release\output-metadata.json -Raw | ConvertFrom-Json).elements[0]
$code = $el.versionCode; $name = $el.versionName; $tag = "v$name"
Copy-Item app\build\outputs\apk\release\app-release.apk Potje.apk -Force

$json = [ordered]@{ code = $code; name = $name; notes = $Notes; apk = "https://github.com/$repo/releases/download/$tag/Potje.apk" } | ConvertTo-Json -Compress
[IO.File]::WriteAllText((Join-Path $PWD 'version.json'), $json, (New-Object System.Text.UTF8Encoding $false))

gh release create $tag Potje.apk version.json --repo $repo --title "Potje $name" --notes $(if ($Notes) { $Notes } else { "Potje $name" })
if ($LASTEXITCODE -ne 0) { Write-Host "Publiceren mislukt."; exit 1 }
Write-Host "Klaar: $tag staat op GitHub."
