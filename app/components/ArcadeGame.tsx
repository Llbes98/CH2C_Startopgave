"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right";
type GameName = "tetris" | "pacman" | "snake";
type Point = { x: number; y: number };

const keyDirections: Record<string, Direction> = {
  ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
};

const gameMeta = {
  tetris: {
    title: "TETRIS", accent: "cyan", objective: "Fyld en hel vandret linje for at rydde den. For hver anden ryddede linje afsløres et nyt tegn i din score. Kan du gætte ordet?",
    tips: ["← →  Flyt brikken", "↑  Rotér brikken", "↓  Hurtigere ned", "Mellemrum  Slip brikken"],
  },
  pacman: {
    title: "PAC-MAN", accent: "yellow", objective: "Spis alle prikkerne i labyrinten, og hold dig fra spøgelserne. Du har tre liv.",
    tips: ["↑ ↓ ← →  Bevæg dig", "W A S D  Virker også", "Spis alle prikker", "Undgå spøgelserne"],
  },
  snake: {
    title: "SNAKE", accent: "pink", objective: "Spis frugten for at vokse. Når længden når 10, 20, 30 osv., dukker et lyserødt æble op: Læg dets kolonne- og rækkenummer sammen for at finde et bogstav (A=1). Rammer du kanten eller dig selv, er spillet slut.",
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
const TETRIS_MORSE_CODE = "...././.-.-/.-//";
type Piece = { shape: number[][]; x: number; y: number; color: number };

function freshPiece(): Piece {
  const color = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[color], x: 3, y: 0, color };
}

function Tetris({ mobile }: { mobile: boolean }) {
  const empty = () => Array.from({ length: 18 }, () => Array(10).fill(-1));
  const [board, setBoard] = useState<number[][]>(empty);
  const [piece, setPiece] = useState<Piece>(freshPiece);
  const [nextPiece, setNextPiece] = useState<Piece>(freshPiece);
  const [lines, setLines] = useState(0);
  const [over, setOver] = useState(false);
  const nextPieceRef = useRef(nextPiece);
  const state = useRef({ board, piece, over });
  useEffect(() => { state.current = { board, piece, over }; }, [board, piece, over]);

  const valid = useCallback((p: Piece, b = state.current.board) => p.shape.every((row, y) => row.every((cell, x) => !cell || (p.y + y < 18 && p.x + x >= 0 && p.x + x < 10 && (p.y + y < 0 || b[p.y + y][p.x + x] < 0)))), []);

  const lock = useCallback((p: Piece) => {
    const next = state.current.board.map((row) => [...row]);
    p.shape.forEach((row, y) => row.forEach((cell, x) => { if (cell && p.y + y >= 0) next[p.y + y][p.x + x] = p.color; }));
    const kept = next.filter((row) => row.some((cell) => cell < 0));
    const cleared = 18 - kept.length;
    while (kept.length < 18) kept.unshift(Array(10).fill(-1));
    if (cleared) setLines((v) => v + cleared);
    const upcoming = nextPieceRef.current;
    const following = freshPiece();
    nextPieceRef.current = following;
    setNextPiece(following);
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
  const reset = () => {
    const first = freshPiece();
    const following = freshPiece();
    nextPieceRef.current = following;
    setBoard(empty());
    setPiece(first);
    setNextPiece(following);
    setLines(0);
    setOver(false);
  };
  const revealedCode = TETRIS_MORSE_CODE.slice(0, Math.floor(lines / 2));
  const previewOffsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
  const previewOffsetY = Math.floor((4 - nextPiece.shape.length) / 2);

  return <div className="gameAndControls">
    <div className="gameStats"><span>LINJER <b>{String(lines).padStart(2,"0")}</b></span><span>NYT TEGN HVER 2. LINJE</span></div>
    <div className="morsePanel" aria-live="polite"><span>SCORE</span><strong>{revealedCode || "0"}</strong></div>
    <div className="tetrisPlayfield">
      <div className="tetrisGame gameBoard">{display.flat().map((cell, i) => <i key={i} style={cell >= 0 ? { background: TETRIS_COLORS[cell], boxShadow: `0 0 8px ${TETRIS_COLORS[cell]}` } : undefined} />)}{over && <GameOverlay title="GAME OVER" detail={`SCORE: ${revealedCode || "0"}`} reset={reset} />}</div>
      <div className="nextPiecePanel" aria-label="Næste tetrimino"><span>NÆSTE</span><div className="nextPieceGrid" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => {
        const x = index % 4 - previewOffsetX;
        const y = Math.floor(index / 4) - previewOffsetY;
        return <i key={index} style={nextPiece.shape[y]?.[x] ? { background: TETRIS_COLORS[nextPiece.color], boxShadow: `0 0 8px ${TETRIS_COLORS[nextPiece.color]}` } : undefined} />;
      })}</div></div>
    </div>
    {mobile && <TouchControls onMove={move} action={drop} />}
  </div>;
}

const MAZE = [
  "###############", "#.............#", "#.###.###.###.#", "#.............#", "#.##.#.#.#.##.#",
  "#....#...#....#", "####.#.#.#.####", "#......#......#", "#.###.....###.#", "#...#.....#...#",
  "#.#.#.###.#.#.#", "#.#.........#.#", "#.###.###.###.#", "#.............#", "###############",
];
const startDots = () => new Set(MAZE.flatMap((row, y) => [...row].map((c, x) => c === "." ? `${x},${y}` : "")).filter(Boolean));
const PACMAN_LETTERS = Array.from("spøgelse").reverse();
const randomBlueDot = (dots: Set<string>, exclude?: string) => {
  const choices = Array.from(dots).filter((dot) => dot !== exclude);
  return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
};
const OPEN_CELLS = MAZE.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "." ? [{ x, y }] : []));
const isOpen = (point: Point) => MAZE[point.y]?.[point.x] === ".";
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

