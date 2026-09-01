import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('CRON unauthorized');
    return new Response('Unauthorized', { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('CRON missing Supabase server configuration');
    return Response.json({ error: 'Missing server configuration' }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const date = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('session_date', date)
    .eq('status', 'active')
    .maybeSingle();

  if (sessionError) {
    console.error('CRON session error:', sessionError.message);
    return Response.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    console.log('CRON no active session for', date);
    return Response.json({ ok: true, message: 'No active session', date });
  }

  const [{ data: students, error: studentsError }, { data: attendance, error: attendanceError }] =
    await Promise.all([
      supabase.from('students').select('id'),
      supabase.from('attendance').select('student_id').eq('attended_on', date)
    ]);

  if (studentsError || attendanceError) {
    const error = studentsError?.message || attendanceError?.message || 'Unknown database error';
    console.error('CRON attendance load error:', error);
    return Response.json({ error }, { status: 500 });
  }

  // Never overwrite an existing attendance status (Présent, Retard, etc.).
  const recordedIds = new Set((attendance || []).map((row: any) => row.student_id));
  const absences = (students || [])
    .filter((student: any) => !recordedIds.has(student.id))
    .map((student: any) => ({
      student_id: student.id,
      attended_on: date,
      status: 'Absent'
    }));

  if (absences.length > 0) {
    const { error: insertError } = await supabase
      .from('attendance')
      .insert(absences);

    if (insertError) {
      console.error('CRON absence insert error:', insertError.message);
      return Response.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { error: closeError } = await supabase
    .from('sessions')
    .update({ status: 'closed', ended_at: new Date().toISOString() })
    .eq('id', session.id);

  if (closeError) {
    console.error('CRON close session error:', closeError.message);
    return Response.json({ error: closeError.message }, { status: 500 });
  }

  console.log('CRON success', { date, absent: absences.length, sessionId: session.id });
  return Response.json({ ok: true, date, absent: absences.length });
}
