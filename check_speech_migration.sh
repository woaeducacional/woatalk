#!/bin/bash
# Script para verificar se a migração de Speech Services foi bem-sucedida

echo "🔍 Checking Speech Services Migration..."
echo ""

# Verificar arquivos criados
echo "📁 Checking created files..."

files=(
    "lib/speech/types.ts"
    "lib/speech/azure.ts"
    "lib/speech/whisper.ts"
    "lib/speech/pyttsx3.ts"
    "lib/speech/config.ts"
    "lib/speech/index.ts"
    "docs/SPEECH_SERVICES_GUIDE.md"
    "SPEECH_MIGRATION_QUICKSTART.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
    fi
done

# Verificar modificações em rotas
echo ""
echo "📝 Checking modified API routes..."

if grep -q "getSTTProvider" "app/api/transcribe/route.ts"; then
    echo "✅ app/api/transcribe/route.ts - Updated"
else
    echo "❌ app/api/transcribe/route.ts - NOT updated!"
fi

if grep -q "getTTSProvider" "app/api/tts/route.ts"; then
    echo "✅ app/api/tts/route.ts - Updated"
else
    echo "❌ app/api/tts/route.ts - NOT updated!"
fi

# Verificar .env.local
echo ""
echo "🔧 Checking .env.local configuration..."

if grep -q "SPEECH_STT_PROVIDER" ".env.local"; then
    echo "✅ SPEECH_STT_PROVIDER found"
else
    echo "❌ SPEECH_STT_PROVIDER - NOT found!"
fi

if grep -q "SPEECH_TTS_PROVIDER" ".env.local"; then
    echo "✅ SPEECH_TTS_PROVIDER found"
else
    echo "❌ SPEECH_TTS_PROVIDER - NOT found!"
fi

if grep -q "WHISPER_MODEL_SIZE" ".env.local"; then
    echo "✅ WHISPER_MODEL_SIZE found"
else
    echo "❌ WHISPER_MODEL_SIZE - NOT found!"
fi

# Verificar Python e dependências
echo ""
echo "🐍 Checking Python dependencies..."

if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "⚠️  Python3 not found (needed for Whisper/pyttsx3)"
fi

if python3 -m pip show openai-whisper &> /dev/null 2>&1; then
    echo "✅ openai-whisper installed"
else
    echo "❌ openai-whisper NOT installed"
fi

if python3 -m pip show pyttsx3 &> /dev/null 2>&1; then
    echo "✅ pyttsx3 installed"
else
    echo "❌ pyttsx3 NOT installed"
fi

echo ""
echo "✅ Migration check complete!"
echo ""
echo "Next steps:"
echo "1. If you see ❌ for Python packages, run: ./SPEECH_SETUP.sh"
echo "2. Update .env.local with SPEECH_STT_PROVIDER and SPEECH_TTS_PROVIDER"
echo "3. Restart dev server: npm run dev"
echo "4. Test endpoints: POST /api/transcribe and POST /api/tts"