function nextStepTowards(start: Point, target: Point): Point {
  if (samePoint(start, target)) return start;
  const queue: Point[] = [start];
  const visited = new Set([`${start.x},${start.y}`]);
  const previous = new Map<string, Point>();

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = `${next.x},${next.y}`;
      if (!isOpen(next) || visited.has(key)) continue;
      visited.add(key);
      previous.set(key, current);
      if (samePoint(next, target)) {
        let step = next;
        while (!samePoint(previous.get(`${step.x},${step.y}`)!, start)) {
          step = previous.get(`${step.x},${step.y}`)!;
        }
        return step;
      }
      queue.push(next);
    }
  }
  return start;
}

function Pacman({ mobile }: { mobile: boolean }) {
  const [player, setPlayer] = useState<Point>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Point[]>([{ x: 13, y: 13 }, { x: 7, y: 8 }]);
  const [dots, setDots] = useState(startDots);
  const [blueDot, setBlueDot] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ letter: string; sequence: number } | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const [facing, setFacing] = useState<Direction>("right");
  const direction = useRef<Direction | null>(null);
  const pinkTarget = useRef<Point | null>(null);
  const dotsRef = useRef(dots);
  const blueDotRef = useRef<string | null>(null);
  const blueDotsEaten = useRef(0);
  const flashTimer = useRef<number | null>(null);
  const state = useRef({ player, ghosts, over });

  useEffect(() => () => { if (flashTimer.current !== null) window.clearTimeout(flashTimer.current); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const firstBlueDot = randomBlueDot(dotsRef.current, "1,1");
      blueDotRef.current = firstBlueDot;
      setBlueDot(firstBlueDot);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const move = useCallback((d: Direction) => {
    if (state.current.over) return;
    direction.current = d;
    setFacing(d);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (state.current.over || !direction.current) return;
      const d = direction.current;
      const delta = d === "left" ? [-1, 0] : d === "right" ? [1, 0] : d === "up" ? [0, -1] : [0, 1];
      const next = { x: state.current.player.x + delta[0], y: state.current.player.y + delta[1] };
      if (!isOpen(next)) return;
      state.current.player = next;
      setPlayer(next);
      const dot = `${next.x},${next.y}`;
      if (dotsRef.current.has(dot)) {
        const remaining = new Set(dotsRef.current);
        remaining.delete(dot);
        dotsRef.current = remaining;
        setDots(remaining);
        setScore((value) => value + 10);
        if (dot === blueDotRef.current) {
          const letter = PACMAN_LETTERS[blueDotsEaten.current % PACMAN_LETTERS.length];
          blueDotsEaten.current += 1;
          setFlash({ letter, sequence: blueDotsEaten.current });
          if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => { setFlash(null); flashTimer.current = null; }, 850);
          const nextBlueDot = randomBlueDot(remaining);
          blueDotRef.current = nextBlueDot;
          setBlueDot(nextBlueDot);
        }
        if (!remaining.size) { state.current.over = true; setOver(true); }
      }
    }, 150);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (state.current.over) return;
      const [pink, blue] = state.current.ghosts;
      if (!pinkTarget.current || samePoint(pink, pinkTarget.current)) {
        const choices = OPEN_CELLS.filter((cell) => !samePoint(cell, pink));
        pinkTarget.current = choices[Math.floor(Math.random() * choices.length)];
      }
      const nextPink = nextStepTowards(pink, pinkTarget.current);
      const nextBlue = nextStepTowards(blue, state.current.player);
      const nextGhosts = [nextPink, nextBlue];
      state.current.ghosts = nextGhosts;
      setGhosts(nextGhosts);
    }, 273);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!ghosts.some((g) => g.x === player.x && g.y === player.y) || over) return;
    const id = window.setTimeout(() => {
      direction.current = null;
      if (lives <= 1) { state.current.over = true; setLives(0); setOver(true); }
      else {
        pinkTarget.current = null;
        const start = { x: 1, y: 1 };
        const starts = [{ x: 13, y: 13 }, { x: 7, y: 8 }];
        state.current.player = start;
        state.current.ghosts = starts;
        setLives((v) => v - 1);
        setPlayer(start);
        setGhosts(starts);
        setFacing("right");
      }
    }, 0);
    return () => clearTimeout(id);
  }, [ghosts, player, lives, over]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (keyDirections[e.key]) { e.preventDefault(); move(keyDirections[e.key]); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [move]);
  const reset = () => {
    const start = { x: 1, y: 1 };
    const starts = [{ x: 13, y: 13 }, { x: 7, y: 8 }];
    direction.current = null;
    pinkTarget.current = null;
    dotsRef.current = startDots();
    blueDotRef.current = randomBlueDot(dotsRef.current, "1,1");
    blueDotsEaten.current = 0;
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = null;
    state.current = { player: start, ghosts: starts, over: false };
    setPlayer(start);
    setGhosts(starts);
    setDots(dotsRef.current);
    setBlueDot(blueDotRef.current);
    setFlash(null);
    setScore(0);
    setLives(3);
    setOver(false);
    setFacing("right");
  };

  return <div className="gameAndControls"><div className="gameStats"><span>SCORE <b>{String(score).padStart(5,"0")}</b></span><span>LIV <b>{"♥".repeat(lives) || "—"}</b></span></div><div className="pacmanGame gameBoard">{MAZE.flatMap((row, y) => [...row].map((cell, x) => { const dot = `${x},${y}`; return <i key={dot} className={cell === "#" ? "wall" : "path"}>{dots.has(dot) && <b className={dot === blueDot ? "blueDot" : undefined} />}</i>; }))}<span className="pacPlayer" data-facing={facing} style={{left:`${(player.x+.15)*100/15}%`,top:`${(player.y+.15)*100/15}%`}} />{ghosts.map((g,i) => <span key={i} className={`gameGhost g${i}`} style={{left:`${(g.x+.15)*100/15}%`,top:`${(g.y+.15)*100/15}%`}}><b /><b /></span>)}{over && <GameOverlay title={dots.size ? "GAME OVER" : "DU VANDT!"} score={score} reset={reset} />}{flash && <div key={flash.sequence} className="pacLetterFlash" role="status" aria-label={`Bogstav ${flash.letter}`}><span>{flash.letter.toUpperCase()}</span></div>}</div>{mobile && <TouchControls onMove={move} />}</div>;
}

