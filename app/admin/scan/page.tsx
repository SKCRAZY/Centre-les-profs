'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';

export default function ScanPage() {
  const scanner = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [message, setMessage] = useState('Prêt à scanner');
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [closed, setClosed] = useState(false);
  const [sessionDate, setSessionDate] = useState('');

  const moroccoDate = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  const checkMoroccoTime = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Casablanca',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return hour > 22 || (hour === 22 && minute >= 0);
  };

  const startSession = async () => {
    const date = moroccoDate();
    const { data: existing, error: findError } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_date', date)
      .eq('status', 'active')
      .maybeSingle();

    if (findError) {
      setMessage('Erreur: ' + findError.message);
      return;
    }

    if (!existing) {
      const { error } = await supabase
        .from('sessions')
        .insert({ session_date: date, status: 'active' });
      if (error) {
        setMessage('Erreur: ' + error.message);
        return;
      }
    }

    setSessionDate(date);
    setClosed(false);
    setStarted(true);
    setMessage('🟢 Séance démarrée. Scanner prêt.');
  };

  useEffect(() => {
    const today = moroccoDate();
    setSessionDate(today);
    setClosed(checkMoroccoTime());

    const timer = window.setInterval(() => {
      const currentDate = moroccoDate();

      if (currentDate !== sessionDate && sessionDate) {
        setSessionDate(currentDate);
        setStarted(false);
        setClosed(false);
        setStudent(null);
        setSubjects([]);
        setPayment(null);
        setMessage('Nouveau jour — aucune séance démarrée.');
        busyRef.current = false;
        return;
      }

      if (started && checkMoroccoTime()) {
        setClosed(true);
        setStarted(false);
        scanner.current?.stop().catch(() => undefined);
        try {
          scanner.current?.clear();
        } catch {
          // Scanner may already be cleared/stopped.
        }
        setMessage('🔒 La séance est terminée automatiquement à 22:00 (heure du Maroc).');
      }
    }, 10000);

    return () => window.clearInterval(timer);
  }, [sessionDate, started]);

  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    const start = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setMessage("Connecte-toi à l’administration d’abord.");
        return;
      }

      const qrScanner = new Html5Qrcode('qr-reader');
      scanner.current = qrScanner;

      try {
        await qrScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (busyRef.current) return;
            busyRef.current = true;
            setBusy(true);

            try {
              const today = moroccoDate();
              const { data: activeSession, error: sessionError } = await supabase
                .from('sessions')
                .select('id')
                .eq('session_date', today)
                .eq('status', 'active')
                .maybeSingle();

              if (sessionError) throw sessionError;
              if (!activeSession) {
                setStarted(false);
                setClosed(true);
                setMessage('🔒 La séance est fermée pour aujourd’hui.');
                return;
              }

              const { data: s, error: se } = await supabase
                .from('students')
                .select('id,full_name,level,qr_code')
                .eq('qr_code', decodedText)
                .maybeSingle();

              if (se) throw se;
              if (!s) {
                setStudent(null);
                setMessage('QR invalide ou élève introuvable.');
                return;
              }

              setStudent(s);

              const [subRes, payRes] = await Promise.all([
                supabase
                  .from('student_subjects')
                  .select('subject_id, subjects(id,name,level)')
                  .eq('student_id', s.id),
                supabase
                  .from('payments')
                  .select('*')
                  .eq('student_id', s.id)
                  .order('created_at', { ascending: false })
                  .limit(1),
              ]);

              setSubjects(
                (subRes.data || [])
                  .map((x: any) => x.subjects)
                  .filter(Boolean),
              );
              setPayment(payRes.data?.[0] || null);

              const { error: ae } = await supabase
                .from('attendance')
                .upsert(
                  { student_id: s.id, attended_on: today, status: 'Présent' },
                  { onConflict: 'student_id,attended_on' },
                );

              if (ae) throw ae;
              setMessage(`Présence enregistrée ✓ ${s.full_name}`);
            } catch (e: any) {
              setMessage(`Erreur: ${e?.message || 'enregistrement impossible'}`);
            } finally {
              window.setTimeout(() => {
                busyRef.current = false;
                setBusy(false);
              }, 1200);
            }
          },
          () => {},
        );
      } catch (e: any) {
        if (!cancelled) {
          setMessage(
            `Impossible d’ouvrir la caméra: ${e?.message || 'autorisation requise'}`,
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      const current = scanner.current;
      scanner.current = null;
      if (current) {
        current
          .stop()
          .catch(() => undefined)
          .finally(() => {
            try {
              current.clear();
            } catch {
              // Scanner may already be cleared/stopped.
            }
          });
      }
    };
  }, [started]);

  const subscriptionInfo = () => {
    if (!payment) {
      return <p><b>💰 Abonnement :</b> 🔴 Aucun paiement enregistré</p>;
    }

    const end = payment.valid_until
      ? new Date(payment.valid_until + 'T00:00:00')
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = payment.status === 'Payé' && end !== null && end >= today;
    const days = end
      ? Math.ceil((end.getTime() - today.getTime()) / 86400000)
      : null;

    return (
      <>
        <p><b>💰 Abonnement :</b> {active ? '✅ Actif' : '🔴 Expiré / non payé'}</p>
        {payment.paid_at && (
          <p><b>📅 Payé le :</b> {new Date(payment.paid_at).toLocaleDateString('fr-FR')}</p>
        )}
        {end && (
          <p><b>📆 Valable jusqu’au :</b> {end.toLocaleDateString('fr-FR')}</p>
        )}
        {active && days !== null && <p><b>⏳ Jours restants :</b> {days} jour(s)</p>}
        {payment.amount && <p><b>💵 Montant :</b> {payment.amount} DH</p>}
      </>
    );
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <a href="/admin" style={{ textDecoration: 'none' }}>← Administration</a>
      <h1>📱 Scanner QR — Présence</h1>
      <p>{message}</p>

      {!started && !closed && (
        <button onClick={startSession} style={{ padding: '12px 20px', fontSize: 16 }}>
          ▶️ Démarrer la séance
        </button>
      )}
      {closed && <p>🔒 Séance fermée pour aujourd’hui.</p>}
      {started && <p>🟢 Séance en cours — fermeture automatique à 22:00 (heure du Maroc)</p>}

      {started && (
        <div id="qr-reader" style={{ width: '100%', maxWidth: 500, margin: '20px auto' }} />
      )}

      {student && (
        <div style={{ padding: 22, borderRadius: 16, background: '#f3f4f6' }}>
          <h2 style={{ textAlign: 'center' }}>👨‍🎓 {student.full_name}</h2>
          <p><b>📚 Niveau :</b> {student.level}</p>
          <p><b>📖 Matières :</b></p>
          {subjects.length ? (
            <ul>{subjects.map((x) => <li key={x.id}>{x.name}</li>)}</ul>
          ) : (
            <p>Aucune matière sélectionnée pour cet élève.</p>
          )}
          {subscriptionInfo()}
          <hr style={{ margin: '16px 0' }} />
          <strong>✅ Présent aujourd’hui</strong>
        </div>
      )}
    </main>
  );
}
