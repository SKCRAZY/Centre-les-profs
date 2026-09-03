import { NextResponse } from 'next/server';

function extractText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.output_text === 'string') return value.output_text;
    if (value.content) return extractText(value.content);
    if (value.parts) return extractText(value.parts);
    if (value.output) return extractText(value.output);
  }
  return '';
}

export async function POST(request: Request) {
  try {
    const { tool, level, subject, chapter, question, difficulty, count } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY n’est pas configurée sur Vercel.' }, { status: 500 });

    const labels: Record<string, string> = { tutor: 'AI Tutor', flashcards: 'AI Flashcards', test: 'AI Practice Test' };
    const instructions = tool === 'tutor'
      ? `Réponds comme un excellent professeur. Explique simplement, progressivement et avec un exemple. Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}. Question: ${question || 'Explique le chapitre demandé.'}`
      : tool === 'flashcards'
        ? `Crée ${count || 10} flashcards pédagogiques en français. Format strict: CARTE 1\nQuestion: ...\nRéponse: ...\n puis CARTE 2... Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}.`
        : `Crée un practice test de ${count || 10} questions en français, niveau ${level}, matière ${subject || 'non précisée'}, chapitre ${chapter || 'non précisé'}, difficulté ${difficulty || 'Moyenne'}. Pour chaque question donne 4 choix A/B/C/D. À la fin, ajoute CORRIGÉ avec les bonnes réponses et une courte explication.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ model: 'gemini-3.5-flash-lite', input: instructions, generation_config: { thinking_level: 'minimal' } }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Erreur Gemini.' }, { status: response.status });

    const content = extractText(data.output_text) || extractText(data.output) || extractText(data.response);
    if (!content.trim()) return NextResponse.json({ error: 'Gemini a répondu, mais aucun texte de réponse n’a été reçu.' }, { status: 502 });

    return NextResponse.json({ title: labels[tool] || 'AI Study', content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur.' }, { status: 500 });
  }
}
