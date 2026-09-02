'use client';

import { useEffect, useState } from "react";

const particles = Array.from({ length: 24 }, (_, i) => i);

export default function Intro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 2900);
    const hideTimer = window.setTimeout(() => setVisible(false), 3500);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`site-intro ${leaving ? "site-intro-leaving" : ""}`} aria-hidden="true">
      <div className="intro-noise" />
      <div className="intro-glow" />
      <div className="intro-orbit intro-orbit-one" />
      <div className="intro-orbit intro-orbit-two" />
      <div className="intro-particles">
        {particles.map((p) => <i key={p} style={{ "--i": p } as React.CSSProperties} />)}
      </div>

      <div className="intro-content">
        <div className="intro-logo-wrap">
          <div className="intro-logo-ring" />
          <img className="intro-logo" src="/logo.png" alt="" />
        </div>
        <div className="intro-line" />
        <div className="intro-title">CENTRE LES PROFS</div>
        <div className="intro-subtitle">CENTRE DE SOUTIEN SCOLAIRE</div>
        <div className="intro-credit">Developed by Ali Tiji</div>
      </div>
    </div>
  );
}
