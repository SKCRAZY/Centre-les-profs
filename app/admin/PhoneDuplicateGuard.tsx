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
    const handleSubmit = async (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form?.querySelector('input[name="name"]') || !form?.querySelector('input[name="phone"]')) return;

      const phoneInput = form.querySelector<HTMLInputElement>('input[name="phone"]');
      const phone = phoneInput?.value.trim() || '';
      if (!phone) return;

      const normalized = normalizePhone(phone);
      if (!normalized) return;

      const { data, error } = await supabase.from('students').select('phone');
      if (error) return;

      const exists = (data || []).some((student: any) => normalizePhone(String(student.phone || '')) === normalized);
      if (exists) {
        event.preventDefault();
        event.stopImmediatePropagation();
        alert('Ce numéro est déjà utilisé.');
      }
    };

    document.addEventListener('submit', handleSubmit, true);
    return () => document.removeEventListener('submit', handleSubmit, true);
  }, []);

  return null;
}
