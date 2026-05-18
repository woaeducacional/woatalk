# Instalar dependências Python para Speech Services

Write-Host "🎤 Setting up Speech Services..." -ForegroundColor Cyan

# Verificar se Python está instalado
Write-Host "`n📝 Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($pythonVersion -match "Python") {
    Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Instalar Whisper
Write-Host "`n📥 Installing Whisper (for Speech-to-Text)..." -ForegroundColor Yellow
python -m pip install --upgrade openai-whisper

# Instalar pyttsx3
Write-Host "`n📥 Installing pyttsx3 (for Text-to-Speech)..." -ForegroundColor Yellow
python -m pip install --upgrade pyttsx3

# Verificar se ffmpeg está instalado (opcional, para melhor áudio)
Write-Host "`n📝 Checking ffmpeg installation..." -ForegroundColor Yellow
$ffmpegCheck = ffmpeg -version 2>&1 | Select-Object -First 1
if ($ffmpegCheck) {
    Write-Host "✅ ffmpeg found" -ForegroundColor Green
} else {
    Write-Host "⚠️  ffmpeg not found (optional)" -ForegroundColor Yellow
    Write-Host "To install: choco install ffmpeg (requires Chocolatey)" -ForegroundColor Yellow
}

Write-Host "`n✅ Speech Services setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local and set:" -ForegroundColor White
Write-Host "   SPEECH_STT_PROVIDER=whisper" -ForegroundColor Gray
Write-Host "   SPEECH_TTS_PROVIDER=pyttsx3" -ForegroundColor Gray
Write-Host "2. Restart the dev server: npm run dev" -ForegroundColor White
Write-Host "3. Test the endpoints" -ForegroundColor White
