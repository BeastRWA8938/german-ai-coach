export const MOCK_QUESTIONS = {
  dativ: [
    {
      id: 'dat_1',
      sentence: "Ich schenke ___ Bruder (m) ein Buch.",
      primary_answer: "dem",
      accepted_answers: ["dem", "meinem", "einem"],
      grammar_point: "Dativ masculine article/pronoun",
      difficulty: "easy",
      explanation: "The verb 'schenken' takes a Dativ indirect object (recipient) and an Akkusativ direct object. Since 'Bruder' is masculine, the Dativ article is 'dem' (or possessive 'meinem')."
    },
    {
      id: 'dat_2',
      sentence: "Wir helfen ___ Frau (f) beim Tragen.",
      primary_answer: "der",
      accepted_answers: ["der", "einer", "dieser", "meiner"],
      grammar_point: "Dativ feminine article",
      difficulty: "easy",
      explanation: "The verb 'helfen' always governs the Dativ case. Since 'Frau' is feminine, the Dativ definite article is 'der'."
    },
    {
      id: 'dat_3',
      sentence: "Das Kind läuft zu ___ Mutter (f).",
      primary_answer: "der",
      accepted_answers: ["der", "seiner", "einer"],
      grammar_point: "Dativ after preposition 'zu'",
      difficulty: "medium",
      explanation: "The preposition 'zu' always requires the Dativ case. 'Mutter' is feminine, so it becomes 'der Mutter' (or 'seiner Mutter')."
    },
    {
      id: 'dat_4',
      sentence: "Wie geht es ___ (you, formal)?",
      primary_answer: "Ihnen",
      accepted_answers: ["Ihnen"],
      grammar_point: "Dativ personal pronouns",
      difficulty: "medium",
      explanation: "The idiomatic expression 'Wie geht es...' requires a Dativ pronoun. For formal 'you', the pronoun is 'Ihnen' (capitalized)."
    },
    {
      id: 'dat_5',
      sentence: "Der Hut gefällt ___ Kind (n) sehr.",
      primary_answer: "dem",
      accepted_answers: ["dem", "einem", "diesem", "meinem"],
      grammar_point: "Dativ neuter article",
      difficulty: "medium",
      explanation: "The verb 'gefallen' (to please/like) requires a Dativ object. Since 'Kind' is neuter, the Dativ definite article is 'dem'."
    }
  ],
  akkusativ: [
    {
      id: 'akk_1',
      sentence: "Ich besuche ___ Freund (m) am Wochenende.",
      primary_answer: "den",
      accepted_answers: ["den", "meinen", "einen"],
      grammar_point: "Akkusativ masculine article",
      difficulty: "easy",
      explanation: "The verb 'besuchen' takes a direct object in the Akkusativ case. For a masculine noun like 'Freund', the article becomes 'den' (or possessive 'meinen')."
    },
    {
      id: 'akk_2',
      sentence: "Er trinkt ohne ___ Löffel (m) seine Suppe.",
      primary_answer: "den",
      accepted_answers: ["den", "einen"],
      grammar_point: "Akkusativ after preposition 'ohne'",
      difficulty: "medium",
      explanation: "The preposition 'ohne' (without) always requires the Akkusativ case. 'Löffel' is masculine, so it becomes 'den Löffel'."
    },
    {
      id: 'akk_3',
      sentence: "Kaufst du ___ Tasche (f)?",
      primary_answer: "die",
      accepted_answers: ["die", "eine", "diese", "meine"],
      grammar_point: "Akkusativ feminine article",
      difficulty: "easy",
      explanation: "'Kaufen' takes an Akkusativ object. Since 'Tasche' is feminine, the Akkusativ definite article remains 'die'."
    }
  ],
  wechselpraepositionen: [
    {
      id: 'wp_1',
      sentence: "Das Bild hängt an ___ Wand (f, position).",
      primary_answer: "der",
      accepted_answers: ["der", "einer", "dieser", "meiner"],
      grammar_point: "Two-way preposition (Wechselpräposition) - Dativ for location",
      difficulty: "medium",
      explanation: "The picture is already hanging (stationary position, answer to 'Wo?'). Therefore, 'an' requires the Dativ case. 'Wand' is feminine, so we use 'der'."
    },
    {
      id: 'wp_2',
      sentence: "Ich hänge das Bild an ___ Wand (f, direction).",
      primary_answer: "die",
      accepted_answers: ["die"],
      grammar_point: "Two-way preposition (Wechselpräposition) - Akkusativ for movement",
      difficulty: "medium",
      explanation: "This describes an action/movement of placing the picture (direction, answer to 'Wohin?'). Therefore, 'an' requires the Akkusativ case. 'Wand' is feminine, so we use 'die'."
    },
    {
      id: 'wp_3',
      sentence: "Die Katze schläft unter ___ Bett (n, position).",
      primary_answer: "dem",
      accepted_answers: ["dem", "meinem", "einem"],
      grammar_point: "Wechselpräposition - Dativ for location",
      difficulty: "easy",
      explanation: "The sleeping cat is stationary under the bed (Wo?). Therefore, we use Dativ. Neuter 'Bett' takes 'dem' in Dativ."
    }
  ],
  family: [
    {
      id: 'fam_1',
      sentence: "Der Vater und die Mutter sind die ___.",
      primary_answer: "Eltern",
      accepted_answers: ["Eltern"],
      grammar_point: "Family vocabulary",
      difficulty: "easy",
      explanation: "Father and mother are the parents (Eltern)."
    },
    {
      id: 'fam_2',
      sentence: "Die Schwester meiner Mutter ist meine ___.",
      primary_answer: "Tante",
      accepted_answers: ["Tante"],
      grammar_point: "Family vocabulary",
      difficulty: "easy",
      explanation: "The sister of my mother is my aunt (Tante)."
    }
  ],
  numbers: [
    {
      id: 'num_1',
      sentence: "Zwei plus drei ist ___.",
      primary_answer: "fünf",
      accepted_answers: ["fünf", "5"],
      grammar_point: "German numbers",
      difficulty: "easy",
      explanation: "Two plus three is five (fünf)."
    }
  ],
  personal_pronouns: [
    {
      id: 'pp_1',
      sentence: "Wie heißt du? ___ heiße Lukas.",
      primary_answer: "Ich",
      accepted_answers: ["Ich"],
      grammar_point: "Personal pronoun nominative",
      difficulty: "easy",
      explanation: "The first-person singular nominative pronoun is 'Ich' (I)."
    }
  ],
  trennbare_verben: [
    {
      id: 'tv_1',
      sentence: "Der Zug kommt um 18 Uhr ___ (ankommen).",
      primary_answer: "an",
      accepted_answers: ["an"],
      grammar_point: "Separable prefix placement",
      difficulty: "easy",
      explanation: "The verb is 'ankommen' (to arrive). In simple present tense main clauses, the prefix 'an' separates and moves to the very end of the sentence."
    }
  ],
  perfekt: [
    {
      id: 'perf_1',
      sentence: "Gestern habe ich ein Buch ___ (lesen).",
      primary_answer: "gelesen",
      accepted_answers: ["gelesen"],
      grammar_point: "Perfekt past participle",
      difficulty: "medium",
      explanation: "The Perfekt tense of 'lesen' is built with the auxiliary verb 'haben' and the past participle 'gelesen' at the end."
    }
  ],
  adjektivdeklination: [
    {
      id: 'adj_1',
      sentence: "Das ist ein ___ Mann (m, nominative, alt).",
      primary_answer: "alter",
      accepted_answers: ["alter"],
      grammar_point: "Mixed adjective declension",
      difficulty: "hard",
      explanation: "Following the indefinite article 'ein', a masculine nominative adjective takes the strong ending '-er' (alter Mann)."
    }
  ]
};

export const DEFAULT_QUESTIONS = [
  {
    id: 'def_1',
    sentence: "Hallo, wie geht ___ dir?",
    primary_answer: "es",
    accepted_answers: ["es"],
    grammar_point: "Idiomatic greetings",
    difficulty: "easy",
    explanation: "'Wie geht es dir?' (How are you?) is a standard German idiom using the dummy pronoun 'es'."
  }
];
