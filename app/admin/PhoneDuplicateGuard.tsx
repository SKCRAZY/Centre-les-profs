'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const normalizePhone = (phone: string) => {
  let number = phone.replace(/\D/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  if (number.startsWith('0')) number = '212' + number.slice(1);
  return number;
};

export default function PhoneDuplicateGuard() {
  useEffect(() => {
    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form?.querySelector('input[name="name"]') || !form?.querySelector('input[name="phone"]')) return;

      // Allow the re-submission after the duplicate check has passed.
      if (form.dataset.phoneGuardBypass === 'true') {
        delete form.dataset.phoneGuardBypass;
        return;
      }

      const phoneInput = form.querySelector<HTMLInputElement>('input[name="phone"]');
      const phone = phoneInput?.value.trim() || '';
      if (!phone) return;

      const normalized = normalizePhone(phone);
      if (!normalized) return;

      // Stop the original submit immediately. The previous version waited for
      // Supabase first, which was too late because React could already insert.
      event.preventDefault();
      event.stopImmediatePropagation();

      void (async () => {
        const { data, error } = await supabase.from('students').select('phone');
        if (error) {
          form.dataset.phoneGuardBypass = 'true';
          form.requestSubmit();
          return;
        }

        const exists = (data || []).some(
          (student: any) => normalizePhone(String(student.phone || '')) === normalized
        );

        if (exists) {
          alert('Ce numéro est déjà utilisé.');
          return;
        }

        form.dataset.phoneGuardBypass = 'true';
        form.requestSubmit();
      })();
    };

    document.addEventListener('submit', handleSubmit, true);
    return () => document.removeEventListener('submit', handleSubmit, true);
  }, []);

  return null;
}
