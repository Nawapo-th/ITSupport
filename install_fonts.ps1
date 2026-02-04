# PowerShell Script to download TH Sarabun New fonts for offline use
$fonts = @(
    @{ url="https://raw.githubusercontent.com/inwdragon/Install-TH-Sarabun-New-Font-for-Ubuntu-terminal/master/THSarabunNew.ttf"; name="THSarabunNew.ttf" },
    @{ url="https://raw.githubusercontent.com/inwdragon/Install-TH-Sarabun-New-Font-for-Ubuntu-terminal/master/THSarabunNew%20Bold.ttf"; name="THSarabunNew Bold.ttf" },
    @{ url="https://raw.githubusercontent.com/inwdragon/Install-TH-Sarabun-New-Font-for-Ubuntu-terminal/master/THSarabunNew%20Italic.ttf"; name="THSarabunNew Italic.ttf" },
    @{ url="https://raw.githubusercontent.com/inwdragon/Install-TH-Sarabun-New-Font-for-Ubuntu-terminal/master/THSarabunNew%20BoldItalic.ttf"; name="THSarabunNew BoldItalic.ttf" }
)

$targetDir = "assets/fonts"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir
}

foreach ($font in $fonts) {
    echo "Downloading $($font.name)..."
    Invoke-WebRequest -Uri $font.url -OutFile "$targetDir/$($font.name)"
}

echo "Fonts installed successfully in $targetDir"
