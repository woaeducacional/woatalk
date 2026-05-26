# 📧 Sistema de Emails de Evolução (Ofensiva) - 2x por Semana

## 📋 Visão Geral

Este sistema envia emails automáticos **2x por semana** informando aos usuários:
- **XP Total** ganho
- **Moedas** acumuladas  
- **Sequência de Dias** (streak)
- **Fase Atual** no jogo
- Motivação para continuar evoluindo

---

## 🚀 Setup Rápido

### 1️⃣ Executar Migração de Banco de Dados

Execute a migração SQL em seu Supabase:

```sql
-- c:\Users\Avell\woatalk\db\migrations\add_email_tracking.sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_evolution_email_sent_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_evolution_email 
ON users(last_evolution_email_sent_at, email_verified);
```

### 2️⃣ Configurar Variável de Ambiente

Adicione em `.env.local`:

```env
# Secret para autenticação do cron job
CRON_SECRET=seu_secret_muito_seguro_aqui_123456
```

⚠️ **Use um secret forte e aleatório** (pelo menos 32 caracteres)

### 3️⃣ Testar Local (Opcional)

```bash
curl -X POST http://localhost:3000/api/cron/send-evolution-emails \
  -H "Authorization: Bearer seu_secret_muito_seguro_aqui_123456" \
  -H "Content-Type: application/json"
```

---

## 🔄 Opções de Agendamento

### **OPÇÃO 1: Vercel Cron (Recomendado para Deploy Vercel)**

1. Edite `vercel.json` na raiz:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-evolution-emails",
      "schedule": "0 9 * * 1,4"
    }
  ]
}
```

**Explicação:**
- `0 9` = 9:00 AM UTC
- `* * *` = Todo mês, todo dia
- `1,4` = Segunda (1) e Quinta (4)

Deploy para Vercel:
```bash
git add .
git commit -m "Add cron for evolution emails"
git push origin main
```

---

### **OPÇÃO 2: EasyCron (Serviço Gratuito)**

1. Acesse: **https://www.easycron.com**
2. Crie uma nova conta (gratuito até 100 execuções/mês)
3. Clique em "Add a Cron Job"
4. Configure:
   - **URL**: `https://seu-site.vercel.app/api/cron/send-evolution-emails`
   - **Request Method**: `POST`
   - **HTTP Headers**: 
     ```
     Authorization: Bearer seu_secret_muito_seguro_aqui_123456
     ```
   - **Frequency**: `Every 3.5 days` ou `Twice a week`

5. Salve e ative!

---

### **OPÇÃO 3: Cron-job.org (Alternativa Gratuita)**

1. Acesse: **https://cron-job.org**
2. Clique em "Create cronjob"
3. Configure:
   - **URL**: `https://seu-site.vercel.app/api/cron/send-evolution-emails`
   - **Request Method**: `POST`
   - **HTTP Headers**:
     ```
     Authorization: Bearer seu_secret_muito_seguro_aqui_123456
     ```
   - **Execution times**: Selecione segunda e quinta

4. Execute!

---

### **OPÇÃO 4: GitHub Actions (Gratuito no GitHub)**

1. Crie `.github/workflows/cron-emails.yml`:

```yaml
name: Send Evolution Emails

on:
  schedule:
    # Segundas e quintas às 9:00 UTC
    - cron: '0 9 * * 1,4'

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X POST ${{ secrets.DEPLOYMENT_URL }}/api/cron/send-evolution-emails \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

2. Adicione secrets no GitHub:
   - `DEPLOYMENT_URL`: `https://seu-site.vercel.app`
   - `CRON_SECRET`: seu secret

---

### **OPÇÃO 5: NodeCron Local (Desenvolvimento)**

Para testar localmente com agendamento automático:

```bash
npm install node-cron
```

Crie `scripts/cron-scheduler.js`:

```javascript
const cron = require('node-cron')

// Executar 2x por semana (segunda e quinta às 9:00 AM)
cron.schedule('0 9 * * 1,4', async () => {
  console.log('Running evolution email cron...')
  
  try {
    const response = await fetch('http://localhost:3000/api/cron/send-evolution-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    console.log('✅ Cron completed:', data)
  } catch (error) {
    console.error('❌ Cron error:', error)
  }
})

console.log('📅 Cron scheduler started. Emails scheduled for Mon/Thu at 09:00')
```

