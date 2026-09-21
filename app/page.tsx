"use client";

import { useRouter } from "next/navigation";

function DesktopIcon() {
  return (
    <svg viewBox="0 0 100 80" aria-hidden="true">
      <rect x="9" y="7" width="82" height="55" rx="4" />
      <path d="M38 72h24M50 62v10" />
      <path className="iconGlow" d="M18 17h64v35H18z" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg viewBox="0 0 100 80" aria-hidden="true">
      <rect x="31" y="4" width="38" height="72" rx="7" />
      <path className="iconGlow" d="M37 14h26v48H37z" />
      <circle cx="50" cy="69" r="2" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <main className="landing pageFrame">
      <div className="scanlines" />
      <section className="landingCard">
        <p className="eyebrow">PLAYER SELECT</p>
        <h1>HVORDAN<br />SPILLER DU?</h1>
        <p className="lead">Vælg din enhed, så indstiller vi styringen til dig.</p>
        <div className="deviceChoices">
          <button className="deviceButton cyan" onClick={() => router.push("/arcade?device=computer")}>
            <DesktopIcon />
            <span>COMPUTER</span>
            <small>TASTATUR</small>
          </button>
          <button className="deviceButton pink" onClick={() => router.push("/arcade?device=mobile")}>
            <MobileIcon />
            <span>MOBIL</span>
            <small>TOUCH</small>
          </button>
        </div>
        <div className="insertCoin"><span /> TRYK PÅ EN ENHED <span /></div>
      </section>
    </main>
  );
}