const SNAKE_WORD = "oksesteg";
const SNAKE_CELLS = Array.from({ length: 320 }, (_, index) => ({ x: index % 20, y: Math.floor(index / 20) }));
type SnakeFood = Point & { special: boolean };

function nextSnakeFood(snake: Point[], letterIndex: number): SnakeFood | null {
  const freeCells = SNAKE_CELLS.filter((cell) => !snake.some((segment) => samePoint(cell, segment)));
  if (!freeCells.length) return null;
  if (snake.length % 10 === 0) {
    const letter = SNAKE_WORD[letterIndex % SNAKE_WORD.length].toUpperCase();
    const targetSum = letter.charCodeAt(0) - 64;
    const matchingCells = freeCells.filter((cell) => cell.x + cell.y + 2 === targetSum);
    if (!matchingCells.length) return null;
    const cell = matchingCells[Math.floor(Math.random() * matchingCells.length)];
    return { ...cell, special: true };
  }
  const cell = freeCells[Math.floor(Math.random() * freeCells.length)];
  return { ...cell, special: false };
}

function Snake({ mobile }: { mobile: boolean }) {
  const [snake, setSnake] = useState<Point[]>([{x:8,y:8},{x:7,y:8},{x:6,y:8}]);
  const [food, setFood] = useState<SnakeFood | null>({x:14,y:8,special:false});
  const [direction, setDirection] = useState<Direction>("right");
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const directionRef = useRef(direction); const snakeRef = useRef(snake);
  const lettersFound = useRef(0);
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
      const ate = food !== null && next.x===food.x&&next.y===food.y;
      const updated = [next,...snakeRef.current]; if (!ate) updated.pop();
      if (ate && food) {
        if (food.special) lettersFound.current += 1;
        setScore((value) => value + 100);
        const nextFood = nextSnakeFood(updated, lettersFound.current);
        if (nextFood) setFood(nextFood);
        else if (updated.length === SNAKE_CELLS.length) setOver(true);
        else setFood(null);
      } else if (food === null) {
        const waitingFood = nextSnakeFood(updated, lettersFound.current);
        if (waitingFood) setFood(waitingFood);
      }
      setSnake(updated);
    }, Math.max(85, 170-score/40));
    return () => clearInterval(id);
  }, [food, over, score]);
  const reset=()=>{lettersFound.current=0;setSnake([{x:8,y:8},{x:7,y:8},{x:6,y:8}]);setFood({x:14,y:8,special:false});setDirection("right");directionRef.current="right";setScore(0);setOver(false);};
  return <div className="gameAndControls">
    <div className="gameStats"><span>SCORE <b>{String(score).padStart(5,"0")}</b></span><span>LÆNGDE <b>{String(snake.length).padStart(2,"0")}</b></span></div>
    <div className="snakeBoardWrap">
      <div className="snakeColumnLabels" aria-label="Kolonner 1 til 20">{Array.from({length:20},(_,i)=><span key={i}>{i+1}</span>)}</div>
      <div className="snakeRowLabels" aria-label="Rækker 1 til 16">{Array.from({length:16},(_,i)=><span key={i}>{i+1}</span>)}</div>
      <div className="snakeGame gameBoard">{SNAKE_CELLS.map(c=><i key={`${c.x}-${c.y}`} className={snake.some(p=>p.x===c.x&&p.y===c.y)?(c.x===snake[0].x&&c.y===snake[0].y?"snakeHead":"snakeBody"):(food?.x===c.x&&food.y===c.y?(food.special?"food specialFood":"food"):(c.x+c.y)%2===0?"snakeLight":"")}/>)}{over&&<GameOverlay title="GAME OVER" score={score} reset={reset}/>}</div>
    </div>
    {mobile&&<TouchControls onMove={move}/>}
  </div>;
}

