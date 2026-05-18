# 🆘 Speech Services - Troubleshooting & FAQs

## ❓ FAQs

### P: Qual provider devo usar?

**R:** Depende do seu caso de uso:

- **Desenvolvi local**: Whisper + pyttsx3 (gratuito, sem limites)
- **Produção confiável**: Azure (se tiver budget)
- **Melhor custo/benefício**: Whisper + pyttsx3

### P: Whisper é muito lento. Posso deixar mais rápido?

**R:** Sim! Usar modelo menor:
```env
WHISPER_MODEL_SIZE="tiny"    # Mais rápido, menos preciso
WHISPER_MODEL_SIZE="base"    # Balanceado (recomendado)
WHISPER_MODEL_SIZE="small"   # Mais preciso, mais lento
```

**Tempos (primeira execução):**
- tiny: ~30s
- base: ~60s  
- small: ~120s
- medium: ~240s
- large: ~300s

**Próximas execuções: 50% mais rápido**

### P: Posso alternar entre providers em runtime?

**R:** Sim! Editar `.env.local` e reiniciar servidor:
```env
# Agora Azure
SPEECH_STT_PROVIDER="azure"

# Editar e reiniciar servidor
# npm run dev
```

### P: Preciso manter Azure como fallback?

**R:** Sim! Os provedores locais podem ter problemas. Manter Azure instalado é seguro (não paga se não usar).

### P: Quanto de storage o Whisper usa?

**R:** Modelos em cache:
- tiny: ~75 MB
- base: ~140 MB
- small: ~466 MB
- medium: ~1.5 GB
- large: ~2.9 GB

---

## 🔴 Erros Comuns

### Erro: "whisper: command not found"

**Causa:** Whisper não está instalado

**Solução:**
```bash
pip install openai-whisper
```

### Erro: "ModuleNotFoundError: No module named 'whisper'"

**Causa:** Python não vê o pacote

**Solução:**
```bash
# Reinstalar
pip uninstall openai-whisper
pip install openai-whisper

# Ou usar Python diretamente
python -m pip install openai-whisper
```

### Erro: "pyttsx3 not found"

**Causa:** pyttsx3 não está instalado

**Solução:**
```bash
pip install pyttsx3
```

### Erro: "No module named 'pyttsx3'"

**Causa:** Python não vê o pacote

**Solução:**
```bash
python -m pip install pyttsx3
```

### Erro: "No audio output" (pyttsx3)

**Causa:** Drivers de áudio não configurados

**Solução:**
- Windows: Verificar Volume Master
- Linux: Instalar pulseaudio: `sudo apt-get install pulseaudio`
- Mac: Verificar System Preferences > Sound

### Erro: "Azure error: 401 Unauthorized"

**Causa:** Chave Azure expirou ou inválida

**Solução:**
```env
SPEECH_STT_PROVIDER="whisper"    # Mudar para local
SPEECH_TTS_PROVIDER="pyttsx3"    # Mudar para local
```

### Erro: "Transcription timeout"

**Causa:** Áudio muito longo ou modelo muito pequeno

**Solução:**
- Aumentar timeout no config
- Usar modelo maior: `WHISPER_MODEL_SIZE="small"`
- Dividir áudio em pedaços menores

### Erro: "ffmpeg not found" (pyttsx3)

**Causa:** ffmpeg não está instalado

**Solução:**
```bash
# Windows (with Chocolatey)
choco install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Mac
brew install ffmpeg
```

### Erro: "Port 3000 already in use"

**Causa:** Servidor já está rodando

**Solução:**
```bash
# Encontrar processo
lsof -i :3000

# Ou matar
kill -9 <PID>

# Depois iniciar novo
npm run dev
```

### Erro: Node modules incorreto

**Causa:** Dependências desincronizadas

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## ⚠️ Avisos Importantes

### ⚡ Primeira Execução Lenta
- Whisper baixa o modelo na primeira use (~1.5GB)
- Isso é normal e só acontece uma vez
- Próximas execuções serão rápidas (modelo em cache)

### 💻 Requisitos de Hardware
- **Mínimo:** 2GB RAM, 2GB storage
- **Recomendado:** 4GB RAM, 5GB storage

### 🔒 Privacidade
- Whisper roda localmente = sem enviar áudio para ninguém
- Azure envia dados para cloud = menos privado
- pyttsx3 roda localmente = sem privacidade

### ⏱️ Performance
- Whisper: 5-60s por áudio (depende do model size)
- pyttsx3: 2-5s por síntese
- Azure: 2-5s (mais consistente)

---

## 🔧 Debug

### Ver qual provider está ativo

**Opção 1:** Ver logs no console
```bash
npm run dev
# Procurar por "Speech Configuration:"
```

**Opção 2:** Fazer teste
```bash
node test-speech-services.js
# Mostrará qual provider está em uso
```

### Ver variáveis de ambiente

```bash
# Linux/Mac
env | grep SPEECH

# Windows PowerShell
Get-ChildItem env: | Where-Object {$_.Name -like "SPEECH*"}
```

### Testar Python diretamente

```bash
# Testar Whisper
python -c "import whisper; print(whisper.__version__)"

# Testar pyttsx3
python -c "import pyttsx3; print('OK')"
```

---

## 🚀 Otimizações

### Para produção com Azure

```env
# Usar cache agressivo
CACHE_CONTROL="public, max-age=86400"  # 1 dia

# Usar região mais próxima do usuário
AZURE_SPEECH_REGION="westeurope"  # ou outro
```

### Para produção com Whisper

```env
# Usar modelo menor para performance
WHISPER_MODEL_SIZE="base"

# Pre-download modelo para evitar delay na primeira execução
# python -c "import whisper; whisper.load_model('base')"
```

### Para produção com pyttsx3

```env
# Cachear sínteses comuns
# Implementar em redis/memcached
```

---

## 📞 Recursos de Ajuda

- **GitHub Issues**: https://github.com/openai/whisper/issues
- **Whisper Docs**: https://github.com/openai/whisper
- **pyttsx3 Docs**: https://pyttsx3.readthedocs.io/
- **Azure Docs**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/

---

## ✅ Checklist de Debug

- [ ] Python está instalado? `python --version`
- [ ] Whisper está instalado? `pip show openai-whisper`
- [ ] pyttsx3 está instalado? `pip show pyttsx3`
- [ ] `.env.local` tem as variáveis? (SPEECH_STT_PROVIDER, etc)
- [ ] Servidor está rodando? `npm run dev`
- [ ] Teste passou? `node test-speech-services.js`
- [ ] Logs mostram provider correto?
- [ ] Áudio é válido (WAV, MP3, etc)?

---

Ainda com problemas? Verifique os logs completos:

```bash
npm run dev 2>&1 | tee debug.log
# Procure por "error" ou "Speech Configuration"
```
