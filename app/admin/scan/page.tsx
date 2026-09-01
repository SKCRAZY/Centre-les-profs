'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';

export default function ScanPage() {
  const scanner = useRef<Html5Qrcode | null>(null);
  const [message, setMessage] = useState('Prêt à scanner');
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const start = async () => {
      if (!started) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setMessage('Connecte-toi à l’administration d’abord.'); return; }

      scanner.current = new Html5Qrcode('qr-reader');

      try {
        await scanner.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (busy) return;
            setBusy(true);

            try {
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
                  .limit(1)
              ]);

              setSubjects(
                (subRes.data || [])
                  .map((x: any) => x.subjects)
                  .filter(Boolean)
              );

              setPayment(payRes.data?.[0] || null);

              const today = new Date().toISOString().slice(0, 10);

              const { error: ae } = await supabase
                .from('attendance')
                .upsert(
                  { student_id: s.id, attended_on: today, status: 'Présent' },
                  { onConflict: 'student_id,attended_on' }
                );

              if (ae) throw ae;
              setMessage(`Présence enregistrée ✓ ${s.full_name}`);
            } catch (e: any) {
              setMessage(`Erreur: ${e?.message || 'enregistrement impossible'}`);
            } finally {
              setTimeout(() => setBusy(false), 1200);
            }
          },
          () => {}
        );
      } catch (e: any) {
        setMessage(`Impossible d’ouvrir la caméra: ${e?.message || 'autorisation requise'}`);
      }
    };

    start();

    return () => {
      scanner.current?.stop().catch(() => {});
      scanner.current?.clear();
    };
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const checkMoroccoTime = () => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
      const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);

      if (hour > 22 || (hour === 22 && minute >= 0)) {
        setClosed(true);
        setStarted(false);
        scanner.current?.stop().catch(() => {});
        scanner.current?.clear().catch(() => {});
        setMessage('🔒 La séance est terminée automatiquement à 22:00 (heure du Maroc).');
      }
    };

    checkMoroccoTime();
    const timer = window.setInterval(checkMoroccoTime, 10000);
    return () => window.clearInterval(timer);
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

    const active =
      payment.status === 'Payé' &&
      end !== null &&
      end >= today;

    const days = end
      ? Math.ceil((end.getTime() - today.getTime()) / 86400000)
      : null;

    return (
      <>
        <p>
          <b>💰 Abonnement :</b>{' '}
          {active ? '✅ Actif' : '🔴 Expiré / non payé'}
        </p>

        {payment.paid_at && (
          <p>
            <b>📅 Payé le :</b>{' '}
            {new Date(payment.paid_at).toLocaleDateString('fr-FR')}
          </p>
        )}

        {end && (
          <p>
            <b>📆 Valable jusqu’au :</b>{' '}
            {end.toLocaleDateString('fr-FR')}
          </p>
        )}

        {active && days !== null && (
          <p>
            <b>⏳ Jours restants :</b> {days} jour(s)
          </p>
        )}

        {payment.amount && (
          <p>
            <b>💵 Montant :</b> {payment.amount} DH
          </p>
        )}
      </>
    );
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <a href="/admin" style={{ textDecoration: 'none' }}>
        ← Administration
      </a>

      <h1>📱 Scanner QR — Présence</h1>
      <p>{message}</p>

      {!started && !closed && <button onClick={() => setStarted(true)} style={{ padding: '12px 20px', fontSize: 16 }}>▶️ Démarrer la séance</button>}
      {closed && <p>🔒 Séance fermée pour aujourd’hui.</p>}

      {started && <p>🟢 Séance en cours — fermeture automatique à 22:00 (heure du Maroc)</p>}

      {started && <div
        id="qr-reader"
        style={{ width: '100%', maxWidth: 500, margin: '20px auto' }}
      />}

      {student && (
        <div style={{ padding: 22, borderRadius: 16, background: '#f3f4f6' }}>
          <h2 style={{ textAlign: 'center' }}>
            👨‍🎓 {student.full_name}
          </h2>

          <p><b>📚 Niveau :</b> {student.level}</p>

          <p><b>📖 Matières :</b></p>

          {subjects.length ? (
            <ul>
              {subjects.map((x) => (
                <li key={x.id}>{x.name}</li>
              ))}
            </ul>
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
