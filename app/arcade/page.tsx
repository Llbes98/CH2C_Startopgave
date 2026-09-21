"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Game = { slug: string; number: string; name: string; tagline: string; color: string };

const games: Game[] = [
  { slug: "tetris", number: "01", name: "TETRIS", tagline: "STAK · RYD · GENTAG", color: "cyan" },
  { slug: "pacman", number: "02", name: "PAC-MAN", tagline: "SPIS · UNDVIG · VIND", color: "yellow" },
  { slug: "snake", number: "03", name: "SNAKE", tagline: "JAGT · VOKS · OVERLEV", color: "pink" },
];

function GameArt({ slug }: { slug: string }) {
  if (slug === "tetris") return <div className="tetrisArt" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>;
  if (slug === "pacman") return <div className="pacmanArt" aria-hidden="true"><div className="pacHero" /><b>·</b><b>·</b><div className="ghost"><i /><i /></div></div>;
  return <div className="snakeArt" aria-hidden="true"><i /><i /><i /><i /><i /><b /></div>;
}

function ArcadeContent() {
  const searchParams = useSearchParams();
  const device = searchParams.get("device") === "mobile" ? "mobile" : "computer";

  return (
    <main className="arcade pageFrame">
      <div className="scanlines" />
      <nav className="topNav">
        <Link href="/" className="backLink">← SKIFT ENHED</Link>
        <span className="devicePill"><i /> {device === "mobile" ? "MOBIL" : "COMPUTER"}</span>
      </nav>
      <header className="arcadeHeader">
        <p className="eyebrow">VÆLG DIT SPIL</p>
        <h1>CH2C <span>ARKADEN</span></h1>
        <p>Tre klassikere. Ét forsøg. Hvor længe kan du holde dig i live?</p>
      </header>
      <section className="gameRow">
        {games.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}?device=${device}`} className={`gameCard ${game.color}`}>
            <div className="cardTop"><span>{game.number}</span><span>● ONLINE</span></div>
            <div className="artWindow"><GameArt slug={game.slug} /></div>
            <div className="cardInfo">
              <h2>{game.name}</h2>
              <p>{game.tagline}</p>
              <span className="playButton">SPIL NU <b>→</b></span>
            </div>
          </Link>
        ))}
      </section>
      <footer>© 2026 CH2C ARKADEN <span>HIGH SCORES VENTER</span></footer>
    </main>
  );
}

export default function ArcadePage() {
  return <Suspense><ArcadeContent /></Suspense>;
}
