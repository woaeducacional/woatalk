# Speech Services Configuration Guide

## 📋 Visão Geral

O projeto agora suporta múltiplos provedores para **Speech-to-Text (STT)** e **Text-to-Speech (TTS)**:

- **Azure Speech Services** (pago, mas com API key expirando)
- **Whisper (Local)** - Transcrição sem limites (gratuito)
- **pyttsx3 (Local)** - Síntese de voz sem limites (gratuito)

---

## 🔧 Configuração do .env.local

### 1. Alternar de Provider

Edite `.env.local`:

```env
# STT Provider: 'azure' ou 'whisper'
SPEECH_STT_PROVIDER="whisper"

# TTS Provider: 'azure' ou 'pyttsx3'
SPEECH_TTS_PROVIDER="pyttsx3"
```

### 2. Configuração por Provider

#### Azure Speech Services (Atual)
```env
SPEECH_STT_PROVIDER="azure"
SPEECH_TTS_PROVIDER="azure"
AZURE_SPEECH_KEY="seu-key-aqui"
AZURE_SPEECH_REGION="eastus"
```

#### Whisper Local (STT)
```env
SPEECH_STT_PROVIDER="whisper"
WHISPER_MODEL_SIZE="base"  # tiny, base, small, medium, large
```

**Requisitos:**
```bash
pip install openai-whisper
```

#### pyttsx3 Local (TTS)
```env
SPEECH_TTS_PROVIDER="pyttsx3"
```

**Requisitos:**
```bash
pip install pyttsx3
```

---

## 💻 Instalação das Dependências

### Opção 1: Usar Whisper + pyttsx3 (Gratuito, Sem Limites)

```bash
# Instalar Python (se não tiver)
# Windows: https://www.python.org/downloads/

# Instalar pacotes Python
pip install openai-whisper pyttsx3

# Opcionalmente, para melhor compatibilidade com áudio
pip install librosa soundfile scipy
```

### Opção 2: Manter Azure (Com Limite de Uso)

Nenhuma instalação extra necessária! Já está funcionando com a API key existente.

### Opção 3: Usar Google Cloud (Alternativa Paga Mas Barata)

```bash
npm install @google-cloud/speech @google-cloud/text-to-speech
```

---

## 🚀 Como Usar

### Scenario 1: Mudar para Whisper + pyttsx3 (Gratuito)

```env
# .env.local
SPEECH_STT_PROVIDER="whisper"
SPEECH_TTS_PROVIDER="pyttsx3"
WHISPER_MODEL_SIZE="base"
```

**Próximos passos:**
1. Instalar dependências Python acima
2. Reiniciar servidor: `npm run dev`
3. Testar transcrição em `/api/transcribe`

### Scenario 2: Voltar para Azure Quando Quiser

```env
# .env.local
SPEECH_STT_PROVIDER="azure"
SPEECH_TTS_PROVIDER="azure"
AZURE_SPEECH_KEY="seu-key"
AZURE_SPEECH_REGION="eastus"
```

---

## 📊 Comparação de Providers

| Aspecto | Azure | Whisper | pyttsx3 |
|---------|-------|---------|---------|
| **Custo** | Pago | Gratuito | Gratuito |
| **Limites** | Sim (API expirou) | Não | Não |
| **Qualidade STT** | Excelente | Muito Boa | N/A |
| **Qualidade TTS** | Excelente | N/A | Boa |
| **Setup** | Fácil (key) | Médio (Python) | Médio (Python) |
| **Latência** | Depende da API | 5-60s* | 2-5s* |
| **Privacidade** | Cloud | Local | Local |

*Depend da duração do áudio e model size

---

## 🔍 Troubleshooting

### Erro: "Whisper not found"
```bash
# Instalar Whisper
pip install openai-whisper
```

### Erro: "pyttsx3 not found"
```bash
# Instalar pyttsx3
pip install pyttsx3
```

### Erro: "ffmpeg not found" (para pyttsx3)
```bash
# Windows (usando chocolatey)
choco install ffmpeg

# Ou baixar manualmente: https://ffmpeg.org/download.html
```

### Whisper lento na primeira execução
- Primeira vez: ~5-60s (baixando modelo ~1.5GB)
- Próximas vezes: mais rápido (modelo em cache)

### pyttsx3 sem som
- Verificar se drivers de áudio estão instalados
- Testar com: `python -c "import pyttsx3; e = pyttsx3.init(); e.say('test'); e.runAndWait()"`

---

## 🔧 Código Interno

### Usar providers diretamente

```typescript
import { getSTTProvider, getTTSProvider } from '@/lib/speech'

// STT
const sttProvider = getSTTProvider()
const transcript = await sttProvider.transcribe(audioBuffer)

// TTS
const ttsProvider = getTTSProvider()
const audioBuffer = await ttsProvider.synthesize('Hello world')
```

### Criar provider customizado

```typescript
import { STTProvider } from '@/lib/speech'

class MyCustomProvider implements STTProvider {
  name = 'My Custom Provider'
  
  async transcribe(audioBuffer: Buffer): Promise<string> {
    // Sua implementação
    return 'transcribed text'
  }
}
```

---

## 📚 Recursos Externos

- **Whisper**: https://github.com/openai/whisper
- **pyttsx3**: https://pyttsx3.readthedocs.io/
- **Azure Speech**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
- **Google Cloud Speech**: https://cloud.google.com/speech-to-text

---

## ✅ Próximos Passos

1. **Testar Whisper:**
   ```bash
   pip install openai-whisper
   # Editar .env.local: SPEECH_STT_PROVIDER="whisper"
   # Testar em: POST /api/transcribe
   ```

2. **Testar pyttsx3:**
   ```bash
   pip install pyttsx3
   # Editar .env.local: SPEECH_TTS_PROVIDER="pyttsx3"
   # Testar em: POST /api/tts
   ```

3. **Monitorar performance** e fazer ajustes conforme necessário.