Execute com:
```bash
node scripts/cron-scheduler.js
```

---

## 🧪 Testar Manualmente

### Via cURL:

```bash
curl -X POST https://seu-site.vercel.app/api/cron/send-evolution-emails \
  -H "Authorization: Bearer seu_secret_muito_seguro_aqui_123456" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Via Postman:

1. **URL**: `POST https://seu-site.vercel.app/api/cron/send-evolution-emails`
2. **Headers**:
   - `Authorization`: `Bearer seu_secret_muito_seguro_aqui_123456`
   - `Content-Type`: `application/json`
3. Clique **Send**

### Resposta esperada:

```json
{
  "success": true,
  "message": "Emails enviados com sucesso. 15 enviados, 0 erros",
  "sent": 15,
  "failed": 0
}
```

---

## 📊 Como Funciona

1. **Busca**: Procura usuários com email verificado que não receberam email nos últimos 3 dias
2. **Filtragem**: Limita a 100 usuários por execução (para não sobrecarregar)
3. **Envio**: Para cada usuário, envia email personalizado com:
   - Nome do usuário
   - Estatísticas de progresso
   - Motivação personalizada baseada no streak
4. **Rastreamento**: Atualiza `last_evolution_email_sent_at` para não enviar spam
5. **Logging**: Registra sucesso/erros em console

---

## 📈 Frequência Recomendada

| Estratégia | Frequência | Benefício |
|-----------|-----------|----------|
| **2x por semana** | Segunda + Quinta | ✅ Ótimo equilíbrio entre engagement e não spam |
| 1x por semana | Só segunda | Menos spam, menos engagement |
| 3x por semana | Seg + Qua + Sex | Mais engagement, risco de unsubscribe |

---

## 🔐 Segurança

- ✅ Autenticação via Bearer token (`CRON_SECRET`)
- ✅ Verifica email_verified antes de enviar
- ✅ Limita 100 emails por execução
- ✅ Delay de 100ms entre emails (respeita rate limit Resend)
- ✅ Sem informações sensíveis no email

---

## 📝 Customizar Email

Para mudar o template do email, edite a função `sendEvolutionEmail()` em:

```
lib/email.ts (linhas ~200-350)
```

Você pode personalizar:
- Cores e design
- Mensagens de motivação
- Links de CTA
- Emojis e tonalidade

---

## 🚨 Troubleshooting

### "Unauthorized" ao testar

❌ Verifique se `CRON_SECRET` está correto e presente em `.env.local`

### Emails não são enviados

❌ Verifique:
- [ ] Migração SQL executada (`last_evolution_email_sent_at` coluna existe)
- [ ] `RESEND_API_KEY` configurada
- [ ] Usuários têm `email_verified = true`
- [ ] Último email enviado > 3 dias atrás

### "RESEND_API_KEY não configurada"

❌ Adicione em `.env.local`:
```env
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=seu-dominio@resend.dev
```

### Muito poucos emails sendo enviados

Possível causa: Muitos usuários já receberam email recentemente
- Solução: Reduza o intervalo de 3 dias para testar

---

## 📊 Monitorar Execução

### Ver logs em tempo real (Vercel):

```bash
vercel logs --function api/cron/send-evolution-emails
```

### Ver erros no console do navegador:

Visite: `https://seu-site.vercel.app/api/cron/send-evolution-emails`

Deverá retornar `401 Unauthorized` (sem token - esperado)

---

## ✅ Checklist Final

- [ ] Migração SQL executada no Supabase
- [ ] `CRON_SECRET` adicionado em `.env.local`
- [ ] Cron job configurado (Vercel/EasyCron/GitHub Actions)
- [ ] Teste manual realizado com sucesso
- [ ] Emails recebidos na caixa de entrada de teste
- [ ] Deploy para produção realizado
- [ ] Monitoramento ativado

---

## 🎯 Resultado

Seus usuários agora recebem **2x por semana** emails motivacionais mostrando sua evolução, o que aumenta:
- ✅ Engajamento
- ✅ Retenção
- ✅ Sensação de progresso
- ✅ Motivação para voltar ao app

Sucesso! 🚀
