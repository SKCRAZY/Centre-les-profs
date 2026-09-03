'use client';

import { useEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';

const levels = ['3ème année collège', 'Tronc Commun', '1ère année Bac', '2ème année Bac'];

type Subject = { id: string; name: string; level: string };
type Teacher = { id: string; full_name?: string; name?: string };

function NewSeanceForm() {
  const [level, setLevel] = useState(levels[0]);
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [{ data: subjectData, error: subjectError }, { data: teacherData, error: teacherError }] = await Promise.all([
        supabase.from('subjects').select('id,name,level').order('name'),
        supabase.from('teachers').select('id,full_name,name').order('full_name'),
      ]);
      if (subjectError || teacherError) setError(subjectError?.message || teacherError?.message || 'Erreur de chargement.');
      setSubjects(subjectData || []);
      setTeachers(teacherData || []);
    };
    load();
  }, []);

  const filteredSubjects = subjects.filter(subject => subject.level === level);

  useEffect(() => {
    if (!filteredSubjects.some(subject => String(subject.id) === subjectId)) setSubjectId('');
  }, [level, subjects]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subjectId) {
      setError('Choisissez une matière pour ce niveau.');
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase.from('schedules').insert({
      level,
      subject_id: subjectId,
      teacher_id: teacherId || null,
      day,
      start_time: startTime,
      end_time: endTime,
      room: room || null,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    window.location.reload();
  };

  return (
    <form className="form" onSubmit={submit}>
      {error && <div className="error">{error}</div>}
      <select value={level} onChange={e => setLevel(e.target.value)} required>
        {levels.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <select value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
        <option value="">Matière</option>
        {filteredSubjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
      </select>
      {!filteredSubjects.length && <p className="empty">Aucune matière pour ce niveau.</p>}
      <select value={teacherId} onChange={e => setTeacherId(e.target.value)}>
        <option value="">Professeur</option>
        {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.full_name || teacher.name}</option>)}
      </select>
      <input value={day} onChange={e => setDay(e.target.value)} placeholder="Jour" required />
      <input value={startTime} onChange={e => setStartTime(e.target.value)} type="time" required />
      <input value={endTime} onChange={e => setEndTime(e.target.value)} type="time" required />
      <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Salle" />
      <button disabled={loading || !filteredSubjects.length}>{loading ? 'Ajout...' : 'Ajouter'}</button>
    </form>
  );
}

export default function NewSeance() {
  useEffect(() => {
    let root: Root | null = null;
    let mount: HTMLDivElement | null = null;

    const connect = () => {
      const headings = Array.from(document.querySelectorAll('.dash .box h2'));
      const heading = headings.find(el => el.textContent?.trim() === 'Nouvelle séance');
      if (!heading) return;
      const box = heading.parentElement;
      const oldForm = box?.querySelector('form');
      if (!box || !oldForm) return;

      if (!mount) {
        mount = document.createElement('div');
        mount.setAttribute('data-new-seance-component', 'true');
        oldForm.replaceWith(mount);
        root = createRoot(mount);
        root.render(<NewSeanceForm />);
      }
    };

    connect();
    const observer = new MutationObserver(connect);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      root?.unmount();
    };
  }, []);

  return null;
}
