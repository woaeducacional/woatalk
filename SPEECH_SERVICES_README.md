## Speech Services - Agora com múltiplos provedores! 🎤🔊

A API do Azure Speech expirou? Sem problema! Implementamos uma camada abstrata que permite usar:

- ✅ **Whisper (local)** - Transcrição de áudio gratuita, sem limites
- ✅ **pyttsx3 (local)** - Síntese de voz gratuita, sem limites  
- ✅ **Azure Speech** - Mantém compatibilidade (fallback)

### 🚀 Quick Start

**1. Instalar dependências (one-time):**
```bash
# Windows
.\SPEECH_SETUP.ps1

# Linux/Mac
chmod +x SPEECH_SETUP.sh && ./SPEECH_SETUP.sh
```

**2. Configurar em `.env.local`:**
```env
SPEECH_STT_PROVIDER="whisper"      # ou "azure"
SPEECH_TTS_PROVIDER="pyttsx3"      # ou "azure"
WHISPER_MODEL_SIZE="base"          # tiny, base, small, medium, large
```

**3. Pronto! Reiniciar servidor:**
```bash
npm run dev
```

### 📚 Documentação

- **Guia Completo**: [docs/SPEECH_SERVICES_GUIDE.md](docs/SPEECH_SERVICES_GUIDE.md)
- **Quick Start**: [SPEECH_MIGRATION_QUICKSTART.md](SPEECH_MIGRATION_QUICKSTART.md)
- **Resumo Técnico**: [SPEECH_MIGRATION_SUMMARY.md](SPEECH_MIGRATION_SUMMARY.md)

### 🧪 Testar

```bash
# Com servidor rodando
node test-speech-services.js
```

### 💰 Economia

Passando de Azure para Whisper + pyttsx3: **~$0/mês** (era $15-50/mês)

---

Veja [SPEECH_MIGRATION_QUICKSTART.md](SPEECH_MIGRATION_QUICKSTART.md) para mais detalhes!
