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
      {
        id: 1,
        name: 'Listen & Discover',
        type: 'discover',
        description: 'Escute e observe. Não se preocupe em entender tudo. Apenas descubra.',
        exercise: {
          id: 'mission-1',
          type: 'discover',
          audio: '/audio/dialog-exemplo.mp3',
          xp: 20,
        },
        xp: 20,
      },
      {
        id: 2,
        name: 'Name Builder',
        type: 'name-builder',
        description: 'Escolha a palavra correta para completar a frase.',
        exercise: {
          id: 'mission-2',
          type: 'name-builder',
          question: 'My first name is _____',
          options: ['Oliver', 'Brazil', 'Teacher'],
          correctAnswer: 'Oliver',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 3,
        name: 'Order Sentence',
        type: 'order-sentence',
        description: 'Organize as palavras para formar a sentença correta.',
        exercise: {
          id: 'mission-3',
          type: 'order-sentence',
          // correctAnswer e words são injetados dinamicamente pelo challenge page
          // a partir das frases buscadas no banco (phase_sentences).
          // Este fallback é usado apenas se o banco estiver indisponível.
          correctAnswer: 'My name is Oliver',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 4,
        name: 'Listen & Select',
        type: 'listen-select',
        description: 'Escute e escolha a resposta correta.',
        exercise: {
          id: 'mission-4',
          type: 'listen-select',
          audio: '/audio/dialog-exemplo.mp3',
          question: 'What\'s your middle name?',
          options: [
            'What\'s your middle name',
            'Where do you live',
            'What is your job'
          ],
          correctAnswer: 'What\'s your middle name',
          xp: 25,
        },
        xp: 25,
      },
      {
        id: 5,
        name: 'Address',
        type: 'address',
        description: 'Complete a frase com onde Emma mora.',
        exercise: {
          id: 'mission-5',
          type: 'address',
          question: 'Where does Emma live?',
          placeholder: 'She lives in _____',
          correctAnswer: 'London',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 6,
        name: 'Phone Number',
        type: 'listen-select',
        description: 'Escolha a frase correta sobre o número de Carlos.',
        exercise: {
          id: 'mission-6',
          type: 'listen-select',
          audio: '/audio/dialog-exemplo.mp3',
          question: 'What is Carlos\'s phone number?',
          options: [
            'His number is 555-0100',
            'His number is 555-0199',
            'His number is 555-0110',
          ],
          correctAnswer: 'His number is 555-0100',
          xp: 25,
        },
        xp: 25,
      },
      {
        id: 7,
        name: 'Origin',
        type: 'origin',
        description: 'Complete a frase com a origem de Sofia.',
        exercise: {
          id: 'mission-7',
          type: 'origin',
          question: 'Where is Sofia from?',
          placeholder: 'She is from _____',
          correctAnswer: 'Italy',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 8,
        name: 'Profession',
        type: 'profession',
        description: 'Complete a frase com a profissão de Dr. James.',
        exercise: {
          id: 'mission-8',
          type: 'profession',
          question: 'What does Dr. James do?',
          placeholder: 'He is a _____',
          correctAnswer: 'doctor',
          xp: 30,
        },
        xp: 30,
      },
      {
        id: 9,
        name: 'Speak Mode',
        type: 'speak-mode',
        description: 'Repita a frase de apresentação em inglês com a sua voz.',
        exercise: {
          id: 'mission-9',
          type: 'speak-mode',
          question: 'Repita em voz alta:',
          correctAnswer: 'Hi my name is Oliver I am from London Nice to meet you',
          xp: 50,
        },
        xp: 50,
      },
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
