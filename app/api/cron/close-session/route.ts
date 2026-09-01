import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: 'Missing server configuration' }, { status: 500 });

  const supabase = createClient(url, key);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const date = `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}-${parts.find(p=>p.type==='day')?.value}`;

  const { data: session, error: sessionError } = await supabase
    .from('sessions').select('id').eq('session_date', date).eq('status', 'active').maybeSingle();

  if (sessionError) return Response.json({ error: sessionError.message }, { status: 500 });
  if (!session) return Response.json({ ok: true, message: 'No active session' });

  const [{ data: students, error: studentsError }, { data: present, error: presentError }] = await Promise.all([
    supabase.from('students').select('id'),
    supabase.from('attendance').select('student_id').eq('attended_on', date).eq('status', 'Présent')
  ]);

  if (studentsError || presentError) {
    return Response.json({ error: studentsError?.message || presentError?.message }, { status: 500 });
  }

  const presentIds = new Set((present || []).map((p: any) => p.student_id));
  const absences = (students || []).filter((s: any) => !presentIds.has(s.id))
    .map((s: any) => ({ student_id: s.id, attended_on: date, status: 'Absent' }));

  if (absences.length) {
    const { error } = await supabase.from('attendance').upsert(absences, { onConflict: 'student_id,attended_on' });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  const { error: closeError } = await supabase.from('sessions')
    .update({ status: 'closed', ended_at: new Date().toISOString() }).eq('id', session.id);

  if (closeError) return Response.json({ error: closeError.message }, { status: 500 });

  return Response.json({ ok: true, date, absent: absences.length });
}
