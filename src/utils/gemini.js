import { DEFAULT_MODEL } from './storage.js';

/**
 * Client-side Gemini API Integration for ProjektDeutsch AI (BYOK Model)
 */

// Vocabulary clusters to keep generation focused and prevent vocabulary drift
export const VOCABULARY_CLUSTERS = {
  A1: {
    family: ["Vater (father)", "Mutter (mother)", "Eltern (parents)", "Bruder (brother)", "Schwester (sister)", "Sohn (son)", "Tochter (daughter)", "Großeltern (grandparents)", "Onkel (uncle)", "Tante (aunt)"],
    numbers: ["eins (one)", "zehn (ten)", "zwanzig (twenty)", "hundert (hundred)", "tausend (thousand)", "Euro (euro)", "Uhrzeit (time)", "Nummer (number)"],
    personal_pronouns: ["ich (I)", "du (you)", "er (he)", "sie (she/they)", "es (it)", "wir (we)", "ihr (you pl.)", "Sie (you form.)"],
    akkusativ: ["Apfel (apple)", "Kaffee (coffee)", "Tee (tea)", "Tisch (table)", "bestellen (to order)", "bezahlen (to pay)", "Rechnung (bill)", "Obst (fruit)", "Gemüse (vegetables)"],
    dativ: ["helfen (to help)", "danken (to thank)", "gehören (to belong to)", "gefallen (to please/like)", "passen (to fit)", "schmecken (to taste)", "Freund (friend)", "Kollege (colleague)"],
    trennbare_verben: ["aufstehen (to get up)", "einkaufen (to shop)", "anrufen (to call)", "fernsehen (to watch TV)", "vorbereiten (to prepare)", "abholen (to pick up)", "anfangen (to start)"],
    perfekt: ["gegangen (gone)", "gemacht (done/made)", "gelesen (read)", "geschrieben (written)", "gesehen (seen)", "gegessen (eaten)", "gefahren (driven/gone)"],
    modalverben: ["können (can)", "müssen (must)", "wollen (want)", "sollen (should)", "dürfen (may/allow)", "mögen (like)", "schwimmen (to swim)", "spielen (to play)"]
  },
  A2: {
    wechselpraepositionen: ["Tisch (table)", "Stuhl (chair)", "Wand (wall)", "Bett (bed)", "Schrank (wardrobe)", "Sofa (sofa)", "stellen (to place vertically)", "legen (to place horizontally)", "hängen (to hang)"],
    adjektivdeklination: ["neu (new)", "alt (old)", "groß (big)", "klein (small)", "teuer (expensive)", "billig (cheap)", "Hose (pants)", "Hemd (shirt)", "Kleid (dress)", "Schuh (shoe)"],
    nebensaetze_a2: ["weil (because)", "dass (that)", "krank (sick)", "gesund (healthy)", "bleiben (to stay)", "Fieber (fever)", "Kopfschmerzen (headache)", "freuen (to be glad)"],
    relativsaetze: ["Mann (man)", "Frau (woman)", "Kind (child)", "leben (to live)", "wohnen (to reside)", "arbeiten (to work)", "geboren (born)", "Heimat (homeland)"]
  },
  B1: {
    passiv: ["werden (to become)", "Bewerbung (application)", "Vorstellungsgespräch (interview)", "Vertrag (contract)", "verdienen (to earn)", "kündigen (to resign/fire)", "Ausbildung (training)"],
    konjunktiv_2: ["hätte (would have)", "wäre (would be)", "würde (would do)", "Traum (dream)", "Weltreise (world trip)", "Geld (money)", "Zeit (time)"],
    nebensaetze: ["obwohl (although)", "trotzdem (nevertheless)", "Umwelt (environment)", "Klimawandel (climate change)", "schützen (to protect)", "recyceln (to recycle)", "buchen (to book)"],
    relativsaetze_b1: ["mit (with)", "für (for)", "Termin (appointment)", "vereinbaren (to arrange)", "verschieben (to postpone)", "absagen (to cancel)", "treffen (to meet)"]
  },
  B2: {
    nominalstil: ["Forschung (research)", "Experiment (experiment)", "Erkenntnis (insight)", "Hypothese (hypothesis)", "Untersuchung (investigation)", "Durchführung (execution)"],
    passiversatz: ["Nachhaltigkeit (sustainability)", "erneuerbar (renewable)", "Körpersprache (body language)", "Geste (gesture)", "Smalltalk (small talk)", "missverstehen (to misunderstand)"]
  }
};

