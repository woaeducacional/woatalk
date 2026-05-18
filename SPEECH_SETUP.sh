#!/bin/bash

# Instalar dependências Python para Speech Services

echo "🎤 Setting up Speech Services..."

# Verificar se Python está instalado
echo -e "\n📝 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Found: $PYTHON_VERSION"
else
    echo "❌ Python3 not found!"
    echo "Please install Python from: https://www.python.org/downloads/"
    exit 1
fi

# Instalar Whisper
echo -e "\n📥 Installing Whisper (for Speech-to-Text)..."
python3 -m pip install --upgrade openai-whisper

# Instalar pyttsx3
echo -e "\n📥 Installing pyttsx3 (for Text-to-Speech)..."
python3 -m pip install --upgrade pyttsx3

# Verificar se ffmpeg está instalado (opcional)
echo -e "\n📝 Checking ffmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg found"
else
    echo "⚠️  ffmpeg not found (optional)"
    echo "To install:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
fi

echo -e "\n✅ Speech Services setup complete!"
echo -e "\nNext steps:"
echo "1. Edit .env.local and set:"
echo "   SPEECH_STT_PROVIDER=whisper"
echo "   SPEECH_TTS_PROVIDER=pyttsx3"
echo "2. Restart the dev server: npm run dev"
echo "3. Test the endpoints"
