'use client';

import { useEffect, useState } from "react";

export default function Intro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1700);
    const hideTimer = window.setTimeout(() => setVisible(false), 2300);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`site-intro ${leaving ? "site-intro-leaving" : ""}`} aria-hidden="true">
      <div className="intro-glow" />
      <div className="intro-content">
        <div className="intro-logo-wrap">
          <img className="intro-logo" src="/logo.png" alt="" />
        </div>
        <div className="intro-line" />
        <div className="intro-title">CENTRE LES PROFS</div>
        <div className="intro-subtitle">CENTRE DE SOUTIEN SCOLAIRE</div>
        <div className="intro-credit">Developed by Ali Tiji</div>
      </div>
      <style jsx>{`
        .site-intro { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; overflow:hidden; background:radial-gradient(circle at 50% 42%,#3b1015 0%,#16070a 35%,#070709 75%); animation:introIn .45s ease-out both; }
        .site-intro-leaving { animation:introOut .6s cubic-bezier(.7,0,.2,1) both; pointer-events:none; }
        .intro-glow { position:absolute; width:min(70vw,650px); height:min(70vw,650px); border-radius:50%; background:radial-gradient(circle,#f5bf2838 0%,#d9081218 35%,transparent 70%); filter:blur(10px); animation:pulse 1.8s ease-in-out infinite; }
        .intro-content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; text-align:center; animation:contentIn 1.15s cubic-bezier(.16,1,.3,1) both; }
        .intro-logo-wrap { width:clamp(130px,24vw,210px); height:clamp(130px,24vw,210px); padding:7px; border-radius:50%; background:linear-gradient(135deg,#ffe18a,#f5bf28 45%,#a96b00); box-shadow:0 0 0 1px #ffe18a88,0 0 45px #f5bf2866,0 25px 70px #000b; animation:logoReveal 1.15s cubic-bezier(.16,1,.3,1) both; }
        .intro-logo { width:100%; height:100%; display:block; object-fit:cover; border-radius:50%; background:#0b0b0d; }
        .intro-line { width:0; height:2px; margin-top:27px; background:linear-gradient(90deg,transparent,#f5bf28,transparent); animation:lineReveal .8s .55s ease-out forwards; }
        .intro-title { margin-top:18px; color:#fff; font-size:clamp(18px,3vw,29px); font-weight:900; letter-spacing:.18em; text-shadow:0 3px 18px #000; animation:textReveal .8s .65s ease-out both; }
        .intro-subtitle { margin-top:9px; color:#f5bf28; font-size:clamp(8px,1.4vw,12px); font-weight:800; letter-spacing:.28em; animation:textReveal .8s .8s ease-out both; }
        .intro-credit { margin-top:18px; color:#ffffff9c; font-size:10px; font-weight:500; letter-spacing:.08em; animation:creditReveal .9s 1s ease-out both; }
        @keyframes introIn { from{opacity:0} to{opacity:1} }
        @keyframes introOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.04)} }
        @keyframes contentIn { from{opacity:0;transform:translateY(25px) scale(.94)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes logoReveal { from{opacity:0;transform:scale(.35) rotate(-18deg)} 65%{transform:scale(1.06) rotate(2deg)} to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes lineReveal { to{width:min(260px,55vw)} }
        @keyframes textReveal { from{opacity:0;transform:translateY(10px);letter-spacing:.05em} to{opacity:1;transform:translateY(0)} }
        @keyframes creditReveal { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(.9);opacity:.65} 50%{transform:scale(1.08);opacity:1} }
        @media (prefers-reduced-motion:reduce) { .site-intro,.site-intro-leaving,.intro-content,.intro-logo-wrap,.intro-line,.intro-title,.intro-subtitle,.intro-credit,.intro-glow{animation:none!important}.intro-line{width:min(260px,55vw)} }
      `}</style>
    </div>
  );
}