const VALID_SUBSKILLS = {
  family: ['vocabulary', 'relationships'],
  numbers: ['digits', 'spelling'],
  personal_pronouns: ['nominative', 'accusative'],
  akkusativ: ['articles', 'pronouns'],
  dativ: ['articles', 'pronouns'],
  trennbare_verben: ['prefixes', 'sentence_order'],
  perfekt: ['auxiliary', 'participle'],
  modalverben: ['conjugation', 'syntax'],
  wechselpraepositionen: ['dativ_wo', 'akkusativ_wohin'],
  adjektivdeklination: ['weak_inflection', 'strong_inflection'],
  nebensaetze_a2: ['weil_dass'],
  relativsaetze: ['nominative', 'accusative'],
  passiv: ['werden', 'von_durch'],
  konjunktiv_2: ['wunschsaetze', 'hoeflichkeit'],
  nebensaetze: ['obwohl_trotzdem'],
  relativsaetze_b1: ['prepositional', 'was_wo'],
  nominalstil: ['preposition_noun', 'verb_noun_conversion'],
  passiversatz: ['sein_zu', 'sich_lassen']
};

export async function generateAiQuestions(level, topicId, topicName, count, apiKey, selectedModel = DEFAULT_MODEL) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  // Retrieve vocabulary cluster for the topic, if available
  const rawVocab = VOCABULARY_CLUSTERS[level]?.[topicId] || [];
  const vocabCluster = rawVocab.map(word => word.split(' (')[0]);
  const vocabHint = vocabCluster.length > 0 
    ? `Prefer using words from this thematic vocabulary cluster: ${vocabCluster.join(', ')}.`
    : '';

  const allowedSubskills = VALID_SUBSKILLS[topicId] || [];
  const subskillHint = allowedSubskills.length > 0
    ? `For the 'subskill' field, you MUST choose exactly one value from this list: ${allowedSubskills.map(s => `'${s}'`).join(', ')}.`
    : `Provide a specific subskill label representing the grammar subtopic.`;

  const prompt = `
You are a professional German language coach.
Generate exactly ${count} fill-in-the-blank grammar questions for a learner studying at CEFR level ${level}.
Target Grammar Topic: ${topicName} (Internal ID: ${topicId}).

Requirements:
1. Every question sentence MUST contain exactly one blank designated as "___" (three underscores).
2. The blank must represent the target grammar word or prefix to be filled (e.g., articles, endings, prepositions, separable prefixes, auxiliary verbs, or pronouns).
3. The sentences should be contextually natural, grammatically correct, and appropriate for CEFR level ${level}.
4. Provide a 'primary_answer' which is the most natural answer, and a list of 'accepted_answers' which includes the primary answer and any other grammatically correct options in this context (e.g. possessive pronouns or indefinite articles instead of definite articles).
5. For each question, supply a clear explanation in English explaining the grammar rule, why the primary answer is correct, and any details about alternative accepted answers.
6. Designate a difficulty level ('easy', 'medium', or 'hard') for each question.
7. Assign a valid subskill classification for the question. ${subskillHint}
8. ${vocabHint}

Your response must be a single JSON object strictly conforming to this schema:
{
  "level": "${level}",
  "topic": "${topicId}",
  "questions": [
    {
      "id": "unique_question_id_string",
      "sentence": "Ich gehe ___ Schule.",
      "primary_answer": "zur",
      "accepted_answers": ["zur", "in die"],
      "grammar_point": "Dativ preposition contractions",
      "subskill": "${allowedSubskills[0] || 'articles'}",
      "difficulty": "easy",
      "explanation": "The expression 'zur Schule gehen' uses 'zu + Dativ'. Feminine 'Schule' becomes 'der', contracted with 'zu' to form 'zur'."
    }
  ]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          level: { type: "STRING" },
          topic: { type: "STRING" },
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                sentence: { type: "STRING" },
                primary_answer: { type: "STRING" },
                accepted_answers: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                grammar_point: { type: "STRING" },
                subskill: { type: "STRING" },
                difficulty: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ["id", "sentence", "primary_answer", "accepted_answers", "grammar_point", "subskill", "difficulty", "explanation"]
            }
          }
        },
        required: ["level", "topic", "questions"]
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  try {
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY") {
        throw new Error("Content generation blocked by Gemini safety filters. Try a different topic.");
      }
      throw new Error("Gemini returned an empty or invalid response. Please try again.");
    }
    const responseText = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(responseText);
    
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response format from AI model.");
    }
    
    // Validate subskills against predefined options to prevent progress tracking drop
    const validSubs = VALID_SUBSKILLS[topicId] || [];
    const validatedQuestions = parsedData.questions.map(q => {
      let matchedSubskill = q.subskill;
      if (!validSubs.includes(matchedSubskill)) {
        const foundSub = validSubs.find(sub => matchedSubskill?.toLowerCase()?.includes(sub?.toLowerCase()) || sub?.toLowerCase()?.includes(matchedSubskill?.toLowerCase()));
        matchedSubskill = foundSub || validSubs[0] || 'vocabulary';
      }
      return {
        ...q,
        subskill: matchedSubskill
      };
    });
    
    return validatedQuestions;
  } catch (err) {
    console.error("Failed to parse Gemini response:", data, err);
    throw new Error("Could not parse AI-generated questions. Please try again.");
  }
}

export async function generateAiSmartQuestions(level, topicList, apiKey, selectedModel = DEFAULT_MODEL) {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  const topicCountDetails = topicList.map(t => `- Topic: "${t.name}" (ID: ${t.id}) -> Generate exactly ${t.count} questions.`).join('\n');
  const subskillRules = topicList.map(t => {
    const subs = VALID_SUBSKILLS[t.id] || [];
    return `- For topic "${t.id}", choose the 'subskill' field from: ${subs.map(s => `'${s}'`).join(', ')}.`;
  }).join('\n');

  const vocabRules = topicList.map(t => {
    const rawVocab = VOCABULARY_CLUSTERS[level]?.[t.id] || [];
    const vocabCluster = rawVocab.map(word => word.split(' (')[0]);
    return vocabCluster.length > 0
      ? `- For topic "${t.id}", construct the question sentences preferentially using words from this vocabulary cluster: ${vocabCluster.join(', ')}.`
      : '';
  }).filter(Boolean).join('\n');

  const prompt = `
