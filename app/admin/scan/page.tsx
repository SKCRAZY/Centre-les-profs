'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';

export default function ScanPage() {
  const scanner = useRef<Html5Qrcode | null>(null);
  const [message, setMessage] = useState('Prêt à scanner');
  const [student, setStudent] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const start = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMessage('Connecte-toi à l’administration d’abord.');
        return;
      }
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
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <a href="/admin" style={{ textDecoration: 'none' }}>← Administration</a>
      <h1>📱 Scanner QR — Présence</h1>
      <p>{message}</p>
      <div id="qr-reader" style={{ width: '100%', maxWidth: 500, margin: '20px auto' }} />
      {student && (
        <div style={{ padding: 20, borderRadius: 16, background: '#f3f4f6', textAlign: 'center' }}>
          <h2>{student.full_name}</h2>
          <p>{student.level}</p>
          <strong>✅ Présent aujourd’hui</strong>
        </div>
      )}
    </main>
  );
}
