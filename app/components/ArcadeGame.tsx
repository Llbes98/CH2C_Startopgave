"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right";
type GameName = "tetris" | "pacman" | "snake";
type Point = { x: number; y: number };

const keyDirections: Record<string, Direction> = {
  ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
};

const gameMeta = {
  tetris: {
    title: "TETRIS", accent: "cyan", objective: "Fyld en hel vandret linje for at rydde den. Jo flere linjer du rydder, jo hurtigere falder brikkerne.",
    tips: ["← →  Flyt brikken", "↑  Rotér brikken", "↓  Hurtigere ned", "Mellemrum  Slip brikken"],
  },
  pacman: {
    title: "PAC-MAN", accent: "yellow", objective: "Spis alle prikkerne i labyrinten, og hold dig fra spøgelserne. Du har tre liv.",
    tips: ["↑ ↓ ← →  Bevæg dig", "W A S D  Virker også", "Spis alle prikker", "Undgå spøgelserne"],
  },
  snake: {
    title: "SNAKE", accent: "pink", objective: "Spis frugten for at vokse. Rammer du kanten eller dig selv, er spillet slut.",
    tips: ["↑ ↓ ← →  Skift retning", "W A S D  Virker også", "Spis frugten", "Undgå vægge og hale"],
  },
};

function TouchControls({ onMove, action }: { onMove: (d: Direction) => void; action?: () => void }) {
  return (
    <div className="touchControls" aria-label="Touchstyring">
      <button onPointerDown={() => onMove("up")} aria-label="Op">▲</button>
      <button onPointerDown={() => onMove("left")} aria-label="Venstre">◀</button>
      <button onPointerDown={() => onMove("down")} aria-label="Ned">▼</button>
      <button onPointerDown={() => onMove("right")} aria-label="Højre">▶</button>
      {action && <button className="actionButton" onPointerDown={action} aria-label="Handling">A</button>}
    </div>
  );
}

const SHAPES = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]],
];
const TETRIS_COLORS = ["#20e6e6", "#ffe052", "#bf71ff", "#ff9d3f", "#5084ff", "#5ef05e", "#ff3b8d"];
type Piece = { shape: number[][]; x: number; y: number; color: number };

function freshPiece(): Piece {
  const color = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[color], x: 3, y: 0, color };
}

function Tetris({ mobile }: { mobile: boolean }) {
  const empty = () => Array.from({ length: 18 }, () => Array(10).fill(-1));
  const [board, setBoard] = useState<number[][]>(empty);
  const [piece, setPiece] = useState<Piece>(freshPiece);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [over, setOver] = useState(false);
  const state = useRef({ board, piece, over });
  useEffect(() => { state.current = { board, piece, over }; }, [board, piece, over]);

  const valid = useCallback((p: Piece, b = state.current.board) => p.shape.every((row, y) => row.every((cell, x) => !cell || (p.y + y < 18 && p.x + x >= 0 && p.x + x < 10 && (p.y + y < 0 || b[p.y + y][p.x + x] < 0)))), []);

  const lock = useCallback((p: Piece) => {
    const next = state.current.board.map((row) => [...row]);
    p.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && p.y + y >= 0) next[p.y + y][p.x + x] = p.color; }));
    const kept = next.filter((row) => row.some((cell) => cell < 0));
    const cleared = 18 - kept.length;
    while (kept.length < 18) kept.unshift(Array(10).fill(-1));
    if (cleared) { setLines((v) => v + cleared); setScore((v) => v + [0, 100, 300, 500, 800][cleared]); }
    const upcoming = freshPiece();
    setBoard(kept);
    setPiece(upcoming);
    if (!valid(upcoming, kept)) setOver(true);
  }, [valid]);

  const move = useCallback((direction: Direction) => {
    if (state.current.over) return;
    const current = state.current.piece;
    if (direction === "up") {
      const rotated = current.shape[0].map((_, i) => current.shape.map((row) => row[i]).reverse());
      const next = { ...current, shape: rotated };
      if (valid(next)) setPiece(next);
      return;
    }
    const next = { ...current, x: current.x + (direction === "left" ? -1 : direction === "right" ? 1 : 0), y: current.y + (direction === "down" ? 1 : 0) };
    if (valid(next)) setPiece(next); else if (direction === "down") lock(current);
  }, [lock, valid]);

  const drop = useCallback(() => {
    if (state.current.over) return;
    let current = state.current.piece;
    let next = { ...current, y: current.y + 1 };
    while (valid(next)) { current = next; next = { ...current, y: current.y + 1 }; }
    setScore((v) => v + Math.max(0, current.y - state.current.piece.y) * 2);
    lock(current);
  }, [lock, valid]);

  useEffect(() => {
    const id = window.setInterval(() => move("down"), Math.max(180, 650 - lines * 18));
    return () => clearInterval(id);
  }, [lines, move]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (keyDirections[e.key]) { e.preventDefault(); move(keyDirections[e.key]); } if (e.code === "Space") { e.preventDefault(); drop(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [drop, move]);

  const display = board.map((row) => [...row]);
  piece.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && piece.y + y >= 0 && piece.y + y < 18) display[piece.y + y][piece.x + x] = piece.color; }));
  const reset = () => { setBoard(empty()); setPiece(freshPiece()); setScore(0); setLines(0); setOver(false); };

  return <div className="gameAndControls"><div className="gameStats"><span>SCORE <b>{String(score).padStart(5,"0")}</b></span><span>LINJER <b>{String(lines).padStart(2,"0")}</b></span></div><div className="tetrisGame gameBoard">{display.flat().map((cell, i) => <i key={i} style={cell >= 0 ? { background: TETRIS_COLORS[cell], boxShadow: `0 0 8px ${TETRIS_COLORS[cell]}` } : undefined} />)}{over && <GameOverlay title="GAME OVER" score={score} reset={reset} />}</div>{mobile && <TouchControls onMove={move} action={drop} />}</div>;
}