You are a professional German language coach.
Generate a custom mixed grammar test of exactly ${topicList.reduce((acc, t) => acc + t.count, 0)} fill-in-the-blank questions for a learner studying at CEFR level ${level}.

Target Topic Distribution:
${topicCountDetails}

Requirements:
1. Every question sentence MUST contain exactly one blank designated as "___" (three underscores).
2. The blank must represent the target grammar word or prefix to be filled (e.g., articles, endings, prepositions, separable prefixes, auxiliary verbs, or pronouns).
3. The sentences should be contextually natural, grammatically correct, and appropriate for CEFR level ${level}.
4. Provide a 'primary_answer' which is the most natural answer, and a list of 'accepted_answers' which includes the primary answer and any other grammatically correct options in this context (e.g. possessive pronouns or indefinite articles instead of definite articles).
5. For each question, supply a clear explanation in English explaining the grammar rule, why the primary answer is correct, and any details about alternative accepted answers.
6. Designate a difficulty level ('easy', 'medium', or 'hard') for each question.
7. Assign a valid subskill classification for the question. Follow these rules for subskills:
${subskillRules}
8. Every question MUST have the 'topic' field set to the corresponding topic ID (e.g. 'akkusativ', 'dativ', etc.) specified above.
9. Follow these vocabulary constraints to keep questions contextually aligned with target textbook themes:
${vocabRules}

Your response must be a single JSON object strictly conforming to this schema:
{
  "level": "${level}",
  "questions": [
    {
      "id": "unique_question_id_string",
      "topic": "${topicList[0]?.id || 'dativ'}",
      "sentence": "Ich gehe ___ Schule.",
      "primary_answer": "zur",
      "accepted_answers": ["zur", "in die"],
      "grammar_point": "Dativ preposition contractions",
      "subskill": "${VALID_SUBSKILLS[topicList[0]?.id]?.[0] || 'articles'}",
      "difficulty": "easy",
      "explanation": "The expression 'zur Schule gehen' uses 'zu + Dativ'. Feminine 'Schule' becomes 'der', contracted with 'zu' to form 'zur'."
    }
  ]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          level: { type: "STRING" },
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                topic: { type: "STRING" },
                sentence: { type: "STRING" },
                primary_answer: { type: "STRING" },
                accepted_answers: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                grammar_point: { type: "STRING" },
                subskill: { type: "STRING" },
                difficulty: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ["id", "topic", "sentence", "primary_answer", "accepted_answers", "grammar_point", "subskill", "difficulty", "explanation"]
            }
          }
        },
        required: ["level", "questions"]
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
  }

  const data = await response.json();
  
  try {
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY") {
        throw new Error("Content generation blocked by Gemini safety filters. Try a different topic.");
      }
      throw new Error("Gemini returned an empty or invalid response. Please try again.");
    }
    const responseText = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(responseText);
    
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response format from AI model.");
    }
    
    const allowedTopicIds = topicList.map(t => t.id);
    return parsedData.questions.map(q => {
      // Validate dynamic topic ID
      let matchedTopic = q.topic;
      if (!allowedTopicIds.includes(matchedTopic)) {
        // Fallback to first available or find matching substring
        const found = allowedTopicIds.find(id => matchedTopic?.toLowerCase()?.includes(id?.toLowerCase()) || id?.toLowerCase()?.includes(matchedTopic?.toLowerCase()));
        matchedTopic = found || allowedTopicIds[0] || 'family';
      }
      
      // Validate subskill
      const validSubs = VALID_SUBSKILLS[matchedTopic] || [];
      let matchedSubskill = q.subskill;
      if (!validSubs.includes(matchedSubskill)) {
        const foundSub = validSubs.find(sub => matchedSubskill?.toLowerCase()?.includes(sub?.toLowerCase()) || sub?.toLowerCase()?.includes(matchedSubskill?.toLowerCase()));
        matchedSubskill = foundSub || validSubs[0] || 'vocabulary';
      }
      
      return {
        ...q,
        topicId: matchedTopic,
        subskill: matchedSubskill
      };
    });
  } catch (err) {
    console.error("Failed to parse Gemini response:", data, err);
    throw new Error("Could not parse AI-generated questions. Please try again.");
  }
}
