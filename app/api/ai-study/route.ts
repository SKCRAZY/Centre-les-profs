import { NextResponse } from 'next/server';

function extractText(value: any): string {
  if (!value || typeof value !== 'object') return '';

  if (typeof value.output_text === 'string' && value.output_text.trim()) {
    return value.output_text;
  }

  const steps = Array.isArray(value.steps) ? value.steps : [];
  const texts: string[] = [];

  for (const step of steps) {
    if (step?.type !== 'model_output') continue;
    const content = Array.isArray(step.content) ? step.content : [];
    for (const block of content) {
      if (block?.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        texts.push(block.text);
      }
    }
  }

  if (texts.length) return texts.join('\n');

  if (value.type === 'text' && typeof value.text === 'string') return value.text;

  const knownKeys = ['content', 'parts', 'output', 'outputs', 'response', 'message'];
  for (const key of knownKeys) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      const result = nested
        .map((item: any) => extractText(item))
        .filter(Boolean)
        .join('\n');
      if (result) return result;
    } else if (nested && typeof nested === 'object') {
      const result = extractText(nested);
      if (result) return result;
    }
  }

  return '';
}

function toSuperscript(value: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    n: 'ⁿ', i: 'ⁱ',
  };
  return value.split('').map((char) => map[char] || char).join('');
}

function formatMath(text: string): string {
  let result = text;

  // Remove common LaTeX math delimiters.
  result = result
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$(.*?)\$/gs, '$1')
    .replace(/\\\[(.*?)\\\]/gs, '$1')
    .replace(/\\\((.*?)\\\)/gs, '$1');

  // Make common LaTeX readable without requiring a math renderer.
  result = result
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\le/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ');

  // Convert common powers: x^2, x^{2}, x^n, etc.
  result = result.replace(/([A-Za-z0-9)\]])\^\{([^{}]+)\}/g, (_match, base, exponent) => {
    return `${base}${toSuperscript(exponent)}`;
  });
  result = result.replace(/([A-Za-z0-9)\]])\^([0-9n]+)/g, (_match, base, exponent) => {
    return `${base}${toSuperscript(exponent)}`;
  });

  // Clean remaining simple LaTeX spacing/escaping and braces.
  result = result
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\\s+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\$+/g, '');

  return result;
}

export async function POST(request: Request) {
  try {
    const { tool, level, subject, chapter, question, difficulty, count } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY n’est pas configurée sur Vercel.' }, { status: 500 });

    const labels: Record<string, string> = { tutor: 'AI Tutor', flashcards: 'AI Flashcards', test: 'AI Practice Test' };
    const languageRule = `Réponds obligatoirement dans la même langue que la demande de l'utilisateur. Darija marocaine → darija marocaine. Arabe → arabe. Français → français. Anglais → anglais. Ne change pas de langue sauf si l'utilisateur le demande.`;
    const mathRule = `Pour les mathématiques, n'utilise jamais LaTeX ni les délimiteurs $, $$, \\( \\), \\[ \\]. Écris les maths en texte lisible: x², x³, √x, a/b, ×, ÷, ≤, ≥, π. Pas de code mathématique.`;
    const instructions = tool === 'tutor'
      ? `${languageRule}\n${mathRule}\n\nRéponds comme un excellent professeur. Explique simplement, progressivement et avec un exemple. Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}. Question: ${question || 'Explique le chapitre demandé.'}`
      : tool === 'flashcards'
        ? `${languageRule}\n${mathRule}\n\nCrée ${count || 10} flashcards pédagogiques dans la même langue que la demande. Format strict: CARTE 1\nQuestion: ...\nRéponse: ...\n puis CARTE 2... Niveau: ${level}. Matière: ${subject || 'non précisée'}. Chapitre: ${chapter || 'non précisé'}.`
        : `${languageRule}\n${mathRule}\n\nCrée un practice test de ${count || 10} questions dans la même langue que la demande, niveau ${level}, matière ${subject || 'non précisée'}, chapitre ${chapter || 'non précisé'}, difficulté ${difficulty || 'Moyenne'}. Pour chaque question donne 4 choix A/B/C/D. À la fin, ajoute CORRIGÉ avec les bonnes réponses et une courte explication.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ model: 'gemini-3.5-flash-lite', input: instructions, generation_config: { thinking_level: 'minimal' } }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Erreur Gemini.' }, { status: response.status });

    const content = formatMath(extractText(data));
    if (!content.trim()) return NextResponse.json({ error: 'Gemini a répondu, mais aucun texte de réponse n’a été reçu.' }, { status: 502 });

    return NextResponse.json({ title: labels[tool] || 'AI Study', content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur.' }, { status: 500 });
  }
}
