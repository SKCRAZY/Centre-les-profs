'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const levels = ['3ème année collège', 'Tronc Commun', '1ère année Bac', '2ème année Bac'];

type Subject = { id: string; name: string; level: string };

export default function NewSeance() {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    let cleanup: (() => void) | null = null;
    let connected = false;

    const connect = async () => {
      if (connected) return;

      const headings = Array.from(document.querySelectorAll('.dash .box h2'));
      const heading = headings.find(el => el.textContent?.trim() === 'Nouvelle séance');
      if (!heading) return;

      const box = heading.parentElement;
      const form = box?.querySelector('form');
      if (!form) return;

      const levelSelect = form.querySelector('select[name="level"]') as HTMLSelectElement | null;
      const subjectSelect = form.querySelector('select[name="subject_id"]') as HTMLSelectElement | null;
      if (!levelSelect || !subjectSelect) return;

      connected = true;

      const { data, error } = await supabase
        .from('subjects')
        .select('id,name,level')
        .order('name');

      if (error) {
        console.error('Erreur chargement matières:', error.message);
        connected = false;
        return;
      }

      const subjects = (data || []) as Subject[];

      const updateSubjects = () => {
        const level = levelSelect.value;
        const currentValue = subjectSelect.value;
        const filtered = subjects.filter(subject => subject.level === level);

        subjectSelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = filtered.length ? 'Matière' : 'Aucune matière pour ce niveau';
        subjectSelect.appendChild(placeholder);

        filtered.forEach(subject => {
          const option = document.createElement('option');
          option.value = String(subject.id);
          option.textContent = subject.name;
          subjectSelect.appendChild(option);
        });

        if (filtered.some(subject => String(subject.id) === currentValue)) {
          subjectSelect.value = currentValue;
        }

        subjectSelect.disabled = filtered.length === 0;
      };

      levelSelect.addEventListener('change', updateSubjects);
      updateSubjects();

      cleanup = () => {
        levelSelect.removeEventListener('change', updateSubjects);
        connected = false;
      };
    };

    connect();
    observer = new MutationObserver(() => connect());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      cleanup?.();
    };
  }, []);

  return null;
}
