# 🎤 Speech Services Migration - Quick Start

## O que foi implementado?

Sua API do Azure Speech expirou. Implementei uma **camada abstrata** que permite alternar entre múltiplos provedores:

✅ **Azure Speech** (original - mantém compatibilidade)  
✅ **Whisper** (local, gratuito, sem limites) - STT  
✅ **pyttsx3** (local, gratuito, sem limites) - TTS  

---

## 🚀 Começar com Whisper + pyttsx3 (Gratuito)

### 1️⃣ Instalar dependências Python

**Windows (PowerShell):**
```powershell
.\SPEECH_SETUP.ps1
```

**Linux/Mac:**
```bash
chmod +x SPEECH_SETUP.sh
./SPEECH_SETUP.sh
```

**Manual:**
```bash
pip install openai-whisper pyttsx3
```

### 2️⃣ Configurar `.env.local`

```env
# Mudar para local providers (gratuito)
SPEECH_STT_PROVIDER="whisper"
SPEECH_TTS_PROVIDER="pyttsx3"

# Tamanho do modelo Whisper (base = bom balanço)
# Opções: tiny, base, small, medium, large
WHISPER_MODEL_SIZE="base"
```

### 3️⃣ Reiniciar servidor

```bash
npm run dev
```

### 4️⃣ Testar

```bash
# STT - enviar áudio, receber texto
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio":"base64_encoded_audio"}'

# TTS - enviar texto, receber áudio
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"female"}'
```

---

## 🔄 Voltar para Azure (Se Precisar)

Quando tiver uma nova API key do Azure:

```env
SPEECH_STT_PROVIDER="azure"
SPEECH_TTS_PROVIDER="azure"
AZURE_SPEECH_KEY="nova-chave-aqui"
AZURE_SPEECH_REGION="eastus"
```

**Nenhuma mudança de código necessária!** ✨

---

## 📊 Comparação

| Aspecto | Azure | Whisper + pyttsx3 |
|---------|-------|-------------------|
| Custo | Pago | Gratuito |
| Limites | Sim | Não |
| Setup | 1 min | 5 min |
| Privacidade | Cloud | Local |
| Qualidade | Excelente | Muito Boa |

---

## 📚 Documentação Completa

Ver: [docs/SPEECH_SERVICES_GUIDE.md](docs/SPEECH_SERVICES_GUIDE.md)

---

## ⚠️ Notas Importantes

### Whisper (STT)
- **Primeira execução:** Lento (~60s) pois baixa o modelo (~1.5GB)
- **Próximas execuções:** Mais rápido (modelo em cache)
- **Model size:** Quanto menor (tiny), mais rápido; quanto maior (large), mais preciso

### pyttsx3 (TTS)
- **Qualidade:** Um pouco inferior ao Azure, mas totalmente aceitável
- **Vozes:** Usa vozes do sistema operacional
- **Performance:** Rápido, tipicamente 2-5 segundos

---

## 🆘 Troubleshooting

**Erro: "whisper command not found"**
```bash
pip install openai-whisper
```

**Erro: "pyttsx3 not found"**
```bash
pip install pyttsx3
```

**Whisper muito lento**
- Usar modelo menor: `WHISPER_MODEL_SIZE="tiny"`
- Primeira execução é sempre lenta

---

## ✅ Resumo da Implementação

### Arquivos criados/modificados:

**Novos:**
- `lib/speech/` - Camada abstrata de providers
  - `types.ts` - Interfaces e tipos
  - `azure.ts` - Provider Azure (original)
  - `whisper.ts` - Provider Whisper local
  - `pyttsx3.ts` - Provider pyttsx3 local
  - `config.ts` - Factory e configuração
  - `index.ts` - Exports

- `docs/SPEECH_SERVICES_GUIDE.md` - Documentação detalhada
- `SPEECH_SETUP.ps1` - Setup automático (Windows)
- `SPEECH_SETUP.sh` - Setup automático (Linux/Mac)

**Modificados:**
- `app/api/transcribe/route.ts` - Agora usa abstraçao
- `app/api/tts/route.ts` - Agora usa abstração
- `.env.local` - Novas variáveis de configuração

### Código refatorado:

✅ Mantém compatibilidade 100% com Azure  
✅ Fácil de alternar entre providers  
✅ Sem breaking changes  
✅ Type-safe com TypeScript  

---

## 🎯 Próximos Passos

1. Executar `SPEECH_SETUP.ps1` ou `SPEECH_SETUP.sh`
2. Editar `.env.local` com os novos providers
3. Testar em desenvolvimento
4. Se estiver ok, fazer deploy
5. Deletar credenciais Azure se não precisar mais

Pronto! 🚀