function GameOverlay({ title, score, detail, reset }: { title: string; score?: number; detail?: string; reset: () => void }) {
  return <div className="gameOverlay"><h3>{title}</h3><p>{detail ?? `SCORE ${String(score ?? 0).padStart(5,"0")}`}</p><button onClick={reset}>SPIL IGEN</button></div>;
}

export default function ArcadeGame({ game, mobile }: { game: GameName; mobile: boolean }) {
  const meta = gameMeta[game];
  return (
    <main className={`playPage pageFrame ${meta.accent}${mobile ? " mobilePlay" : ""}`}>
      <div className="scanlines" />
      <nav className="topNav"><Link href={`/arcade?device=${mobile ? "mobile" : "computer"}`} className="backLink">← TILBAGE TIL ARKADEN</Link><span className="livePill"><i /> LIVE</span></nav>
      <header className="playHeader"><div><p className="eyebrow">NOW PLAYING</p><h1>{game === "tetris" ? <><span className="pinkLetter">T</span>ETR<span className="pinkLetter">I</span>S</> : meta.title}</h1></div><div className="pixelBars"><i/><i/><i/><i/></div></header>
      <section className="playLayout">
        <div className="cabinet"><div className="screenLabel"><span>CH2C SYSTEM</span><span>HI-SCORE READY</span></div>{game === "tetris" ? <Tetris mobile={mobile}/> : game === "pacman" ? <Pacman mobile={mobile}/> : <Snake mobile={mobile}/>}</div>
        <aside className="instructions"><p className="asideNumber">{game === "tetris" ? "01" : game === "pacman" ? "02" : "03"}</p><h2>SÅDAN<br/>SPILLER DU</h2><p>{meta.objective}</p><div className="rule"/><h3>STYRING</h3><ul>{meta.tips.map((tip,i)=><li key={tip}><b>{String(i+1).padStart(2,"0")}</b><span>{tip}</span></li>)}</ul>{mobile&&<p className="touchHint">Brug knapperne under spillet.</p>}</aside>
      </section>
    </main>
  );
}
