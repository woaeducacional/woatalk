# 🌊 WOA TALK - Plataforma Gamificada de Ensino de Inglês

A plataforma **WOA Talk** é uma aplicação inovadora de aprendizado de idiomas baseada em gamificação épica, onde o aluno embarca em uma **jornada narrativa do fundo do oceano até a superfície**, acumulando conhecimento de inglês através do método **WOA (Discover → Practice → Command)**.

## 🎯 Visão Geral

**WOA Talk** gamifica o aprendizado de inglês com:
- 🌊 **Narrativa épica** - Jornada oceânica que evolui através de 20 fases (oceanos/mares)
- 🎮 **Mecânicas viciantes** - Duolingo-style : XP, Streaks, Badges, WOA Coins
- 🧠 **Método WOA** - Discover (descoberta) → Practice (prática) → Command (comando)
- 📱 **Experiência mobile-first** - Design responsivo e intuitivo
- 🔐 **Autenticação e Progressão** - Login Supabase com progresso persistente

---

## 🚀 Stack Técnico

- **Frontend**: Next.js 14+ (React/TypeScript)
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Audio**: Web Audio API

---

## 📋 Funcionalidades Prioritárias (Issues)

### 1️⃣ Cadastro de Usuários
**Status**: Em Desenvolvimento  
**Descrição**: Funcionalidade essencial para criação de identidade do aluno, registro de progresso gamificado e habilitação de planos pagos.

**Requisitos**:
- Formulário de onboarding intuitivo
- Validação de e-mail e dados pessoais
- Foto de perfil (opcional)
- Integração com Supabase Auth

---

### 2️⃣ Autenticação e Acesso de Conta
**Status**: Em Desenvolvimento  
**Descrição**: Permite que o aluno acesse sua conta, recupere progresso gamificado e tenha acesso a recursos pagos vinculados ao perfil.

**Requisitos**:
- Login com e-mail/senha
- Recuperação de senha
- Sessão persistente
- Acesso a recursos pagos por perfil

---

### 3️⃣ Fase 2 - Atlantic Ocean (Lesson 02)
**Status**: Planejamento  
**Descrição**: Primeira jornada gamificada onde o aluno aprende a se apresentar em inglês (nome, endereço, profissão).

#### Narrativa
```
Você está nas profundezas do oceano (3200m).
Conforme aprende inglês, sobe em direção à superfície.
Cada missão concluída = mais luz no oceano.
```

#### Curiosidade da Fase
O Oceano Atlântico separa dois grandes mundos (América e Europa) e conecta culturas e línguas há séculos. Assim como exploradores atravessaram o Atlântico para descobrir novos mundos, você está atravessando o idioma inglês para descobrir novas oportunidades.

#### Estrutura Técnica
```
LEVEL → PHASE → LESSON → MISSION → EXERCISE
 ↓        ↓        ↓         ↓          ↓
 1        2       02        9         6 tipos
```

**Lesson 02 - Introduce Yourself** (9 Missões)
| Missão | Tipo | XP | Descrição |
|--------|------|----|----|
| 1 - Discover | Listen & Repeat | 20 | Escute e repita diálogos sobre apresentação pessoal |
| 2 - Name Builder | Preencher em branco | 30 | Escolha a palavra correta para: "My first name is ___" |
| 3 - Order Sentence | Ordenar palavras | 30 | Organize: "is / My / Oliver / first / name" |
| 4 - Listen & Select | Múltipla escolha | 30 | Ouça a pergunta e escolha a resposta correta |
| 5 - Address | Preencher em branco | 30 | Complete: "I live in ___" |
| 6 - Phone Number | Montar número | 30 | Arrange: "My phone number is ___" |
| 7 - Origin | Preencher em branco | 30 | Complete: "I am from ___" |
| 8 - Profession | Múltipla escolha | 30 | Escolha a profissão correta |
| 9 - Speak Mode | Gravação de voz | 50 | Grave-se apresentando em inglês |

**Total da Fase**: 200 XP

---

### 4️⃣ Sistema de WOA Coins (Moeda Virtual)
**Status**: Planejamento  
**Descrição**: Moeda virtual que reforça gamificação e aumenta engajamento. Recompensa por completar missões, manter streaks e participar de atividades.

**Requisitos**:
- Banco de dados para saldo de coins
- APIs para consulta e atualização
- Componentes visuais de exibição no frontend
- Economia: XP → Coins (conversão)
- Uso: Desbloquear fases, itens visuais, badges

---

### 5️⃣ Limite Diário de Erros
**Status**: Planejamento  
**Descrição**: Previne frustração excessiva e incentiva pausas conscientes. Estimula retorno diário mantendo sensação de evolução.

**Requisitos**:
- Contador de erros por dia
- Limite configurável (sugestão: 5 erros)
- Reset automático a cada 24h
- Feedback claro ao atingir limite
- Opção de revisão sem perda de progresso

---

### 6️⃣ Sistema de XP (Experiência)
**Status**: Planejamento  
**Descrição**: Núcleo da gamificação. Cada ação concluída gera XP que desbloqueia fases e mantém engajamento.

**Requisitos**:
- Acúmulo persistente no banco de dados
- Feedback visual imediato
- Marcos importantes com motivação
- Desbloqueia fases quando atinge limites
- Acessível em qualquer dispositivo

**Distribuição de XP**:
- Discover: 20 XP
- Exercícios: 30 XP
- Speak Mode: 50 XP

