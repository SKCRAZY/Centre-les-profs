import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tool, level, subject, chapter, question, difficulty, count } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY n’est pas configurée sur Vercel.' }, { status: 500 });

    const labels: Record<string, string> = { tutor: 'AI Tutor', flashcards: 'AI Flashcards', test: 'AI Practice Test' };
    const instructions = tool === 'tutor'
      ? `Réponds comme un excellent professeur. Explique simplement, progressivement et avec un exemple. Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}. Question: ${question || 'Explique le chapitre demandé.'}`
      : tool === 'flashcards'
        ? `Crée ${count || 10} flashcards pédagogiques en français. Format strict: CARTE 1\\nQuestion: ...\\nRéponse: ...\\n puis CARTE 2... Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}.`
        : `Crée un practice test de ${count || 10} questions en français, niveau ${level}, matière ${subject || 'non précisée'}, chapitre ${chapter || 'non précisé'}, difficulté ${difficulty || 'Moyenne'}. Pour chaque question donne 4 choix A/B/C/D. À la fin, ajoute CORRIGÉ avec les bonnes réponses et une courte explication.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }] }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Erreur Gemini.' }, { status: response.status });

    const content = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
    return NextResponse.json({ title: labels[tool] || 'AI Study', content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur.' }, { status: 500 });
  }
}
