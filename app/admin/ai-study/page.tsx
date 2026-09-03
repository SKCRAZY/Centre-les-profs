'use client';

import { useState } from 'react';

const levels = ['3ème année collège', 'Tronc Commun', '1ère année Bac', '2ème année Bac'];
const tools = [
  ['tutor', '🤖', 'AI Tutor'],
  ['flashcards', '📚', 'AI Flashcards'],
  ['test', '🧪', 'AI Practice Test'],
] as const;

type Tool = (typeof tools)[number][0];

type Result = { title: string; content: string } | null;

export default function AIStudyPage() {
  const [tool, setTool] = useState<Tool>('tutor');
  const [level, setLevel] = useState(levels[0]);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [question, setQuestion] = useState('');
  const [difficulty, setDifficulty] = useState('Moyenne');
  const [count, setCount] = useState('10');
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, level, subject, chapter, question, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur pendant la génération.');
      setResult({ title: data.title, content: data.content });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ai-page">
      <style>{`
        .ai-page{min-height:100vh;padding:35px;background:#09090b;color:#f7f7f7;font-family:Arial,sans-serif}
        .ai-wrap{max-width:1050px;margin:auto}.ai-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:25px}
        .ai-head h1{margin:0;font-size:30px}.ai-head p{color:#aaa;margin:7px 0 0}.back{color:#f5bf28;text-decoration:none;font-weight:700}
        .tools{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}.tool{padding:18px;border:1px solid #29292e;border-radius:15px;background:#121216;color:#ddd;cursor:pointer;text-align:left}.tool.active{border-color:#f5bf28;background:#1c1710;color:#fff}.tool b{display:block;margin-top:8px}.tool span{font-size:25px}
        .card{background:#121216;border:1px solid #29292e;border-radius:18px;padding:22px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}.field.full{grid-column:1/-1}.field label{font-size:13px;color:#aaa}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;border:1px solid #33343a;background:#0c0c0f;color:#fff;border-radius:10px;padding:12px;font-size:14px}.field textarea{min-height:115px;resize:vertical}.generate{margin-top:16px;width:100%;padding:13px;border:0;border-radius:10px;background:#d90812;color:#fff;font-weight:800;cursor:pointer}.generate:disabled{opacity:.6;cursor:wait}.error{margin-top:15px;padding:12px;border-radius:10px;background:#3a1014;color:#ff9da2}.result{margin-top:20px;white-space:pre-wrap;line-height:1.65;background:#0c0c0f;border:1px solid #33343a;border-radius:14px;padding:20px}.result h2{margin-top:0;color:#f5bf28;font-size:20px}
        @media(max-width:700px){.ai-page{padding:18px}.ai-head{align-items:flex-start}.ai-head h1{font-size:24px}.tools,.grid{grid-template-columns:1fr}.field.full{grid-column:auto}}
      `}</style>
      <div className="ai-wrap">
        <div className="ai-head">
          <div><h1>🤖 AI Study</h1><p>Tutor, Flashcards et Practice Tests pour les élèves.</p></div>
          <a className="back" href="/admin">← Admin</a>
        </div>

        <div className="tools">
          {tools.map(([id, icon, label]) => <button key={id} className={`tool ${tool === id ? 'active' : ''}`} onClick={() => setTool(id)}><span>{icon}</span><b>{label}</b></button>)}
        </div>

        <section className="card">
          <div className="grid">
            <div className="field"><label>Niveau</label><select value={level} onChange={e => setLevel(e.target.value)}>{levels.map(x => <option key={x}>{x}</option>)}</select></div>
            <div className="field"><label>Matière</label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Mathématiques" /></div>
            <div className="field"><label>Chapitre / thème</label><input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="Ex: Fonctions" /></div>
            {tool === 'test' && <><div className="field"><label>Difficulté</label><select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>Facile</option><option>Moyenne</option><option>Difficile</option></select></div><div className="field"><label>Nombre de questions</label><select value={count} onChange={e => setCount(e.target.value)}>{['5','10','15','20'].map(x => <option key={x}>{x}</option>)}</select></div></>}
            {tool === 'tutor' && <div className="field full"><label>Question de l'élève</label><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex: Explique-moi les fonctions affines simplement..." /></div>}
          </div>
          <button className="generate" disabled={loading} onClick={generate}>{loading ? 'Génération...' : tool === 'tutor' ? '🤖 Demander au Tutor' : tool === 'flashcards' ? '📚 Générer les Flashcards' : '🧪 Générer le Practice Test'}</button>
          {error && <div className="error">⚠️ {error}</div>}
          {result && <div className="result"><h2>{result.title}</h2>{result.content}</div>}
        </section>
      </div>
    </main>
  );
}
