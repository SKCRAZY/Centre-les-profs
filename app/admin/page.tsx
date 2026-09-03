'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

const levels = ['3ème année collège', 'Tronc Commun', '1ère année Bac', '2ème année Bac'];
const tabs = [
  ['home', '🏠', "Vue d'ensemble"], ['students', '➕', 'Ajouter un élève'], ['students_list', '👨‍🎓', 'Élèves inscrits'], ['teachers', '👨‍🏫', 'Professeurs'],
  ['subjects', '📚', 'Matières'], ['schedule', '🗓️', 'Emploi du temps'], ['qr', '📱', 'QR & Présence'],
  ['news', '📢', 'Annonces'], ['stats', '📊', 'Statistiques'],
];

const moroccoDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date());

const normalizeWhatsAppPhone = (phone: string | null) => {
  if (!phone) return '';
  let number = phone.replace(/\D/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  if (number.startsWith('0')) number = '212' + number.slice(1);
  return number;
};

export default function Admin() {
  const [tab, setTab] = useState('home');
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [presence, setPresence] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [teacherLevel, setTeacherLevel] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const router = useRouter();
  const [renewAmount, setRenewAmount] = useState('');
  const [renewDate, setRenewDate] = useState(moroccoDate());

  useEffect(() => {
    let active = true;
    const check = async (s: any) => {
      if (!active) return;
      setSession(s);
      if (!s) { setIsAdmin(false); setAuthReady(true); return; }
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', s.user.id).maybeSingle();
      if (active) { setIsAdmin(!!data); setAuthReady(true); }
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => check(s));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const refresh = async () => {
    setLoading(true); setError('');
    const results = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('student_subjects').select('student_id,subject_id'),
      supabase.from('teachers').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('created_at', { ascending: false }),
      supabase.from('schedules').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').order('attended_on', { ascending: false }),
    ]);
    const bad = results.find((r: any) => r.error);
    if (bad?.error) setError(bad.error.message);
    else {
      setStudents(results[0].data || []); setStudentSubjects(results[1].data || []); setTeachers(results[2].data || []);
      setSubjects(results[3].data || []); setSchedule(results[4].data || []); setPayments(results[5].data || []);
      setNews(results[6].data || []); setPresence(results[7].data || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (session && isAdmin) refresh(); }, [session, isAdmin]);

  const remove = async (table: string, id: string) => {
    const { error: e } = await supabase.from(table).delete().eq('id', id);
    if (e) setError(e.message); else refresh();
  };

  const removeStudent = async (id: string) => {
    if (!window.confirm('Supprimer cet élève ?')) return;
    setError('');
    const { error: ssError } = await supabase.from('student_subjects').delete().eq('student_id', id);
    if (ssError) { setError(ssError.message); return; }
    const { error: attendanceError } = await supabase.from('attendance').delete().eq('student_id', id);
    if (attendanceError) { setError(attendanceError.message); return; }
    const { error: paymentsError } = await supabase.from('payments').delete().eq('student_id', id);
    if (paymentsError) { setError(paymentsError.message); return; }
    const { error: studentError } = await supabase.from('students').delete().eq('id', id);
    if (studentError) { setError(studentError.message); return; }
    if (selected?.id === id) setSelected(null);
    await refresh();
  };

  const addStudent = async (e: any) => {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get('name') || '').trim();
    const studentEmail = String(f.get('email') || '').trim();
    const level = String(f.get('level') || '');
    const phone = String(f.get('phone') || '').trim() || null;
    const whatsappNumber = normalizeWhatsAppPhone(phone);
    const whatsappWindow = whatsappNumber ? window.open('about:blank', '_blank') : null;

    const { data: existing, error: checkError } = await supabase.from('students').select('id,full_name,email');
    if (checkError) { whatsappWindow?.close(); setError(checkError.message); return; }
    const norm = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();
    if (existing?.some((s: any) => norm(s.full_name || '') === norm(full_name))) { whatsappWindow?.close(); setError('⚠️ Cet élève est déjà inscrit avec le même nom.'); return; }
    if (studentEmail && existing?.some((s: any) => norm(s.email || '') === norm(studentEmail))) { whatsappWindow?.close(); setError('⚠️ Cet email est déjà utilisé par un autre élève.'); return; }
    const { data: student, error: insertError } = await supabase.from('students').insert({ full_name, email: studentEmail || null, phone, level }).select().single();
    if (insertError) { whatsappWindow?.close(); setError(insertError.message); return; }
    const subjectIds = f.getAll('subject_ids').map(String);
    if (subjectIds.length) {
      const { error: ssError } = await supabase.from('student_subjects').insert(subjectIds.map(subject_id => ({ student_id: student.id, subject_id })));
      if (ssError) { whatsappWindow?.close(); setError('Élève ajouté, mais matières non enregistrées: ' + ssError.message); return; }
    }
    const amount = Number(f.get('payment_amount') || 0);
    const paidDate = String(f.get('payment_date') || moroccoDate());
    if (amount > 0) {
      const valid = new Date(paidDate + 'T00:00:00'); valid.setMonth(valid.getMonth() + 1);
      const { error: payError } = await supabase.from('payments').insert({
        student_id: student.id, amount, status: 'Payé',
        paid_at: new Date(paidDate + 'T00:00:00').toISOString(),
        valid_until: valid.toISOString().slice(0, 10)
      });
      if (payError) { whatsappWindow?.close(); setError('Élève ajouté, mais paiement non enregistré: ' + payError.message); return; }
    }

    e.currentTarget.reset(); setStudentLevel(''); await refresh();
    if (whatsappWindow && whatsappNumber) whatsappWindow.location.href = `https://wa.me/${whatsappNumber}`;
  };

  const renewSubscription = async () => {
    if (!selected) return;
    const amount = Number(renewAmount || 0);
    if (amount <= 0) { setError('Veuillez entrer un montant valide.'); return; }
    const start = renewDate || moroccoDate();
    const valid = new Date(start + 'T00:00:00'); valid.setMonth(valid.getMonth() + 1);
    const { error: e } = await supabase.from('payments').insert({
      student_id: selected.id, amount, status: 'Payé',
      paid_at: new Date(start + 'T00:00:00').toISOString(),
      valid_until: valid.toISOString().slice(0, 10)
    });
    if (e) { setError(e.message); return; }
    setRenewAmount(''); setRenewDate(moroccoDate()); await refresh();
  };

  const addTeacher = async (e: any) => {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget);
    const subjectId = String(f.get('subject_id') || '');
    if (!teacherLevel || !subjectId) { setError('Choisissez le niveau et la matière.'); return; }
    const { data: teacher, error: teacherError } = await supabase.from('teachers').insert({
      full_name: String(f.get('name') || ''), email: String(f.get('email') || '') || null, phone: String(f.get('phone') || '') || null
    }).select().single();
    if (teacherError || !teacher) { setError(teacherError?.message || 'Erreur lors de l’ajout du professeur.'); return; }
    const { error: subjectError } = await supabase.from('subjects').update({ teacher_id: teacher.id }).eq('id', subjectId).eq('level', teacherLevel);
    if (subjectError) { await supabase.from('teachers').delete().eq('id', teacher.id); setError(subjectError.message); return; }
    e.currentTarget.reset(); setTeacherLevel(''); refresh();
  };

  const addSimple = async (e: any, table: string, payload: any) => {
    e.preventDefault(); setError('');
    const { error: e2 } = await supabase.from(table).insert(payload);
    if (e2) setError(e2.message); else { e.currentTarget.reset(); refresh(); }
  };

  const addPayment = async (e: any) => {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget);
    const student_id = String(f.get('student_id')); const amount = Number(f.get('amount'));
    const paidDate = String(f.get('paid_date') || moroccoDate());
    const valid = new Date(paidDate + 'T00:00:00'); valid.setMonth(valid.getMonth() + 1);
    const { error: delError } = await supabase.from('payments').delete().eq('student_id', student_id);
    if (delError) { setError(delError.message); return; }
    const { error: insError } = await supabase.from('payments').insert({ student_id, amount, status: 'Payé', note: String(f.get('note') || '') || null, paid_at: new Date(paidDate + 'T00:00:00').toISOString(), valid_until: valid.toISOString().slice(0, 10) });
    if (insError) setError(insError.message); else { e.currentTarget.reset(); refresh(); }
  };

  const markAttendance = async (status: string) => {
    if (!selected) return;
    const { error: e } = await supabase.from('attendance').upsert({ student_id: selected.id, attended_on: moroccoDate(), status }, { onConflict: 'student_id,attended_on' });
    if (e) setError(e.message); else refresh();
  };

  if (!authReady) return <div className="loading">Chargement...</div>;
  if (!session) return <main className="loginPage"><form className="loginBox" onSubmit={async e => { e.preventDefault(); setLoginError(''); const { error: e2 } = await supabase.auth.signInWithPassword({ email, password }); if (e2) setLoginError('Email ou mot de passe incorrect.'); }}><img src="/logo.png" alt="Centre Les Profs"/><h1>Administration</h1>{loginError && <div className="error">{loginError}</div>}<input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required/><input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required/><button>Se connecter</button></form></main>;
  if (!isAdmin) return <main className="loginPage"><div className="loginBox"><h1>Accès refusé</h1><p>Ce compte n'a pas les droits administrateur.</p><button onClick={() => supabase.auth.signOut()}>Se déconnecter</button></div></main>;

  const today = moroccoDate();
  const present = presence.filter(p => p.attended_on === today && p.status === 'Présent').length;
  const filteredStudents = students.filter(s => { const q = search.toLowerCase().trim(); return !q || [s.full_name, s.email, s.phone].some(v => String(v || '').toLowerCase().includes(q)); });

  return <main className="dash">
    <aside><a className="logo" href="/"><img src="/logo.png"/><span>Centre<br/><b>Les Profs</b></span></a>{tabs.map(t => <button key={t[0]} className={tab === t[0] ? 'active' : ''} onClick={() => setTab(t[0])}><i>{t[1]}</i><span>{t[2]}</span></button>)}<a className="public" href="/">↗ Site public</a><button className="logout" onClick={() => supabase.auth.signOut()}>🚪 Déconnexion</button></aside>
    <section className="content"><div className="top"><div><p className="tag">ADMINISTRATION</p><h1>{tabs.find(t => t[0] === tab)?.[2]}</h1></div><b>🔴 Admin</b></div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      {loading ? <div className="loading">Chargement de Supabase...</div> : <>
      {tab === 'home' && <><div className="metrics"><Metric i="👨‍🎓" n={students.length} t="Élèves"/><Metric i="👨‍🏫" n={teachers.length} t="Professeurs"/><Metric i="📚" n={subjects.length} t="Matières"/><Metric i="✅" n={present} t="Présents aujourd'hui"/></div><Box title="Bienvenue"><p>Gère ton centre depuis un seul endroit.</p></Box></>}
      {tab === 'students' && <div className="cols"><Box title="Ajouter un élève"><form className="form" onSubmit={addStudent}><input name="name" placeholder="Nom complet" required/><input name="email" type="email" placeholder="Email" required/><input name="phone" placeholder="Téléphone"/><select name="level" value={studentLevel} onChange={e=>setStudentLevel(e.target.value)} required><option value="" disabled>Choisir le niveau</option>{levels.map(x => <option key={x} value={x}>{x}</option>)}</select>{studentLevel && <><p><b>📚 Matières de {studentLevel} :</b></p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,maxHeight:220,overflow:'auto'}}>{subjects.filter(x=>x.level===studentLevel).length ? subjects.filter(x=>x.level===studentLevel).map(x => <label key={x.id} className="subject-option"><input type="checkbox" name="subject_ids" value={x.id}/><span>📚 {x.name}</span></label>) : <p className="empty">Aucune matière pour ce niveau.</p>}</div><p style={{fontSize:13,opacity:.7,marginTop:8}}>يمكن اختيار أكثر من مادة.</p></>}<div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #e5e5e5'}}><p><b>💰 Paiement à l'inscription</b></p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input name="payment_amount" type="number" min="0" step="0.01" placeholder="Montant (DH) — optionnel"/><input name="payment_date" type="date" defaultValue={moroccoDate()}/></div><small style={{opacity:.7}}>Si un montant est indiqué, le paiement sera enregistré automatiquement et valable 1 mois.</small></div><button>Ajouter l'élève</button></form></Box></div>}
      {tab === 'students_list' && <div className="cols"><Box title={`Liste des élèves (${students.length})`}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Rechercher..." style={{ width: '100%', marginBottom: 12 }}/>{filteredStudents.map(s => <Row key={s.id} title={s.full_name} sub={`${s.level} • ${s.phone || ''} ${s.email ? '• ' + s.email : ''}`} action={() => router.push('/admin/eleve/' + s.id)} deleteAction={() => removeStudent(s.id)}/>) }{!filteredStudents.length && <p className="empty">Aucun élève.</p>}</Box>{selected && <Box title={`📋 ${selected.full_name}`}><p><b>Niveau:</b> {selected.level}</p><p><b>QR:</b></p>{selected.qr_code && <QRCodeSVG value={selected.qr_code}/>}<p><b>Absences:</b> {presence.filter(p => p.student_id === selected.id && p.status === 'Absent').length}</p><div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #e5e5e5'}}><p><b>💰 Renouveler l'abonnement</b></p><input type="number" min="1" step="0.01" placeholder="Montant (DH)" value={renewAmount} onChange={e=>setRenewAmount(e.target.value)}/><input type="date" value={renewDate} onChange={e=>setRenewDate(e.target.value)}/><small style={{display:'block',opacity:.7,margin:'6px 0'}}>Le nouvel abonnement sera valable 1 mois à partir de la date choisie.</small><button onClick={renewSubscription}>🔄 Renouveler l'abonnement</button></div><button onClick={() => setSelected(null)}>Fermer</button></Box>}</div>}
      {tab === 'teachers' && <div className="cols"><Box title="Ajouter un professeur"><form className="form" onSubmit={addTeacher}><input name="name" placeholder="Nom complet" required/><input name="email" type="email" placeholder="Email"/><input name="phone" placeholder="Téléphone"/><select value={teacherLevel} onChange={e=>setTeacherLevel(e.target.value)} required><option value="" disabled>Choisir le niveau</option>{levels.map(x => <option key={x} value={x}>{x}</option>)}</select>{teacherLevel && <select name="subject_id" required><option value="">Choisir la matière</option>{subjects.filter(s=>s.level===teacherLevel).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}<button>Ajouter</button></form></Box><Box title="Professeurs">{teachers.map(t => {const ts=subjects.filter(s=>s.teacher_id===t.id);return <Row key={t.id} title={t.full_name || t.name} sub={[t.email || t.phone || '', ...ts.map(s=>s.name+' • '+s.level)].filter(Boolean).join(' — ')} action={() => remove('teachers', t.id)}/>})}{!teachers.length && <p className="empty">Aucun professeur.</p>}</Box></div>}
      {tab === 'subjects' && <div className="cols"><Box title="Ajouter une matière"><form className="form" onSubmit={e => addSimple(e, 'subjects', { name: String(new FormData(e.currentTarget).get('name') || ''), level: String(new FormData(e.currentTarget).get('level') || '') })}><input name="name" placeholder="Nom de la matière" required/><select name="level">{levels.map(x => <option key={x}>{x}</option>)}</select><button>Ajouter</button></form></Box><Box title="Matières">{subjects.map(s => <Row key={s.id} title={s.name} sub={s.level} action={() => remove('subjects', s.id)}/>)}{!subjects.length && <p className="empty">Aucune matière.</p>}</Box></div>}
      {tab === 'schedule' && <div className="cols"><Box title="Nouvelle séance"><form className="form" onSubmit={e => { const f = new FormData(e.currentTarget); return addSimple(e, 'schedules', { level: String(f.get('level')), subject_id: String(f.get('subject_id')) || null, teacher_id: String(f.get('teacher_id')) || null, day: String(f.get('day')), start_time: String(f.get('start_time')), end_time: String(f.get('end_time')), room: String(f.get('room') || '') || null }); }}><select name="level">{levels.map(x => <option key={x}>{x}</option>)}</select><select name="subject_id"><option value="">Matière</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select name="teacher_id"><option value="">Professeur</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.name}</option>)}</select><input name="day" placeholder="Jour" required/><input name="start_time" type="time" required/><input name="end_time" type="time" required/><input name="room" placeholder="Salle"/><button>Ajouter</button></form></Box><Box title="Emploi du temps">{schedule.map(s => <Row key={s.id} title={`${s.day} • ${s.start_time || ''}-${s.end_time || ''}`} sub={s.level} action={() => remove('schedules', s.id)}/>)}{!schedule.length && <p className="empty">Aucune séance.</p>}</Box></div>}
      {tab === 'qr' && <Box title="QR & Présence"><p>Pour démarrer une séance et scanner les élèves :</p><a className="button" href="/admin/scan">📷 Ouvrir le scanner</a>{selected && <><hr/><QRCodeSVG value={selected.qr_code || selected.id}/><button onClick={() => markAttendance('Présent')}>Marquer Présent</button><button onClick={() => markAttendance('Absent')}>Marquer Absent</button></>}</Box>}
      {tab === 'payments' && <div className="cols"><Box title="Nouveau paiement"><form className="form" onSubmit={addPayment}><select name="student_id" required><option value="">Élève</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select><input name="amount" type="number" min="0" placeholder="Montant" required/><input name="paid_date" type="date" defaultValue={today}/><input name="note" placeholder="Note"/><button>Enregistrer le paiement</button></form></Box><Box title="Paiements">{payments.map(p => <Row key={p.id} title={`${students.find(s => s.id === p.student_id)?.full_name || 'Élève'} — ${p.amount} DH`} sub={`Valide jusqu'au ${p.valid_until || '-'}`} action={() => remove('payments', p.id)}/>)}{!payments.length && <p className="empty">Aucun paiement.</p>}</Box></div>}
      {tab === 'news' && <div className="cols"><Box title="Nouvelle annonce"><form className="form" onSubmit={e => { const f = new FormData(e.currentTarget); return addSimple(e, 'announcements', { title: String(f.get('title')), content: String(f.get('content')), is_published: true }); }}><input name="title" placeholder="Titre" required/><textarea name="content" placeholder="Contenu" required/><button>Publier</button></form></Box><Box title="Annonces">{news.map(n => <Row key={n.id} title={n.title} sub={n.content} action={() => remove('announcements', n.id)}/>)}</Box></div>}
      {tab === 'stats' && <div className="metrics"><Metric i="👨‍🎓" n={students.length} t="Élèves"/><Metric i="✅" n={presence.filter(p => p.status === 'Présent').length} t="Présences"/><Metric i="❌" n={presence.filter(p => p.status === 'Absent').length} t="Absences"/><Metric i="💰" n={payments.length} t="Paiements"/></div>}
      </>}
    </section>
  </main>;
}

function Box({ title, children }: any) { return <div className="box"><h2>{title}</h2>{children}</div>; }
function Row({ title, sub, action, deleteAction }: any) {
  const removeAction = deleteAction || action;
  return <div className="row">
    <div onClick={action} style={{ flex: 1, cursor: action ? 'pointer' : 'default' }}><b>{title}</b><small>{sub}</small></div>
    {removeAction && <button type="button" onClick={e => { e.stopPropagation(); removeAction(); }}>Supprimer</button>}
  </div>;
}
function Metric({ i, n, t }: any) { return <div className="metric"><span>{i}</span><b>{n}</b><small>{t}</small></div>; }
