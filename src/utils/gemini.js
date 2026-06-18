/**
 * Client-side Gemini API Integration for ProjektDeutsch AI (BYOK Model)
 */

// Vocabulary clusters to keep generation focused and prevent vocabulary drift
const VOCABULARY_CLUSTERS = {
  A1: {
    family: ["Vater", "Mutter", "Eltern", "Bruder", "Schwester", "Sohn", "Tochter", "Kind", "Familie"],
    numbers: ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "zwanzig", "hundert"],
    personal_pronouns: ["ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "Sie"],
    akkusativ: ["Apfel", "Hund", "Kaffee", "Tee", "Tisch", "Stuhl", "Tasche", "Buch", "Fahrrad"],
    dativ: ["Vater", "Mutter", "Freund", "Kind", "Lehrer", "Arzt", "Kollege"]
  },
  A2: {
    trennbare_verben: ["ankommen", "aufstehen", "einkaufen", "mitkommen", "anrufen", "fernsehen", "vorbereiten"],
    perfekt: ["gegangen", "gemacht", "gelesen", "geschrieben", "gesehen", "gegessen", "getrunken", "gefahren"],
    wechselpraepositionen: ["Tisch", "Stuhl", "Wand", "Bett", "Küche", "Zimmer", "Schrank", "Sofa", "Tasche"],
    adjektivdeklination: ["neu", "alt", "groß", "klein", "schön", "jung", "alt", "teuer", "billig"]
  }
};

export async function generateAiQuestions(level, topicId, topicName, count, apiKey, selectedModel = 'gemini-2.5-flash') {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  // Retrieve vocabulary cluster for the topic, if available
  const vocabCluster = VOCABULARY_CLUSTERS[level]?.[topicId] || [];
  const vocabHint = vocabCluster.length > 0 
    ? `Prefer using words from this thematic vocabulary cluster: ${vocabCluster.join(', ')}.`
    : '';

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
7. ${vocabHint}

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
                difficulty: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ["id", "sentence", "primary_answer", "accepted_answers", "grammar_point", "difficulty", "explanation"]
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
    const responseText = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(responseText);
    
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response format from AI model.");
    }
    
    return parsedData.questions;
  } catch (err) {
    console.error("Failed to parse Gemini response:", data, err);
    throw new Error("Could not parse AI-generated questions. Please try again.");
  }
}