const MAZE = [
  "###############", "#.............#", "#.###.###.###.#", "#.............#", "#.##.#.#.#.##.#",
  "#....#...#....#", "####.#.#.#.####", "#......#......#", "#.###.....###.#", "#...#.....#...#",
  "#.#.#.###.#.#.#", "#.#.........#.#", "#.###.###.###.#", "#.............#", "###############",
];
const startDots = () => new Set(MAZE.flatMap((row, y) => [...row].map((c, x) => c === "." ? `${x},${y}` : "")).filter(Boolean));

function Pacman({ mobile }: { mobile: boolean }) {
  const [player, setPlayer] = useState<Point>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Point[]>([{ x: 13, y: 13 }, { x: 7, y: 8 }]);
  const [dots, setDots] = useState(startDots);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const state = useRef({ player, ghosts, over });
  useEffect(() => { state.current = { player, ghosts, over }; }, [player, ghosts, over]);
  const open = (p: Point) => MAZE[p.y]?.[p.x] !== "#";

  const move = useCallback((d: Direction) => {
    if (state.current.over) return;
    const delta = d === "left" ? [-1, 0] : d === "right" ? [1, 0] : d === "up" ? [0, -1] : [0, 1];
    const next = { x: state.current.player.x + delta[0], y: state.current.player.y + delta[1] };
    if (!open(next)) return;
    setPlayer(next);
    const id = `${next.x},${next.y}`;
    setDots((old) => { if (!old.has(id)) return old; const copy = new Set(old); copy.delete(id); setScore((s) => s + 10); if (!copy.size) setOver(true); return copy; });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setGhosts((old) => old.map((ghost) => {
      const options = ([[1,0],[-1,0],[0,1],[0,-1]] as number[][]).map(([x,y]) => ({ x: ghost.x + x, y: ghost.y + y })).filter(open);
      options.sort((a,b) => (Math.abs(a.x-player.x)+Math.abs(a.y-player.y)) - (Math.abs(b.x-player.x)+Math.abs(b.y-player.y)) + Math.random()*4-2);
      return options[0] || ghost;
    })), 420);
    return () => clearInterval(id);
  }, [player]);
  useEffect(() => {
    if (!ghosts.some((g) => g.x === player.x && g.y === player.y) || over) return;
    const id = window.setTimeout(() => {
      if (lives <= 1) { setLives(0); setOver(true); }
      else { setLives((v) => v - 1); setPlayer({ x: 1, y: 1 }); setGhosts([{ x: 13, y: 13 }, { x: 7, y: 8 }]); }
    }, 0);
    return () => clearTimeout(id);
  }, [ghosts, player, lives, over]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (keyDirections[e.key]) { e.preventDefault(); move(keyDirections[e.key]); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [move]);
  const reset = () => { setPlayer({x:1,y:1}); setGhosts([{x:13,y:13},{x:7,y:8}]); setDots(startDots()); setScore(0); setLives(3); setOver(false); };

  return <div className="gameAndControls"><div className="gameStats"><span>SCORE <b>{String(score).padStart(5,"0")}</b></span><span>LIV <b>{"♥".repeat(lives) || "—"}</b></span></div><div className="pacmanGame gameBoard">{MAZE.flatMap((row, y) => [...row].map((cell, x) => <i key={`${x}-${y}`} className={cell === "#" ? "wall" : "path"}>{dots.has(`${x},${y}`) && <b />}</i>))}<span className="pacPlayer" style={{left:`${(player.x+.15)*100/15}%`,top:`${(player.y+.15)*100/15}%`}} />{ghosts.map((g,i) => <span key={i} className={`gameGhost g${i}`} style={{left:`${(g.x+.15)*100/15}%`,top:`${(g.y+.15)*100/15}%`}}><b /><b /></span>)}{over && <GameOverlay title={dots.size ? "GAME OVER" : "DU VANDT!"} score={score} reset={reset} />}</div>{mobile && <TouchControls onMove={move} />}</div>;
}