---

### 7️⃣ Sistema de Streak
**Status**: Planejamento  
**Descrição**: Incentiva consistência diária com badges e recompensas.

**Badges**:
- 3 dias seguidos → 🪸 **Coral Badge**
- 7 dias → 🧭 **Explorer Badge**
- 30 dias → 👑 **Ocean Master Badge**

---

## 🗺️ Estrutura do Mapa de Progresso

```
          ☀️ SURFACE
            (Céu)
            ↑
      Continentes
      (Level 2+)
            ↑
     Shallow Waters
     (Level 1: Fases 15-20)
            ↑
     Twilight Zone
     (Level 1: Fases 8-14)
            ↑
  ┌─────────────────────┐
  │  Atlantic Ocean     │ ← VOCÊ ESTÁ AQUI (Fase 2)
  │  Depth: 3200m      │
  └─────────────────────┘
            ↑
     Pacific Ocean
            ↑
   Indian Ocean
            ↑
   Arctic Ocean
            ↑
🌊 Ocean Abyss
   (Nível 1: Fases 1-7)
```

---

## 🧩 Modelo de Dados

```
Level
├── id
├── name (Pacific Ocean, Atlantic Ocean, etc.)
├── type (Ocean)
└── order

Phase
├── id
├── level_id
├── name
├── order
├── curiosity
└── depth (em metros)

Lesson
├── id
├── phase_id
├── title (Introduce Yourself)
├── description
└── total_missions

Mission
├── id
├── lesson_id
├── type (DISCOVER, PRACTICE, COMMAND)
├── order
└── xp_reward

Exercise
├── id
├── mission_id
├── question
├── answer
├── type (LISTEN_REPEAT | MULTIPLE_CHOICE | WORD_ORDER | FILL_BLANK | SPEAK | MATCH)
├── audio_url (opcional)
└── difficulty

User
├── id
├── email
├── name
├── xp_total
├── coins_balance
├── current_phase
├── errors_today
└── last_error_reset

UserProgress
├── id
├── user_id
├── lesson_id
├── completed
├── xp_earned
├── completed_at
└── streak_count

UserBadges
├── id
├── user_id
├── badge_type (CORAL | EXPLORER | OCEAN_MASTER)
└── unlocked_at
```

---

## 6️⃣ Tipos de Exercícios

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **LISTEN_REPEAT** | Escutar e repetir áudio | Áudio: "Hi! What's your name?" → Usuário repete |
| **MULTIPLE_CHOICE** | Escolher entre opções | "What is your job?" → [A) Teacher] [B) House] [C) Name] |
| **WORD_ORDER** | Ordenar palavras para formar frase | [is] [My] [Oliver] [first] [name] → "My first name is Oliver" |
| **FILL_BLANK** | Preencher palavra em branco | "My first name is ___" → digitr "Oliver" |
| **SPEAK** | Gravar resposta de voz | Prompt: "Introduce yourself" → grava áudio |
| **MATCH** | Correlacionar palavras/frases | Ligar "teacher" com "uma profissão" |

---

## 📱 Componentes Frontend (React/Next.js)

```
src/components/
├── OceanMap.tsx              (mapa interativo do progresso)
├── LessonPlayer.tsx          (reprodutor da lição)
├── MissionCard.tsx           (card de missão)
├── ExerciseEngine.tsx        (motor principal de exercícios)
├── VoiceRecorder.tsx         (gravador de voz)
├── XPProgress.tsx            (barra de progresso XP)
├── StreakCounter.tsx         (contador de dias)
└── BadgeDisplay.tsx          (badges conquistadas)
```

---

## ⚙️ Algoritmo de Progressão

```javascript
if (lesson_completed === true && xp_earned >= xp_required) {
  unlock_next_phase();
  show_celebration();
  update_ocean_map();
}
```

---

## 🎮 Experiência Psicológica

O design da **WOA Talk** cria:
- ✨ **Curiosidade** - O que há na próxima fase?
- 🗺️ **Exploração** - Sensação de jornada épica
- 📈 **Evolução** - Subir do fundo do oceano para a luz
- 🎯 **Descoberta** - Progresso narrativo e linguístico

Isso gera **dopamina de progresso** contínua, mantendo o usuário engajado.

---

## 🚀 Diferencial Competitivo

| Aspecto | Duolingo | WOA Talk |
|---------|----------|---------|
| Gamificação | Mascote + pontos | Jornada épica |
| Narrativa | Bebê para adulto | Oceano → Terra → Planetas |
| Engajamento | Streaks | Streaks + XP + Coins + Badges |
| Sensação | Progresso linear | Imersão em mundo vivo |

---

## 📚 Plano de Implementação

- [ ] **Fase 1**: Autenticação + Cadastro de Usuários
- [ ] **Fase 2**: Estrutura de Lições + Exercícios
- [ ] **Fase 3**: Gamificação (XP, Coins, Badges)
- [ ] **Fase 4**: Lesson 02 - Atlantic Ocean
- [ ] **Fase 5**: Sistema de Áudio + Voice Recording
- [ ] **Fase 6**: Mapa Visual + Narrativa
- [ ] **Fase 7**: 20 Fases Completas (Level 1)

---

## 📞 Contato & Suporte

Para contribuir ou reportar bugs, abra uma issue neste repositório.

---

**WOA Talk** - *Onde a linguagem é uma jornada épica.* 🌊✨