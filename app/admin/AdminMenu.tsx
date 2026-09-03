'use client';

import { useEffect, useState } from 'react';

const items = [
  ['🏠', "Vue d'ensemble"],
  ['➕', 'Ajouter un élève'],
  ['👨‍🎓', 'Élèves inscrits'],
  ['👨‍🏫', 'Professeurs'],
  ['📚', 'Matières'],
  ['🗓️', 'Emploi du temps'],
  ['📱', 'QR & Présence'],
  ['📢', 'Annonces'],
  ['📊', 'Statistiques'],
];

export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => setReady(!!document.querySelector('.dash'));
    check();
    const timer = window.setInterval(check, 250);
    return () => window.clearInterval(timer);
  }, []);

  if (!ready) return null;

  const go = (index: number) => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.dash aside > button');
    buttons[index]?.click();
    setOpen(false);
  };

  return <>
    <style>{`
      .admin-mobile-menu-button,.admin-mobile-menu,.admin-mobile-overlay{display:none}
      @media(max-width:700px){
        .dash aside{display:none!important}
        .dash .content{margin-left:0!important;width:100%!important;padding:76px 14px 25px!important}
        .admin-mobile-menu-button{display:flex;position:fixed;top:14px;left:14px;width:48px;height:48px;align-items:center;justify-content:center;border:2px solid #f5bf28;border-radius:13px;background:linear-gradient(135deg,#d90812,#98050b);color:#fff;font-size:25px;z-index:1002;box-shadow:0 8px 25px #0006;cursor:pointer}
        .admin-mobile-overlay{display:block;position:fixed;inset:0;background:#0009;z-index:1000;border:0}
        .admin-mobile-menu{display:flex;position:fixed;top:0;left:0;bottom:0;width:min(330px,88vw);flex-direction:column;padding:22px 14px;background:linear-gradient(180deg,#16070a,#09090b);color:#fff;z-index:1001;transform:translateX(-105%);transition:transform .25s ease;box-shadow:12px 0 35px #0009;overflow-y:auto}
        .admin-mobile-menu.open{transform:translateX(0)}
        .admin-mobile-menu-header{display:flex;align-items:center;gap:12px;padding:4px 8px 22px;border-bottom:1px solid #4b1b16;margin-bottom:12px}
        .admin-mobile-menu-header img{width:48px;height:48px;border-radius:50%;border:2px solid #f5bf28;object-fit:cover}.admin-mobile-menu-header b{color:#f5bf28;font-size:18px}
        .admin-mobile-item{display:flex;align-items:center;gap:13px;width:100%;padding:14px 13px;margin:2px 0;border:0;border-radius:10px;background:transparent;color:#ddd;text-align:left;font-size:14px;cursor:pointer}.admin-mobile-item:hover{background:#3b1116;color:#fff}.admin-mobile-item span:first-child{font-size:20px;width:25px;text-align:center}
        .admin-mobile-close{margin-top:auto;display:block;width:100%;padding:13px;border:1px solid #f05b60;border-radius:10px;background:#98050b;color:#fff;font-weight:700;cursor:pointer}
      }
    `}</style>
    <button className="admin-mobile-menu-button" type="button" aria-label="Ouvrir le menu" onClick={() => setOpen(v => !v)}>{open ? '✕' : '☰'}</button>
    {open && <button className="admin-mobile-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    <aside className={`admin-mobile-menu${open ? ' open' : ''}`}>
      <div className="admin-mobile-menu-header"><img src="/logo.png" alt="Centre Les Profs"/><div>Centre<br/><b>Les Profs</b></div></div>
      {items.map(([icon, label], i) => <button key={label} className="admin-mobile-item" onClick={() => go(i)}><span>{icon}</span><span>{label}</span></button>)}
      <a className="admin-mobile-item" href="/admin/ai-study"><span>🤖</span><span>AI Study</span></a>
      <a className="admin-mobile-item" href="/"><span>↗</span><span>Site public</span></a>
      <button className="admin-mobile-close" onClick={() => setOpen(false)}>Fermer le menu</button>
    </aside>
  </>;
}
