// Tipos para o sistema de Lições e Missões

export type MissionType = 
  | 'discover'
  | 'name-builder'
  | 'order-sentence'
  | 'listen-select'
  | 'address'
  | 'phone-number'
  | 'origin'
  | 'profession'
  | 'speak-mode'

export interface Exercise {
  id: string
  type: MissionType
  question?: string
  audio?: string
  options?: string[]
  correctAnswer?: string
  words?: string[]       // Para order-sentence: palavras injetadas do banco (já embaralha no componente)
  placeholder?: string
  xp: number
}

export interface Mission {
  id: number
  name: string
  type: MissionType
  description: string
  exercise: Exercise
  xp: number
}

export interface Lesson {
  id: number
  phaseId: number
  title: string
  narrative: string
  curiosity: string
  missions: Mission[]
}

export interface OceanPhase {
  id: number
  name: string
  depth: string
  color: string
  narrative: string
  curiosity: string
  lessonTitle?: string
  lesson?: Lesson
}

// Lista de 20 Oceanos e Mares
export const OCEAN_PHASES_DATA: OceanPhase[] = [
  {
    id: 1, name: 'Pacific Ocean', depth: '4.280m', color: '#0a1a2e',
    lessonTitle: 'The Alphabet',
    narrative: 'O maior oceano do mundo. O começo de tudo.',
    curiosity: 'O Pacífico é tão imenso que parece não ter fim. No começo do inglês, também parece assim — hoje você começa a mapear esse território.',
  },
  {
    id: 2, name: 'Atlantic Ocean', depth: '3.339m', color: '#1a1a3e',
    lessonTitle: 'Introduce Yourself',
    narrative: 'O Atlântico conectou mundos. Agora você conecta quem você é.',
    curiosity: 'O Atlântico liga dois continentes. Agora você liga quem você é em outra língua.',
  },
  {
    id: 3, name: 'Indian Ocean', depth: '3.970m', color: '#0f3a5c',
    lessonTitle: 'Talking About Things',
    narrative: 'Rotas comerciais nasceram aqui. Você começa a nomear o mundo.',
    curiosity: 'O Oceano Índico foi a grande rota do comércio mundial. Você começa a nomear o mundo em inglês.',
  },
  {
    id: 4, name: 'Arctic Ocean', depth: '1.205m', color: '#1a4d6d',
    lessonTitle: 'Counting Up to 20',
    narrative: 'No Ártico tudo é precisão. Números te dão controle.',
    curiosity: 'No Ártico, cada detalhe importa para sobreviver. Números te dão controle e precisão no inglês.',
  },
  {
    id: 5, name: 'Antarctic Ocean', depth: '4.500m', color: '#2d5a7b',
    lessonTitle: 'Counting from 20 to 1000',
    narrative: 'Frio extremo exige preparo. Suba de nível com números grandes.',
    curiosity: 'O Oceano Antártico é o mais isolado do mundo. Aqui você sobe de nível com números grandes.',
  },
  {
    id: 6, name: 'Mediterranean Sea', depth: '2.500m', color: '#1a5c7a',
    lessonTitle: 'Talking About the Time',
    narrative: 'O Mediterrâneo é o relógio de muitas civilizações.',
    curiosity: 'O Mediterrâneo foi o centro do mundo antigo. Agora você domina tempo e rotina em inglês.',
  },
  {
    id: 7, name: 'Caribbean Sea', depth: '2.754m', color: '#0f5c6b',
    lessonTitle: 'Days, Months and Years',
    narrative: 'Ilhas que parecem pequenas, mas mudam tudo.',
    curiosity: 'Ilhas caribenhas moldaram a história. Datas mudam conversas inteiras.',
  },
  {
    id: 8, name: 'South China Sea', depth: '5.016m', color: '#1a6d5c',
    lessonTitle: 'Ordinal Numbers',
    narrative: 'Rotas movimentadas exigem ordem.',
    curiosity: 'O Mar do Sul da China é a rota mais movimentada do mundo. Você organiza ideias: 1st, 2nd, 3rd...',
  },
  {
    id: 9, name: 'Arabian Sea', depth: '2.200m', color: '#2d5a7b',
    lessonTitle: 'How to Ask Questions',
    narrative: 'Quem pergunta, navega com bússola.',
    curiosity: 'O Mar Arábico foi a rota dos grandes exploradores. Perguntar é navegar com bússola — quem pergunta controla a conversa.',
  },
  {
    id: 10, name: 'Coral Sea', depth: '3.000m', color: '#0f4c5d',
    lessonTitle: 'Talking About the Weather',
    narrative: 'Corais são sinais de vida. Clima é small talk de verdade.',
    curiosity: 'Corais são os sinais de vida mais coloridos do oceano. Clima é small talk — você já conversa de verdade.',
  },
  {
    id: 11, name: 'Bering Sea', depth: '1.547m', color: '#2d5c7d',
    lessonTitle: 'How to Build Sentences',
    narrative: 'No Bering, tudo depende da rota. Aqui você aprende a rota da frase.',
    curiosity: 'O Mar de Bering liga dois continentes por uma rota exata. Aqui você aprende a rota das frases em inglês (SVO).',
  },
  {
    id: 12, name: 'Philippine Sea', depth: '4.000m', color: '#1a4c8f',
    lessonTitle: 'Verb To Be (Present)',
    narrative: 'To Be é a base do inglês: ser e estar.',
    curiosity: 'O Mar das Filipinas é profundo e essencial. "To be" é a base de tudo no inglês.',
  },
  {
    id: 13, name: 'Sea of Japan', depth: '3.742m', color: '#2d6d8f',
    lessonTitle: 'How to Speak in the Past Tense',
    narrative: 'Passado é memória. Você começa a contar histórias.',
    curiosity: 'O Mar do Japão guardou séculos de história. Você começa a contar histórias em inglês (wake → woke).',
  },
  {
    id: 14, name: 'Red Sea', depth: '2.600m', color: '#7a2d2d',
    lessonTitle: 'How to Ask Someone to Hang Out',
    narrative: 'O Mar Vermelho é passagem estratégica. Convites são passagem para a vida social.',
    curiosity: 'O Mar Vermelho é canal estratégico entre dois mundos. Convites em inglês são sua passagem para a vida social.',
  },
  {
    id: 15, name: 'Black Sea', depth: '1.253m', color: '#2d2d4d',
    lessonTitle: 'How to Talk About the Future',
    narrative: 'Planejar é enxergar longe. Going to é seu futuro ficando real.',
    curiosity: 'O Mar Negro é misterioso e profundo. "Going to" é o futuro se tornando real — você começa a planejar em inglês.',
  },
  {
    id: 16, name: 'Baltic Sea', depth: '459m', color: '#2d6d7f',
    lessonTitle: 'TH Sound — THE (ð)',
    narrative: 'Detalhes mudam tudo. Pronúncia certa te dá respeito instantâneo.',
    curiosity: 'O Mar Báltico é marcado por detalhes precisos de navegação. A pronúncia certa te dá respeito instantâneo.',
  },
  {
    id: 17, name: 'North Sea', depth: '570m', color: '#3d7d8f',
    lessonTitle: 'TH Sound — THANKS (θ)',
    narrative: 'Você afina o som. Agora seu inglês soa inglês.',
    curiosity: 'O Mar do Norte conecta nações do norte europeu. Você afina o som e seu inglês começa a soar de verdade.',
  },
  {
    id: 18, name: 'Gulf of Mexico', depth: '3.750m', color: '#2d6a3a',
    lessonTitle: 'How to Say "No" Politely',
    narrative: 'Dizer não é maturidade social. Você ganha controle sem ser rude.',
    curiosity: 'O Golfo do México é zona de equilíbrio entre forças. Você aprende a dizer "não" e ganhar controle sem ser rude.',
  },
  {
    id: 19, name: 'Sea of Okhotsk', depth: '838m', color: '#3d6d8f',
    lessonTitle: 'The Main Verb Tenses',
    narrative: 'Você enxerga o mapa inteiro dos tempos verbais. Agora tudo faz sentido.',
    curiosity: 'O Mar de Okhotsk guarda segredos em suas profundidades. Você finalmente enxerga o mapa completo dos tempos verbais.',
  },
  {
    id: 20, name: 'Tasman Sea', depth: '2.612m', color: '#4d8f8f',
    lessonTitle: 'To Be in the Past (WAS/WERE)',
    narrative: 'A Grande Subida. O passado não te prende — ele te dá história.',
    curiosity: 'O Mar de Tasman separa a Austrália da Nova Zelândia — você está quase na superfície. O passado te dá história. Agora você diz quem você era e como estava.',
  },
]