function Snake({ mobile }: { mobile: boolean }) {
  const [snake, setSnake] = useState<Point[]>([{x:8,y:8},{x:7,y:8},{x:6,y:8}]);
  const [food, setFood] = useState<Point>({x:14,y:8});
  const [direction, setDirection] = useState<Direction>("right");
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const directionRef = useRef(direction); const snakeRef = useRef(snake);
  useEffect(() => { directionRef.current = direction; snakeRef.current = snake; }, [direction, snake]);
  const move = useCallback((d: Direction) => {
    const opposite = { up:"down", down:"up", left:"right", right:"left" } as Record<Direction, Direction>;
    if (opposite[directionRef.current] !== d) { directionRef.current = d; setDirection(d); }
  }, []);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (keyDirections[e.key]) { e.preventDefault(); move(keyDirections[e.key]); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [move]);
  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      const head = snakeRef.current[0]; const d = directionRef.current;
      const next = {x:head.x+(d==="left"?-1:d==="right"?1:0), y:head.y+(d==="up"?-1:d==="down"?1:0)};
      if (next.x<0||next.x>=20||next.y<0||next.y>=16||snakeRef.current.some(p=>p.x===next.x&&p.y===next.y)) { setOver(true); return; }
      const ate = next.x===food.x&&next.y===food.y;
      const updated = [next,...snakeRef.current]; if (!ate) updated.pop();
      if (ate) { setScore(s=>s+100); let f: Point; do { f={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*16)}; } while(updated.some(p=>p.x===f.x&&p.y===f.y)); setFood(f); }
      setSnake(updated);
    }, Math.max(85, 170-score/40));
    return () => clearInterval(id);
  }, [food, over, score]);
  const cells = useMemo(() => Array.from({length:320},(_,i)=>({x:i%20,y:Math.floor(i/20)})),[]);
  const reset=()=>{setSnake([{x:8,y:8},{x:7,y:8},{x:6,y:8}]);setFood({x:14,y:8});setDirection("right");directionRef.current="right";setScore(0);setOver(false);};
  return <div className="gameAndControls"><div className="gameStats"><span>SCORE <b>{String(score).padStart(5,"0")}</b></span><span>LÆNGDE <b>{String(snake.length).padStart(2,"0")}</b></span></div><div className="snakeGame gameBoard">{cells.map(c=><i key={`${c.x}-${c.y}`} className={snake.some(p=>p.x===c.x&&p.y===c.y)?(c.x===snake[0].x&&c.y===snake[0].y?"snakeHead":"snakeBody"):(food.x===c.x&&food.y===c.y?"food":"")}/>)}{over&&<GameOverlay title="GAME OVER" score={score} reset={reset}/>}</div>{mobile&&<TouchControls onMove={move}/>}</div>;
}

function GameOverlay({ title, score, reset }: { title: string; score: number; reset: () => void }) {
  return <div className="gameOverlay"><h3>{title}</h3><p>SCORE {String(score).padStart(5,"0")}</p><button onClick={reset}>SPIL IGEN</button></div>;
}

export default function ArcadeGame({ game, mobile }: { game: GameName; mobile: boolean }) {
  const meta = gameMeta[game];
  return (
    <main className={`playPage pageFrame ${meta.accent}`}>
      <div className="scanlines" />
      <nav className="topNav"><Link href={`/arcade?device=${mobile ? "mobile" : "computer"}`} className="backLink">← TILBAGE TIL ARKADEN</Link><span className="livePill"><i /> LIVE</span></nav>
      <header className="playHeader"><div><p className="eyebrow">NOW PLAYING</p><h1>{meta.title}</h1></div><div className="pixelBars"><i/><i/><i/><i/></div></header>
      <section className="playLayout">
        <div className="cabinet"><div className="screenLabel"><span>CH2C SYSTEM</span><span>HI-SCORE READY</span></div>{game === "tetris" ? <Tetris mobile={mobile}/> : game === "pacman" ? <Pacman mobile={mobile}/> : <Snake mobile={mobile}/>}</div>
        <aside className="instructions"><p className="asideNumber">{game === "tetris" ? "01" : game === "pacman" ? "02" : "03"}</p><h2>SÅDAN<br/>SPILLER DU</h2><p>{meta.objective}</p><div className="rule"/><h3>STYRING</h3><ul>{meta.tips.map((tip,i)=><li key={tip}><b>{String(i+1).padStart(2,"0")}</b><span>{tip}</span></li>)}</ul>{mobile&&<p className="touchHint">Brug knapperne under spillet.</p>}</aside>
      </section>
    </main>
  );
}
