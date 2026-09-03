'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type Tool = 'tutor' | 'flashcards' | 'test';

export default function StudentAIStudyPage() {
  const params = useParams();
  const router = useRouter();
  const code = decodeURIComponent(String(params.code || '')).toUpperCase();
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tool, setTool] = useState<Tool>('tutor');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [question, setQuestion] = useState('');
  const [difficulty, setDifficulty] = useState('Moyenne');
  const [count, setCount] = useState('10');
  const [result, setResult] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data, error: studentError } = await supabase.rpc('get_student_portal', { p_code: code });
      if (studentError || !data?.length) {
        setError('Code élève introuvable.');
        setLoading(false);
        return;
      }
      const s = data[0];
      setStudent(s);
      const enrolledNames = new Set((s.subjects || []).map((x: any) => x.name));
      const { data: subjectRows } = await supabase.from('subjects').select('id,name,level').eq('level', s.level).order('name');
      const enrolled = (subjectRows || []).filter((x: any) => enrolledNames.has(x.name));
      setSubjects(enrolled.length ? enrolled : (subjectRows || []));
      if (enrolled.length) setSubject(enrolled[0].name);
      setLoading(false);
    })();
  }, [code]);

  const toolLabel = useMemo(() => tool === 'tutor' ? 'AI Tutor' : tool === 'flashcards' ? 'AI Flashcards' : 'AI Practice Test', [tool]);

  const generate = async () => {
    if (!student) return;
    setGenerating(true); setError(''); setSaved(''); setResult('');
    try {
      const res = await fetch('/api/ai-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool, code, level: student.level, subject, chapter, question, difficulty, count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur pendant la génération.');
      setTitle(data.title || toolLabel);
      setResult(data.content || '');
      setSaved(data.saved ? '✓ Enregistré dans ton espace.' : '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <main className="ai-student"><section><h2>Chargement de ton espace...</h2></section></main>;
  if (error && !student) return <main className="ai-student"><section><h2>{error}</h2><button onClick={() => router.push('/')}>Retour</button></section></main>;

  return (
    <main className="ai-student">
      <style>{`
        .ai-student{min-height:100vh;background:#09090b;color:#f7f7f7;font-family:Arial,sans-serif;padding:22px}.ai-student-wrap{max-width:1050px;margin:auto}.ai-top{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:22px}.ai-top h1{margin:0;font-size:28px}.ai-top p{margin:6px 0 0;color:#aaa}.back{color:#f5bf28;text-decoration:none;font-weight:700}.tools{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.tool{padding:17px;border:1px solid #29292e;border-radius:15px;background:#121216;color:#ddd;cursor:pointer;text-align:left}.tool.active{border-color:#f5bf28;background:#1c1710;color:#fff}.tool span{font-size:24px}.tool b{display:block;margin-top:7px}.card{background:#121216;border:1px solid #29292e;border-radius:18px;padding:20px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field{display:flex;flex-direction:column;gap:7px}.field.full{grid-column:1/-1}.field label{font-size:13px;color:#aaa}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;border:1px solid #33343a;background:#0c0c0f;color:#fff;border-radius:10px;padding:12px;font-size:14px}.field textarea{min-height:110px;resize:vertical}.generate{margin-top:15px;width:100%;padding:13px;border:0;border-radius:10px;background:#d90812;color:#fff;font-weight:800;cursor:pointer}.generate:disabled{opacity:.6;cursor:wait}.error,.saved{margin-top:14px;padding:12px;border-radius:10px}.error{background:#3a1014;color:#ff9da2}.saved{background:#142916;color:#a8e6ad}.result{margin-top:18px;white-space:pre-wrap;line-height:1.7;background:#0c0c0f;border:1px solid #33343a;border-radius:14px;padding:20px}.result h2{margin-top:0;color:#f5bf28;font-size:20px}.student-badge{font-size:13px;color:#bbb;margin-bottom:15px}@media(max-width:700px){.ai-student{padding:15px}.ai-top{align-items:flex-start}.ai-top h1{font-size:23px}.tools,.grid{grid-template-columns:1fr}.field.full{grid-column:auto}}
      `}</style>
      <div className="ai-student-wrap">
        <div className="ai-top"><div><h1>🤖 AI Study</h1><p>Bonjour {student?.full_name} 👋 — ton assistant scolaire.</p></div><a className="back" href={`/eleve/${encodeURIComponent(code)}`}>← Mon espace</a></div>
        <div className="student-badge">🎓 {student?.level || '-'} • 🔐 Tes résultats sont liés à ton espace élève.</div>
        <div className="tools">
          <button className={`tool ${tool === 'tutor' ? 'active' : ''}`} onClick={() => setTool('tutor')}><span>🤖</span><b>AI Tutor</b></button>
          <button className={`tool ${tool === 'flashcards' ? 'active' : ''}`} onClick={() => setTool('flashcards')}><span>📚</span><b>AI Flashcards</b></button>
          <button className={`tool ${tool === 'test' ? 'active' : ''}`} onClick={() => setTool('test')}><span>🧪</span><b>AI Practice Test</b></button>
        </div>
        <section className="card">
          <div className="grid">
            <div className="field"><label>Matière</label><select value={subject} onChange={e => setSubject(e.target.value)}><option value="">Toutes les matières</option>{subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
            <div className="field"><label>Chapitre / thème</label><input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="Ex: Fonctions" /></div>
            {tool === 'test' && <><div className="field"><label>Difficulté</label><select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>Facile</option><option>Moyenne</option><option>Difficile</option></select></div><div className="field"><label>Nombre de questions</label><select value={count} onChange={e => setCount(e.target.value)}>{['5','10','15','20'].map(x => <option key={x}>{x}</option>)}</select></div></>}
            {tool === 'tutor' && <div className="field full"><label>Ma question</label><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex: Explique-moi ce chapitre simplement..." /></div>}
          </div>
          <button className="generate" disabled={generating} onClick={generate}>{generating ? 'Génération...' : tool === 'tutor' ? '🤖 Demander au Tutor' : tool === 'flashcards' ? '📚 Générer mes Flashcards' : '🧪 Générer mon Practice Test'}</button>
          {error && <div className="error">⚠️ {error}</div>}
          {saved && <div className="saved">{saved}</div>}
          {result && <div className="result"><h2>{title}</h2>{result}</div>}
        </section>
      </div>
    </main>
  );
}
