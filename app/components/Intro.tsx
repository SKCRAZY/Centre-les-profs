'use client';

import { useEffect, useState } from "react";

const particles = Array.from({ length: 24 }, (_, i) => i);

export default function Intro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 2900);
    const hideTimer = window.setTimeout(() => setVisible(false), 3500);
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`site-intro ${leaving ? "site-intro-leaving" : ""}`} aria-hidden="true">
      <div className="intro-noise" /><div className="intro-glow" />
      <div className="intro-orbit intro-orbit-one" /><div className="intro-orbit intro-orbit-two" />
      <div className="intro-particles">{particles.map((p) => <i key={p} style={{ "--i": p } as React.CSSProperties} />)}</div>
      <div className="intro-content">
        <div className="intro-logo-wrap"><div className="intro-logo-ring" /><img className="intro-logo" src="/logo.png" alt="" /></div>
        <div className="intro-line" /><div className="intro-title">CENTRE LES PROFS</div>
        <div className="intro-subtitle">CENTRE DE SOUTIEN SCOLAIRE</div><div className="intro-credit">Developed by Ali Tiji</div>
      </div>
      <style jsx>{`
        .site-intro{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,#4b1118 0%,#18070a 34%,#050506 78%);animation:introIn .45s ease-out both}
        .site-intro-leaving{animation:introOut .6s cubic-bezier(.7,0,.2,1) both;pointer-events:none}
        .intro-noise{position:absolute;inset:0;opacity:.055;background-image:radial-gradient(#fff 1px,transparent 1px);background-size:5px 5px;mix-blend-mode:screen}
        .intro-glow{position:absolute;width:min(75vw,720px);height:min(75vw,720px);border-radius:50%;background:radial-gradient(circle,#f5bf2848 0%,#d9081220 35%,transparent 70%);filter:blur(12px);animation:pulse 2.8s ease-in-out infinite}
        .intro-orbit{position:absolute;border:1px solid #f5bf2828;border-radius:50%;width:min(75vw,650px);height:min(75vw,650px);transform:rotate(-18deg);animation:orbit 5s linear infinite}
        .intro-orbit-one{border-left-color:#f5bf28aa;border-right-color:#d9081266}.intro-orbit-two{width:min(52vw,450px);height:min(52vw,450px);transform:rotate(38deg);animation:orbitReverse 7s linear infinite;border-top-color:#f5bf2888}
        .intro-particles{position:absolute;inset:0;pointer-events:none}.intro-particles i{position:absolute;left:calc(50% + ((var(--i) * 47px) - 540px));top:calc(50% + ((var(--i) * 31px) - 350px));width:3px;height:3px;border-radius:50%;background:#f5bf28;box-shadow:0 0 10px #f5bf28;opacity:0;animation:particle 2.2s calc(var(--i) * .045s) ease-out infinite}
        .intro-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;animation:contentIn 1.15s cubic-bezier(.16,1,.3,1) both}
        .intro-logo-wrap{position:relative;width:clamp(130px,24vw,210px);height:clamp(130px,24vw,210px);padding:7px;border-radius:50%;background:linear-gradient(135deg,#ffe18a,#f5bf28 45%,#a96b00);box-shadow:0 0 0 1px #ffe18a88,0 0 45px #f5bf2866,0 25px 70px #000b;animation:logoReveal 1.15s cubic-bezier(.16,1,.3,1) both}
        .intro-logo-ring{position:absolute;inset:-12px;border:1px solid #f5bf2866;border-radius:50%;box-shadow:0 0 25px #f5bf2833;animation:ringPulse 1.8s ease-in-out infinite}
        .intro-logo{position:relative;width:100%;height:100%;display:block;object-fit:cover;border-radius:50%;background:#0b0b0d}
        .intro-line{width:0;height:2px;margin-top:27px;background:linear-gradient(90deg,transparent,#f5bf28,transparent);animation:lineReveal .8s .55s ease-out forwards;box-shadow:0 0 12px #f5bf28}
        .intro-title{margin-top:18px;color:#fff;font-size:clamp(18px,3vw,29px);font-weight:900;letter-spacing:.18em;text-shadow:0 3px 18px #000;animation:textReveal .8s .65s ease-out both}
        .intro-subtitle{margin-top:9px;color:#f5bf28;font-size:clamp(8px,1.4vw,12px);font-weight:800;letter-spacing:.28em;animation:textReveal .8s .8s ease-out both}
        .intro-credit{margin-top:18px;color:#ffffff9c;font-size:10px;font-weight:500;letter-spacing:.08em;animation:creditReveal .9s 1s ease-out both}
        @keyframes introIn{from{opacity:0}to{opacity:1}}@keyframes introOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.04)}}
        @keyframes contentIn{from{opacity:0;transform:translateY(25px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes logoReveal{from{opacity:0;transform:scale(.35) rotate(-18deg);filter:brightness(1.8)}65%{transform:scale(1.06) rotate(2deg);filter:brightness(1.15)}to{opacity:1;transform:scale(1) rotate(0);filter:brightness(1)}}
        @keyframes lineReveal{to{width:min(260px,55vw)}}@keyframes textReveal{from{opacity:0;transform:translateY(10px);letter-spacing:.05em}to{opacity:1;transform:translateY(0)}}
        @keyframes creditReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(.9);opacity:.65}50%{transform:scale(1.08);opacity:1}}
        @keyframes ringPulse{0%,100%{transform:scale(.96);opacity:.45}50%{transform:scale(1.05);opacity:1}}@keyframes orbit{to{transform:rotate(342deg)}}@keyframes orbitReverse{to{transform:rotate(-322deg)}}
        @keyframes particle{0%{opacity:0;transform:scale(.3) translate(0,0)}25%{opacity:.9}100%{opacity:0;transform:scale(1.5) translate(calc((var(--i) - 12) * 7px),calc((12 - var(--i)) * 8px))}}
        @media(max-width:600px){.intro-orbit{width:88vw;height:88vw}.intro-orbit-two{width:62vw;height:62vw}.intro-title{letter-spacing:.12em}.intro-subtitle{letter-spacing:.18em}.intro-credit{font-size:9px}}
        @media(prefers-reduced-motion:reduce){.site-intro,.site-intro-leaving,.intro-content,.intro-logo-wrap,.intro-line,.intro-title,.intro-subtitle,.intro-credit,.intro-glow,.intro-orbit,.intro-logo-ring,.intro-particles i{animation:none!important}.intro-line{width:min(260px,55vw)}}
      `}</style>
    </div>
  );
}
