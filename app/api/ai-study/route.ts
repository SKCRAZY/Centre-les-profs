import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tool, level, subject, chapter, question, difficulty, count } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY n’est pas configurée sur Vercel.' }, { status: 500 });

    const labels: Record<string, string> = { tutor: 'AI Tutor', flashcards: 'AI Flashcards', test: 'AI Practice Test' };
    const instructions = tool === 'tutor'
      ? `Réponds comme un excellent professeur. Explique simplement, progressivement et avec un exemple. Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}. Question: ${question || 'Explique le chapitre demandé.'}`
      : tool === 'flashcards'
        ? `Crée ${count || 10} flashcards pédagogiques en français. Format strict: CARTE 1\nQuestion: ...\nRéponse: ...\n puis CARTE 2... Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}.`
        : `Crée un practice test de ${count || 10} questions en français, niveau ${level}, matière ${subject || 'non précisée'}, chapitre ${chapter || 'non précisé'}, difficulté ${difficulty || 'Moyenne'}. Pour chaque question donne 4 choix A/B/C/D. À la fin, ajoute CORRIGÉ avec les bonnes réponses et une courte explication.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-5.6-luna', input: instructions, max_output_tokens: 3000 }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Erreur OpenAI.' }, { status: response.status });

    const content = data.output_text || data.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || '').join('') || '';
    return NextResponse.json({ title: labels[tool] || 'AI Study', content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur.' }, { status: 500 });
  }
}