// Dados das Lições
export const LESSONS_DATA: Record<number, Lesson> = {
  2: {
    id: 2,
    phaseId: 2,
    title: 'Atlantic Ocean',
    narrative: 'You are rising. Você saiu das regiões mais profundas. Agora começa a enxergar formas e luz no oceano.',
    curiosity: 'O Oceano Atlântico separa dois grandes mundos: América e Europa. Durante séculos ele conectou culturas, línguas e civilizações. Assim como os exploradores atravessaram o Atlântico para descobrir novos mundos, você está atravessando o idioma inglês para descobrir novas oportunidades.',
    missions: [
      // ── CHECKPOINT 1 · Greetings (M1-10) ──────────────────────────
      { id: 1, name: 'First Contact', type: 'discover', description: 'Escute o diálogo de apresentação. Só ouça — não precisa entender tudo ainda.', exercise: { id: 'a2-m1', type: 'discover', audio: '/audio/dialog-exemplo.mp3', xp: 20 }, xp: 20 },
      { id: 2, name: 'Hello or Goodbye?', type: 'name-builder', description: 'Escolha a palavra certa.', exercise: { id: 'a2-m2', type: 'name-builder', question: '___ there! How are you?', options: ['Hi', 'Bye', 'Yes'], correctAnswer: 'Hi', xp: 25 }, xp: 25 },
      { id: 3, name: 'Good Morning', type: 'order-sentence', description: 'Organize as palavras.', exercise: { id: 'a2-m3', type: 'order-sentence', correctAnswer: 'Good morning everyone', xp: 25 }, xp: 25 },
      { id: 4, name: 'Listen: Greeting', type: 'listen-select', description: 'Escute e escolha.', exercise: { id: 'a2-m4', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which greeting did you hear?', options: ['Good morning', 'Good night', 'Good afternoon'], correctAnswer: 'Good morning', xp: 25 }, xp: 25 },
      { id: 5, name: 'See You Later', type: 'name-builder', description: 'Complete a despedida.', exercise: { id: 'a2-m5', type: 'name-builder', question: 'Goodbye, see you ___!', options: ['later', 'early', 'never'], correctAnswer: 'later', xp: 25 }, xp: 25 },
      { id: 6, name: 'How Are You?', type: 'listen-select', description: 'Identifique a pergunta correta.', exercise: { id: 'a2-m6', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: "How do you ask if someone's well?", options: ['How are you?', 'Where are you?', 'Who are you?'], correctAnswer: 'How are you?', xp: 25 }, xp: 25 },
      { id: 7, name: "I'm Fine", type: 'order-sentence', description: 'Organize a resposta clássica.', exercise: { id: 'a2-m7', type: 'order-sentence', correctAnswer: 'I am fine thank you', xp: 25 }, xp: 25 },
      { id: 8, name: 'Thanks!', type: 'name-builder', description: 'Complete a frase.', exercise: { id: 'a2-m8', type: 'name-builder', question: "I'm fine, ___!", options: ['thanks', 'sorry', 'please'], correctAnswer: 'thanks', xp: 25 }, xp: 25 },
      { id: 9, name: 'Nice to Meet You', type: 'listen-select', description: 'Escolha a expressão do primeiro encontro.', exercise: { id: 'a2-m9', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'What do you say meeting someone for the first time?', options: ['Nice to meet you', 'See you later', 'Good night'], correctAnswer: 'Nice to meet you', xp: 25 }, xp: 25 },
      { id: 10, name: '🏁 Speak: Greetings', type: 'speak-mode', description: 'Checkpoint 1 — Diga a frase em voz alta.', exercise: { id: 'a2-m10', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'Nice to meet you', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 2 · Your Name (M11-20) ─────────────────────────
      { id: 11, name: '🎤 Say: Your Name', type: 'speak-mode', description: 'Diga em voz alta como apresentar seu nome.', exercise: { id: 'a2-m11', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'My name is Oliver', xp: 30 }, xp: 30 },
      { id: 12, name: 'First Name', type: 'name-builder', description: 'Complete a apresentação de nome.', exercise: { id: 'a2-m12', type: 'name-builder', question: 'My ___ name is Oliver.', options: ['first', 'bad', 'old'], correctAnswer: 'first', xp: 25 }, xp: 25 },
      { id: 13, name: 'My Name Is', type: 'order-sentence', description: 'Organize a frase de apresentação.', exercise: { id: 'a2-m13', type: 'order-sentence', correctAnswer: 'My name is Oliver', xp: 25 }, xp: 25 },
      { id: 14, name: 'Last Name', type: 'listen-select', description: 'Identifique a frase sobre sobrenome.', exercise: { id: 'a2-m14', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence is about a last name?', options: ['My last name is Turner', 'I am from Brazil', 'I like music'], correctAnswer: 'My last name is Turner', xp: 25 }, xp: 25 },
      { id: 15, name: 'What IS Your Name?', type: 'name-builder', description: 'Qual verbo completa a pergunta?', exercise: { id: 'a2-m15', type: 'name-builder', question: 'What ___ your name?', options: ['is', 'are', 'am'], correctAnswer: 'is', xp: 25 }, xp: 25 },
      { id: 16, name: 'Ask the Question', type: 'order-sentence', description: 'Organize a pergunta sobre nome.', exercise: { id: 'a2-m16', type: 'order-sentence', correctAnswer: 'What is your name', xp: 25 }, xp: 25 },
      { id: 17, name: 'Middle Name', type: 'name-builder', description: 'Middle name = nome do meio.', exercise: { id: 'a2-m17', type: 'name-builder', question: 'My ___ name is Michael.', options: ['middle', 'big', 'short'], correctAnswer: 'middle', xp: 25 }, xp: 25 },
      { id: 18, name: 'Full Name', type: 'listen-select', description: 'Identifique a frase com nome completo.', exercise: { id: 'a2-m18', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence includes a full name?', options: ['My full name is Oliver Michael Turner', 'I am a teacher', 'Nice to meet you'], correctAnswer: 'My full name is Oliver Michael Turner', xp: 25 }, xp: 25 },
      { id: 19, name: 'Nice to Meet You, Oliver', type: 'order-sentence', description: 'Organize o cumprimento com nome.', exercise: { id: 'a2-m19', type: 'order-sentence', correctAnswer: 'Nice to meet you Oliver', xp: 25 }, xp: 25 },
      { id: 20, name: '🏁 Speak: Your Name', type: 'speak-mode', description: 'Checkpoint 2 — Diga a frase em voz alta.', exercise: { id: 'a2-m20', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'My name is Oliver', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 3 · Where Are You From? (M21-30) ───────────────
      { id: 21, name: '🎤 Say: Your Origin', type: 'speak-mode', description: 'Diga de onde você é em voz alta.', exercise: { id: 'a2-m21', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am from London', xp: 30 }, xp: 30 },
      { id: 22, name: 'I Am FROM', type: 'name-builder', description: 'Qual preposição usamos com "from"?', exercise: { id: 'a2-m22', type: 'name-builder', question: 'I am ___ London.', options: ['from', 'in', 'at'], correctAnswer: 'from', xp: 25 }, xp: 25 },
      { id: 23, name: 'I Am From London', type: 'order-sentence', description: 'Organize a frase de origem.', exercise: { id: 'a2-m23', type: 'order-sentence', correctAnswer: 'I am from London', xp: 25 }, xp: 25 },
      { id: 24, name: 'Where Are You From?', type: 'listen-select', description: 'Identifique a pergunta de origem.', exercise: { id: 'a2-m24', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which is the correct question about origin?', options: ['Where are you from?', 'What is your name?', 'How old are you?'], correctAnswer: 'Where are you from?', xp: 25 }, xp: 25 },
      { id: 25, name: "Sofia's Origin", type: 'name-builder', description: 'Complete com a origem correta de Sofia.', exercise: { id: 'a2-m25', type: 'name-builder', question: 'She is from ___.', options: ['Italy', 'from', 'and'], correctAnswer: 'Italy', xp: 25 }, xp: 25 },
      { id: 26, name: 'Where Is Sofia From?', type: 'origin', description: 'Complete a frase sobre Sofia.', exercise: { id: 'a2-m26', type: 'origin', question: 'Where is Sofia from?', placeholder: 'She is from _____', correctAnswer: 'Italy', xp: 30 }, xp: 30 },
      { id: 27, name: 'Ask the Question', type: 'order-sentence', description: 'Forme a pergunta de origem.', exercise: { id: 'a2-m27', type: 'order-sentence', correctAnswer: 'Where are you from', xp: 25 }, xp: 25 },
      { id: 28, name: 'I Am From Brazil', type: 'name-builder', description: 'Complete com o país de origem.', exercise: { id: 'a2-m28', type: 'name-builder', question: 'I am from ___.', options: ['Brazil', 'is', 'the'], correctAnswer: 'Brazil', xp: 25 }, xp: 25 },
      { id: 29, name: 'He Is From Canada', type: 'listen-select', description: 'Identifique a frase sobre origem.', exercise: { id: 'a2-m29', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: "Which sentence talks about someone's country?", options: ['He is from Canada', 'She is a nurse', 'My name is Oliver'], correctAnswer: 'He is from Canada', xp: 25 }, xp: 25 },
      { id: 30, name: '🏁 Speak: Origins', type: 'speak-mode', description: 'Checkpoint 3 — Diga a frase em voz alta.', exercise: { id: 'a2-m30', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am from London', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 4 · How Old Are You? (M31-40) ──────────────────
      { id: 31, name: '🎤 Say: Your Age', type: 'speak-mode', description: 'Diga sua idade em voz alta.', exercise: { id: 'a2-m31', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am 25 years old', xp: 30 }, xp: 30 },
      { id: 32, name: 'Years Old', type: 'name-builder', description: 'Complete a frase sobre idade.', exercise: { id: 'a2-m32', type: 'name-builder', question: 'I am 25 ___ old.', options: ['years', 'from', 'blue'], correctAnswer: 'years', xp: 25 }, xp: 25 },
      { id: 33, name: 'I Am 25', type: 'order-sentence', description: 'Organize a frase de idade.', exercise: { id: 'a2-m33', type: 'order-sentence', correctAnswer: 'I am 25 years old', xp: 25 }, xp: 25 },
      { id: 34, name: 'How Old?', type: 'listen-select', description: 'Identifique a pergunta correta sobre idade.', exercise: { id: 'a2-m34', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which is the correct question about age?', options: ['How old are you?', 'Where are you from?', 'What is your name?'], correctAnswer: 'How old are you?', xp: 25 }, xp: 25 },
      { id: 35, name: 'She Is 30', type: 'name-builder', description: 'Complete a frase sobre a idade dela.', exercise: { id: 'a2-m35', type: 'name-builder', question: 'She is ___ years old.', options: ['30', 'going', 'from'], correctAnswer: '30', xp: 25 }, xp: 25 },
      { id: 36, name: 'Ask the Age', type: 'order-sentence', description: 'Organize a pergunta sobre idade.', exercise: { id: 'a2-m36', type: 'order-sentence', correctAnswer: 'How old are you', xp: 25 }, xp: 25 },
      { id: 37, name: 'He IS 18', type: 'name-builder', description: 'To be + age: qual verbo usar com "he"?', exercise: { id: 'a2-m37', type: 'name-builder', question: 'He ___ 18 years old.', options: ['is', 'am', 'are'], correctAnswer: 'is', xp: 25 }, xp: 25 },
      { id: 38, name: 'Twenty Years Old', type: 'listen-select', description: 'Identifique a frase sobre idade por extenso.', exercise: { id: 'a2-m38', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence uses the written-out age?', options: ['I am twenty years old', 'I am from Italy', 'My name is Oliver'], correctAnswer: 'I am twenty years old', xp: 25 }, xp: 25 },
      { id: 39, name: 'She Is Thirty', type: 'order-sentence', description: 'Organize a frase com número por extenso.', exercise: { id: 'a2-m39', type: 'order-sentence', correctAnswer: 'She is thirty years old', xp: 25 }, xp: 25 },
      { id: 40, name: '🏁 Speak: Age', type: 'speak-mode', description: 'Checkpoint 4 — Diga a frase em voz alta.', exercise: { id: 'a2-m40', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am 25 years old', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 5 · Your Job (M41-50) ──────────────────────────
      { id: 41, name: '🎤 Say: Your Job', type: 'speak-mode', description: 'Diga sua profissão em voz alta.', exercise: { id: 'a2-m41', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am a teacher', xp: 30 }, xp: 30 },
      { id: 42, name: "Dr. James's Profession", type: 'profession', description: 'Complete a frase sobre a profissão de Dr. James.', exercise: { id: 'a2-m42', type: 'profession', question: 'What does Dr. James do?', placeholder: 'He is a _____', correctAnswer: 'doctor', xp: 30 }, xp: 30 },
      { id: 43, name: 'I Am A Teacher', type: 'name-builder', description: 'Qual profissão completa a frase?', exercise: { id: 'a2-m43', type: 'name-builder', question: 'I am a ___.', options: ['teacher', 'from', 'in'], correctAnswer: 'teacher', xp: 25 }, xp: 25 },
      { id: 44, name: 'What Do You Do?', type: 'order-sentence', description: 'Organize a pergunta sobre profissão.', exercise: { id: 'a2-m44', type: 'order-sentence', correctAnswer: 'What do you do', xp: 25 }, xp: 25 },
      { id: 45, name: 'An Engineer', type: 'listen-select', description: 'Identifique a profissão mencionada.', exercise: { id: 'a2-m45', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence mentions a profession?', options: ['I am an engineer', 'I am 25 years old', 'My name is Oliver'], correctAnswer: 'I am an engineer', xp: 25 }, xp: 25 },
      { id: 46, name: 'She Is A Nurse', type: 'name-builder', description: 'Complete com a profissão feminina.', exercise: { id: 'a2-m46', type: 'name-builder', question: 'She is a ___.', options: ['nurse', 'and', 'blue'], correctAnswer: 'nurse', xp: 25 }, xp: 25 },
      { id: 47, name: 'I Am A Student', type: 'order-sentence', description: 'Organize a frase de profissão.', exercise: { id: 'a2-m47', type: 'order-sentence', correctAnswer: 'I am a student', xp: 25 }, xp: 25 },
      { id: 48, name: 'What Do You ...?', type: 'name-builder', description: 'Complete a pergunta sobre profissão.', exercise: { id: 'a2-m48', type: 'name-builder', question: 'What do you ___?', options: ['do', 'from', 'is'], correctAnswer: 'do', xp: 25 }, xp: 25 },
      { id: 49, name: 'He Is A Doctor', type: 'listen-select', description: 'Identifique a profissão masculina.', exercise: { id: 'a2-m49', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence is about a male profession?', options: ['He is a doctor', 'She is from Italy', 'How are you'], correctAnswer: 'He is a doctor', xp: 25 }, xp: 25 },
      { id: 50, name: '🏁 Speak: Jobs', type: 'speak-mode', description: 'Checkpoint 5 — Diga a frase em voz alta.', exercise: { id: 'a2-m50', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I am a teacher', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 6 · Where You Live (M51-60) ────────────────────
      { id: 51, name: 'Home Sweet Home', type: 'discover', description: 'Escute como se fala sobre onde as pessoas moram.', exercise: { id: 'a2-m51', type: 'discover', audio: '/audio/dialog-exemplo.mp3', xp: 20 }, xp: 20 },
      { id: 52, name: "Emma's Address", type: 'address', description: 'Complete a frase sobre onde Emma mora.', exercise: { id: 'a2-m52', type: 'address', question: 'Where does Emma live?', placeholder: 'She lives in _____', correctAnswer: 'London', xp: 30 }, xp: 30 },
      { id: 53, name: 'Live IN', type: 'name-builder', description: 'Qual preposição usamos com "live"?', exercise: { id: 'a2-m53', type: 'name-builder', question: 'I live ___ New York.', options: ['in', 'from', 'at'], correctAnswer: 'in', xp: 25 }, xp: 25 },
      { id: 54, name: 'Where Do You Live?', type: 'order-sentence', description: 'Organize a pergunta sobre moradia.', exercise: { id: 'a2-m54', type: 'order-sentence', correctAnswer: 'Where do you live', xp: 25 }, xp: 25 },
      { id: 55, name: 'I Live In London', type: 'listen-select', description: 'Identifique a frase sobre onde mora.', exercise: { id: 'a2-m55', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence is about where someone lives?', options: ['I live in London', 'I am 25 years old', 'My name is Oliver'], correctAnswer: 'I live in London', xp: 25 }, xp: 25 },
      { id: 56, name: 'She LIVES', type: 'name-builder', description: 'Qual forma de "live" usamos com "she"?', exercise: { id: 'a2-m56', type: 'name-builder', question: 'She ___ in Paris.', options: ['lives', 'am', 'are'], correctAnswer: 'lives', xp: 25 }, xp: 25 },
      { id: 57, name: 'I Live In New York', type: 'order-sentence', description: 'Organize a frase de moradia.', exercise: { id: 'a2-m57', type: 'order-sentence', correctAnswer: 'I live in New York', xp: 25 }, xp: 25 },
      { id: 58, name: 'He Lives In Tokyo', type: 'name-builder', description: 'Qual cidade completa a frase?', exercise: { id: 'a2-m58', type: 'name-builder', question: 'He lives in ___.', options: ['Tokyo', 'from', 'is'], correctAnswer: 'Tokyo', xp: 25 }, xp: 25 },
      { id: 59, name: 'Where Does She Live?', type: 'listen-select', description: 'Identifique a pergunta correta.', exercise: { id: 'a2-m59', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which is the correct question about where she lives?', options: ['Where does she live?', 'What does she do?', 'How old is she?'], correctAnswer: 'Where does she live?', xp: 25 }, xp: 25 },
      { id: 60, name: '🏁 Speak: Where You Live', type: 'speak-mode', description: 'Checkpoint 6 — Diga a frase em voz alta.', exercise: { id: 'a2-m60', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I live in London', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 7 · Phone & Contact (M61-70) ───────────────────
      { id: 61, name: '🎤 Say: A Phone Number', type: 'speak-mode', description: 'Diga um número de telefone em voz alta.', exercise: { id: 'a2-m61', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'My phone number is 555 0100', xp: 30 }, xp: 30 },
      { id: 62, name: "Carlos's Number", type: 'listen-select', description: 'Identifique o número correto de Carlos.', exercise: { id: 'a2-m62', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: "What is Carlos's phone number?", options: ['His number is 555-0100', 'His number is 555-0199', 'His number is 555-0110'], correctAnswer: 'His number is 555-0100', xp: 25 }, xp: 25 },
      { id: 63, name: 'Phone NUMBER', type: 'name-builder', description: 'Complete a frase sobre telefone.', exercise: { id: 'a2-m63', type: 'name-builder', question: 'My phone ___ is 555-0100.', options: ['number', 'from', 'is'], correctAnswer: 'number', xp: 25 }, xp: 25 },
      { id: 64, name: "What's Your Number?", type: 'order-sentence', description: 'Organize a pergunta sobre número.', exercise: { id: 'a2-m64', type: 'order-sentence', correctAnswer: 'What is your phone number', xp: 25 }, xp: 25 },
      { id: 65, name: "What's Your Email?", type: 'listen-select', description: 'Identifique a pergunta sobre email.', exercise: { id: 'a2-m65', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which question asks for an email?', options: ['What is your email?', 'Where do you live?', 'How old are you?'], correctAnswer: 'What is your email?', xp: 25 }, xp: 25 },
      { id: 66, name: 'My Email IS', type: 'name-builder', description: 'Qual verbo completa a frase de email?', exercise: { id: 'a2-m66', type: 'name-builder', question: 'My email ___ oliver@email.com.', options: ['is', 'from', 'at'], correctAnswer: 'is', xp: 25 }, xp: 25 },
      { id: 67, name: 'Ask for Number', type: 'order-sentence', description: 'Organize a pergunta pedindo número.', exercise: { id: 'a2-m67', type: 'order-sentence', correctAnswer: 'What is your phone number', xp: 25 }, xp: 25 },
      { id: 68, name: 'You Can CALL Me', type: 'name-builder', description: 'Qual verbo usamos para "ligar"?', exercise: { id: 'a2-m68', type: 'name-builder', question: 'You can ___ me at 555-0200.', options: ['call', 'come', 'go'], correctAnswer: 'call', xp: 25 }, xp: 25 },
      { id: 69, name: 'His Number', type: 'listen-select', description: 'Identifique o número correto.', exercise: { id: 'a2-m69', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which number was mentioned?', options: ['His number is 555-0199', 'His number is 555-0100', 'His number is 123-456'], correctAnswer: 'His number is 555-0199', xp: 25 }, xp: 25 },
      { id: 70, name: '🏁 Speak: Contact', type: 'speak-mode', description: 'Checkpoint 7 — Diga a frase em voz alta.', exercise: { id: 'a2-m70', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'My phone number is 555 0100', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 8 · Hobbies & Interests (M71-80) ───────────────
      { id: 71, name: '🎤 Say: What You Like', type: 'speak-mode', description: 'Diga o que você gosta em voz alta.', exercise: { id: 'a2-m71', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I like music', xp: 30 }, xp: 30 },
      { id: 72, name: 'I Like Music', type: 'name-builder', description: 'Complete com um hobby.', exercise: { id: 'a2-m72', type: 'name-builder', question: 'I like ___.', options: ['music', 'from', 'is'], correctAnswer: 'music', xp: 25 }, xp: 25 },
      { id: 73, name: 'Music And Sports', type: 'order-sentence', description: 'Organize a frase sobre gostos.', exercise: { id: 'a2-m73', type: 'order-sentence', correctAnswer: 'I like music and sports', xp: 25 }, xp: 25 },
      { id: 74, name: 'What Do You Like?', type: 'listen-select', description: 'Identifique a pergunta sobre gostos.', exercise: { id: 'a2-m74', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which question asks about hobbies?', options: ['What do you like?', 'Where do you live?', 'How old are you?'], correctAnswer: 'What do you like?', xp: 25 }, xp: 25 },
      { id: 75, name: 'She Loves Reading', type: 'name-builder', description: 'Complete com o hobby de Sofia.', exercise: { id: 'a2-m75', type: 'name-builder', question: 'She loves ___.', options: ['reading', 'from', 'is'], correctAnswer: 'reading', xp: 25 }, xp: 25 },
      { id: 76, name: 'What Do You Like To Do?', type: 'order-sentence', description: 'Organize a pergunta sobre atividades.', exercise: { id: 'a2-m76', type: 'order-sentence', correctAnswer: 'What do you like to do', xp: 25 }, xp: 25 },
      { id: 77, name: 'Watching Movies', type: 'name-builder', description: 'Qual gerúndio completa a frase?', exercise: { id: 'a2-m77', type: 'name-builder', question: 'I enjoy ___ movies.', options: ['watching', 'from', 'is'], correctAnswer: 'watching', xp: 25 }, xp: 25 },
      { id: 78, name: 'Playing Football', type: 'listen-select', description: 'Identifique o hobby esportivo.', exercise: { id: 'a2-m78', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which sentence mentions a sport?', options: ['I like playing football', 'I live in London', 'She is a nurse'], correctAnswer: 'I like playing football', xp: 25 }, xp: 25 },
      { id: 79, name: 'I Love Learning English', type: 'order-sentence', description: 'Organize a frase motivacional.', exercise: { id: 'a2-m79', type: 'order-sentence', correctAnswer: 'I love learning English', xp: 25 }, xp: 25 },
      { id: 80, name: '🏁 Speak: Hobbies', type: 'speak-mode', description: 'Checkpoint 8 — Diga a frase em voz alta.', exercise: { id: 'a2-m80', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'I like music', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 9 · Asking About Others (M81-90) ───────────────
      { id: 81, name: '🎤 Say: Ask Someone', type: 'speak-mode', description: 'Faça uma pergunta sobre outra pessoa em voz alta.', exercise: { id: 'a2-m81', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'What is your name', xp: 30 }, xp: 30 },
      { id: 82, name: 'WHAT Is Your Name?', type: 'name-builder', description: 'Qual palavra interrogativa usamos para nome?', exercise: { id: 'a2-m82', type: 'name-builder', question: '___ is your name?', options: ['What', 'Where', 'How'], correctAnswer: 'What', xp: 25 }, xp: 25 },
      { id: 83, name: 'What Is His Name?', type: 'order-sentence', description: 'Organize a pergunta sobre o nome dele.', exercise: { id: 'a2-m83', type: 'order-sentence', correctAnswer: 'What is his name', xp: 25 }, xp: 25 },
      { id: 84, name: 'Where Is She From?', type: 'listen-select', description: 'Identifique a pergunta sobre origem feminina.', exercise: { id: 'a2-m84', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: "Which question asks about her origin?", options: ['Where is she from?', 'What is her job?', 'How old is she?'], correctAnswer: 'Where is she from?', xp: 25 }, xp: 25 },
      { id: 85, name: 'How Old IS He?', type: 'name-builder', description: 'Qual forma de "to be" usamos com "he"?', exercise: { id: 'a2-m85', type: 'name-builder', question: 'How old ___ he?', options: ['is', 'am', 'are'], correctAnswer: 'is', xp: 25 }, xp: 25 },
      { id: 86, name: 'Where Does She Live?', type: 'order-sentence', description: 'Organize a pergunta sobre moradia.', exercise: { id: 'a2-m86', type: 'order-sentence', correctAnswer: 'Where does she live', xp: 25 }, xp: 25 },
      { id: 87, name: 'What Does He DO?', type: 'name-builder', description: 'Complete a pergunta sobre profissão.', exercise: { id: 'a2-m87', type: 'name-builder', question: 'What does he ___?', options: ['do', 'from', 'is'], correctAnswer: 'do', xp: 25 }, xp: 25 },
      { id: 88, name: 'How Old Is She?', type: 'listen-select', description: 'Identifique a pergunta sobre idade feminina.', exercise: { id: 'a2-m88', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: "Which question asks about a woman's age?", options: ['How old is she?', 'Where does he work?', 'What is his name?'], correctAnswer: 'How old is she?', xp: 25 }, xp: 25 },
      { id: 89, name: 'What Is Her Job?', type: 'order-sentence', description: 'Organize a pergunta sobre a profissão dela.', exercise: { id: 'a2-m89', type: 'order-sentence', correctAnswer: 'What is her job', xp: 25 }, xp: 25 },
      { id: 90, name: '🏁 Speak: Asking About Others', type: 'speak-mode', description: 'Checkpoint 9 — Diga a frase em voz alta.', exercise: { id: 'a2-m90', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'Where are you from', xp: 50 }, xp: 50 },

      // ── CHECKPOINT 10 · Full Dialogue (M91-100) ───────────────────
      { id: 91, name: 'The Full Introduction', type: 'discover', description: '🏆 Trecho final — escute o diálogo completo de apresentação.', exercise: { id: 'a2-m91', type: 'discover', audio: '/audio/dialog-exemplo.mp3', xp: 20 }, xp: 20 },
      { id: 92, name: 'Hi! My Name IS Oliver', type: 'name-builder', description: 'Complete a apresentação final.', exercise: { id: 'a2-m92', type: 'name-builder', question: 'Hi! My name ___ Oliver.', options: ['is', 'am', 'are'], correctAnswer: 'is', xp: 25 }, xp: 25 },
      { id: 93, name: 'I Am From London', type: 'order-sentence', description: 'Organize a frase de origem.', exercise: { id: 'a2-m93', type: 'order-sentence', correctAnswer: 'I am from London', xp: 25 }, xp: 25 },
      { id: 94, name: "Nice To Meet You, Sarah!", type: 'listen-select', description: 'Escolha a resposta correta ao cumprimento.', exercise: { id: 'a2-m94', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'What does Sarah say when meeting Oliver?', options: ["Nice to meet you, I'm Sarah", 'Goodbye Oliver', 'I am from Brazil'], correctAnswer: "Nice to meet you, I'm Sarah", xp: 25 }, xp: 25 },
      { id: 95, name: 'I Am A Teacher In London', type: 'name-builder', description: 'Complete a frase combinando profissão e moradia.', exercise: { id: 'a2-m95', type: 'name-builder', question: 'I am a teacher and I live ___ London.', options: ['in', 'from', 'at'], correctAnswer: 'in', xp: 25 }, xp: 25 },
      { id: 96, name: 'Nice To Meet You Too', type: 'order-sentence', description: 'Organize a resposta ao cumprimento.', exercise: { id: 'a2-m96', type: 'order-sentence', correctAnswer: 'Nice to meet you too', xp: 25 }, xp: 25 },
      { id: 97, name: 'I AM 25', type: 'name-builder', description: 'Qual forma de "to be" usamos com "I"?', exercise: { id: 'a2-m97', type: 'name-builder', question: 'I ___ 25 years old.', options: ['am', 'is', 'are'], correctAnswer: 'am', xp: 25 }, xp: 25 },
      { id: 98, name: 'What Do You Do For Work?', type: 'listen-select', description: 'Identifique a variante da pergunta de profissão.', exercise: { id: 'a2-m98', type: 'listen-select', audio: '/audio/dialog-exemplo.mp3', question: 'Which question asks what someone does for work?', options: ['What do you do for work?', 'Where do you live?', 'How old are you?'], correctAnswer: 'What do you do for work?', xp: 25 }, xp: 25 },
      { id: 99, name: 'It Was Great Meeting You', type: 'order-sentence', description: 'Organize a expressão de despedida formal.', exercise: { id: 'a2-m99', type: 'order-sentence', correctAnswer: 'It was great meeting you', xp: 25 }, xp: 25 },
      { id: 100, name: '🏆 Command Final', type: 'speak-mode', description: 'Checkpoint 10 — Você conquistou o Atlantic Ocean! Diga a frase final.', exercise: { id: 'a2-m100', type: 'speak-mode', question: 'Diga em voz alta:', correctAnswer: 'Hi my name is Oliver I am from London', xp: 100 }, xp: 100 },
    ],
  },

  20: {
    id: 20,
    phaseId: 20,
    title: 'To Be in the Past — WAS / WERE',
    narrative: 'A Grande Subida. Você está quase na superfície. O passado não te prende — ele te dá história.',
    curiosity: 'O Mar de Tasman separa a Austrália da Nova Zelândia — você está quase na superfície. O passado não te prende: ele te dá história. Agora você pode dizer quem você era e como você estava.',
    missions: [
      {
        id: 1,
        name: 'Discover — WAS/WERE',
        type: 'discover',
        description: 'Escute a mini-história. Só ouça 10x e deixe o cérebro reconhecer padrões.\n\n"Yesterday, I was tired. I was at home. You were late. We were in a meeting. They were happy."',
        exercise: {
          id: 'p20-m1',
          type: 'discover',
          audio: '/audio/dialog-exemplo.mp3',
          xp: 20,
        },
        xp: 20,
      },
      {
        id: 2,
        name: 'Escolha o Guardião — WAS ou WERE?',
        type: 'listen-select',
        description: 'Regra WOA: Solitário = WAS (I/He/She/It) · Grupo = WERE (You/We/They).\nEscolha o correto para: "I ___ at work yesterday."',
        exercise: {
          id: 'p20-m2',
          type: 'listen-select',
          audio: '/audio/dialog-exemplo.mp3',
          question: 'I ___ at work yesterday.',
          options: ['was', 'were'],
          correctAnswer: 'was',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 3,
        name: 'Conserte o Erro',
        type: 'order-sentence',
        description: 'Anti-bug mental. Reescreva a frase correta.\n❌ She were my friend.\n❌ They was at home.',
        exercise: {
          id: 'p20-m3',
          type: 'order-sentence',
          question: 'Organize: She / was / my / friend',
          correctAnswer: 'She was my friend',
          xp: 35,
        },
        xp: 35,
      },
      {
        id: 4,
        name: 'Negativas — wasn\'t / weren\'t',
        type: 'name-builder',
        description: 'Complete com a forma negativa correta.\nwas not = wasn\'t · were not = weren\'t',
        exercise: {
          id: 'p20-m4',
          type: 'name-builder',
          question: 'I ___ ready. (negativa de WAS)',
          options: ["wasn't", "weren't", "not was"],
          correctAnswer: "wasn't",
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 5,
        name: 'Perguntas — Ordene a Frase',
        type: 'order-sentence',
        description: 'Inverta o sujeito com WAS/WERE para formar perguntas.\nWas I…? / Were you…? / Was she…? / Were they…?',
        exercise: {
          id: 'p20-m5',
          type: 'order-sentence',
          question: 'Organize: you / late / Were / ?',
          correctAnswer: 'Were you late?',
          xp: 35,
        },
        xp: 35,
      },
      {
        id: 6,
        name: 'Short Answers',
        type: 'listen-select',
        description: 'Respostas curtas na vida real. Marque a resposta correta.',
        exercise: {
          id: 'p20-m6',
          type: 'listen-select',
          audio: '/audio/dialog-exemplo.mp3',
          question: 'Were they tired?',
          options: ['Yes, they was.', 'Yes, they were.', 'Yes, they are.'],
          correctAnswer: 'Yes, they were.',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 7,
        name: 'Command A — 4 Frases sobre Ontem',
        type: 'speak-mode',
        description: 'Repita as 4 frases com WAS/WERE.',
        exercise: {
          id: 'p20-m7',
          type: 'speak-mode',
          question: 'Repita em voz alta:',
          correctAnswer: 'I was tired I was not ready we were at home they were not happy',
          xp: 50,
        },
        xp: 50,
      },
      {
        id: 8,
        name: 'Command B — 3 Perguntas',
        type: 'speak-mode',
        description: 'Repita as 3 perguntas com WAS/WERE.',
        exercise: {
          id: 'p20-m8',
          type: 'speak-mode',
          question: 'Repita em voz alta:',
          correctAnswer: 'Was I late Were you at home Was she ready',
          xp: 50,
        },
        xp: 50,
      },
      {
        id: 9,
        name: 'Command C — Mini-Diálogo (30s)',
        type: 'speak-mode',
        description: 'Repita o mini-diálogo completo. Recompensa: Tasman Badge 🏅',
        exercise: {
          id: 'p20-m9',
          type: 'speak-mode',
          question: 'Repita o mini-diálogo:',
          correctAnswer: 'Were you at home yesterday Yes I was I was tired Were they with you No they were not',
          xp: 75,
        },
        xp: 75,
      },
    ],
  },
}
