import { useState, useEffect, useRef, useCallback } from "react";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const BLOCK_WIDTH = 45;
const BLOCK_HEIGHT = 30;
const GROUND_Y = GAME_HEIGHT - 60;
const PLAYER_Y = GROUND_Y - PLAYER_SIZE;
const LANES = [60, 140, 220, 300, 360];

const COLORS = [
  { bg: "#FF6B6B", shadow: "#C0392B", glow: "#ff4444" },
  { bg: "#FFD93D", shadow: "#F39C12", glow: "#ffcc00" },
  { bg: "#6BCB77", shadow: "#27AE60", glow: "#44ff66" },
  { bg: "#4D96FF", shadow: "#2980B9", glow: "#4488ff" },
  { bg: "#FF6FC8", shadow: "#8E44AD", glow: "#ff44cc" },
  { bg: "#FF9F43", shadow: "#E67E22", glow: "#ff8800" },
];

const PLAYER_COLOR = { bg: "#A29BFE", shadow: "#6C5CE7", glow: "#7c6fff" };

let blockIdCounter = 0;

function Block({ x, y, color }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - BLOCK_WIDTH / 2,
        top: y,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        background: `linear-gradient(145deg, ${color.bg}, ${color.shadow})`,
        borderRadius: 6,
        boxShadow: `0 4px 0 ${color.shadow}, 0 0 12px ${color.glow}88`,
        border: `2px solid ${color.bg}`,
      }}
    >
      {/* Top face shine */}
      <div style={{
        position: "absolute", top: 3, left: 4, right: 4, height: 6,
        background: "rgba(255,255,255,0.35)", borderRadius: 3,
      }} />
    </div>
  );
}

function Player({ x, isHit, isDashing }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - PLAYER_SIZE / 2,
        top: PLAYER_Y,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        background: isHit
          ? "#FF6B6B"
          : `linear-gradient(145deg, ${PLAYER_COLOR.bg}, ${PLAYER_COLOR.shadow})`,
        borderRadius: 8,
        boxShadow: isHit
          ? "0 0 20px #ff4444, 0 6px 0 #c0392b"
          : `0 6px 0 ${PLAYER_COLOR.shadow}, 0 0 20px ${PLAYER_COLOR.glow}`,
        border: `2px solid ${isHit ? "#ff8888" : PLAYER_COLOR.bg}`,
        transition: "left 0.08s ease-out, background 0.1s",
        transform: isDashing ? "scaleX(1.15) scaleY(0.9)" : "scale(1)",
      }}
    >
      {/* Eyes */}
      <div style={{ position: "absolute", top: 10, left: 6, width: 10, height: 10, background: "#fff", borderRadius: "50%", boxShadow: "inset -2px -2px 3px rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", top: 10, right: 6, width: 10, height: 10, background: "#fff", borderRadius: "50%", boxShadow: "inset -2px -2px 3px rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", top: 13, left: 9, width: 5, height: 5, background: "#333", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 13, right: 9, width: 5, height: 5, background: "#333", borderRadius: "50%" }} />
      {/* Shine */}
      <div style={{ position: "absolute", top: 4, left: 5, right: 5, height: 8, background: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
    </div>
  );
}

function ParticleEffect({ particles }) {
  return particles.map(p => (
    <div key={p.id} style={{
      position: "absolute",
      left: p.x,
      top: p.y,
      width: p.size,
      height: p.size,
      background: p.color,
      borderRadius: p.size / 2,
      opacity: p.opacity,
      pointerEvents: "none",
    }} />
  ));
}

export default function App() {
  const [gameState, setGameState] = useState("menu"); // menu | playing | dead
  const [playerX, setPlayerX] = useState(200);
  const [blocks, setBlocks] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHit, setIsHit] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [particles, setParticles] = useState([]);
  const [bgOffset, setBgOffset] = useState(0);

  const playerXRef = useRef(200);
  const blocksRef = useRef([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const gameStateRef = useRef("menu");
  const keysRef = useRef({});
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  const spawnTimerRef = useRef(0);
  const particleIdRef = useRef(0);

  const spawnBlock = useCallback(() => {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    blockIdCounter++;
    return { id: blockIdCounter, x: lane, y: -BLOCK_HEIGHT, color, speed: 0 };
  }, []);

  const addParticles = useCallback((x, y, color) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => {
      particleIdRef.current++;
      return {
        id: particleIdRef.current,
        x: x + Math.random() * 30 - 15,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        size: Math.random() * 8 + 4,
        color: color.bg,
        opacity: 1,
        life: 1,
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  }, []);

  const gameLoop = useCallback((timestamp) => {
    if (gameStateRef.current !== "playing") return;
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3);
    lastTimeRef.current = timestamp;

    const currentLevel = levelRef.current;
    const baseSpeed = 2.5 + (currentLevel - 1) * 0.6;
    const spawnInterval = Math.max(40, 90 - currentLevel * 7);

    // Move player with keyboard
    const moveSpeed = 5.5;
    let newX = playerXRef.current;
    if (keysRef.current["ArrowLeft"] || keysRef.current["a"]) newX -= moveSpeed * dt;
    if (keysRef.current["ArrowRight"] || keysRef.current["d"]) newX += moveSpeed * dt;
    newX = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, newX));
    playerXRef.current = newX;
    setPlayerX(newX);

    // Spawn blocks
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0;
      blocksRef.current = [...blocksRef.current, spawnBlock()];
    }

    // Move blocks
    let hit = false;
    const newBlocks = [];
    for (const block of blocksRef.current) {
      const newY = block.y + baseSpeed * dt;
      if (newY > GAME_HEIGHT + 20) continue;

      // Collision detection
      const px = playerXRef.current;
      const py = PLAYER_Y;
      const margin = 6;
      if (
        newY + BLOCK_HEIGHT > py + margin &&
        newY < py + PLAYER_SIZE - margin &&
        Math.abs(block.x - px) < (PLAYER_SIZE + BLOCK_WIDTH) / 2 - margin
      ) {
        hit = true;
        addParticles(block.x, newY, block.color);
        continue;
      }

      newBlocks.push({ ...block, y: newY });
    }
    blocksRef.current = newBlocks;
    setBlocks([...newBlocks]);

    if (hit) {
      gameStateRef.current = "dead";
      setGameState("dead");
      setIsHit(true);
      setHighScore(prev => Math.max(prev, scoreRef.current));
      return;
    }

    // Score
    scoreRef.current += dt * 0.5;
    const newScore = Math.floor(scoreRef.current);
    setScore(newScore);

    // Level up
    const newLevel = Math.floor(newScore / 100) + 1;
    if (newLevel !== levelRef.current) {
      levelRef.current = newLevel;
      setLevel(newLevel);
    }

    // Background parallax
    setBgOffset(prev => (prev + baseSpeed * 0.3 * dt) % 60);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [spawnBlock, addParticles]);

  const startGame = useCallback(() => {
    playerXRef.current = 200;
    blocksRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    spawnTimerRef.current = 0;
    lastTimeRef.current = null;
    gameStateRef.current = "playing";

    setPlayerX(200);
    setBlocks([]);
    setScore(0);
    setLevel(1);
    setIsHit(false);
    setIsDashing(false);
    setParticles([]);
    setGameState("playing");
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKey = (e) => {
      keysRef.current[e.key] = e.type === "keydown";
      if (e.type === "keydown" && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "d")) {
        setIsDashing(true);
        setTimeout(() => setIsDashing(false), 150);
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  // Touch / mouse drag
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - touchStartX.current;
    touchStartX.current = clientX;
    let newX = playerXRef.current + delta * 1.2;
    newX = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, newX));
    playerXRef.current = newX;
    setPlayerX(newX);
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  // Grid background lines
  const gridLines = [];
  for (let i = 0; i < 8; i++) {
    gridLines.push(
      <div key={`v${i}`} style={{
        position: "absolute", left: i * 55, top: 0, bottom: 0, width: 1,
        background: "rgba(255,255,255,0.04)",
      }} />
    );
  }
  for (let i = 0; i < 12; i++) {
    gridLines.push(
      <div key={`h${i}`} style={{
        position: "absolute", top: (i * 60 + bgOffset) % GAME_HEIGHT, left: 0, right: 0, height: 1,
        background: "rgba(255,255,255,0.04)",
      }} />
    );
  }

  const levelColor = ["#6BCB77", "#FFD93D", "#FF9F43", "#FF6B6B", "#FF6FC8", "#4D96FF"][Math.min(level - 1, 5)];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #0a0a1a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      userSelect: "none",
      padding: "20px 0",
    }}>
      {/* Title */}
      <div style={{
        fontSize: 28,
        fontWeight: 900,
        color: "#fff",
        letterSpacing: 3,
        marginBottom: 12,
        textShadow: "0 0 20px #A29BFE",
        textTransform: "uppercase",
      }}>
        🟪 BLOCK DASH
      </div>

      {/* Game container */}
      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background: "linear-gradient(180deg, #0d0d2b 0%, #111133 60%, #1a1a3e 100%)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(162,155,254,0.3), 0 20px 60px rgba(0,0,0,0.6)",
          border: "2px solid rgba(162,155,254,0.2)",
          cursor: "none",
        }}
        onMouseMove={gameState === "playing" ? (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          let nx = e.clientX - rect.left;
          nx = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, nx));
          playerXRef.current = nx;
          setPlayerX(nx);
        } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMoveCapture={gameState === "playing" ? handleTouchMove : undefined}
        onMouseUp={handleTouchEnd}
      >
        {/* Grid background */}
        {gridLines}

        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 47 + 13) % 100}%`,
            top: `${(i * 37 + 7) % 80}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            background: "#fff",
            borderRadius: "50%",
            opacity: 0.3 + (i % 4) * 0.15,
          }} />
        ))}

        {/* Score HUD */}
        {gameState === "playing" && (
          <div style={{ position: "absolute", top: 16, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 20px", zIndex: 10 }}>
            <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ color: "#aaa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Score</span>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{score}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(6px)", border: `1px solid ${levelColor}44`, textAlign: "center" }}>
              <span style={{ color: "#aaa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Niveau</span>
              <div style={{ color: levelColor, fontSize: 22, fontWeight: 900, lineHeight: 1, textShadow: `0 0 10px ${levelColor}` }}>{level}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ color: "#aaa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Record</span>
              <div style={{ color: "#FFD93D", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{highScore}</div>
            </div>
          </div>
        )}

        {/* Speed indicator bar */}
        {gameState === "playing" && (
          <div style={{ position: "absolute", top: 80, left: 20, right: 20, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, zIndex: 10 }}>
            <div style={{
              width: `${Math.min(((level - 1) / 5) * 100, 100)}%`,
              height: "100%",
              background: `linear-gradient(90deg, #6BCB77, ${levelColor})`,
              borderRadius: 2,
              boxShadow: `0 0 6px ${levelColor}`,
              transition: "width 0.5s ease, background 0.5s ease",
            }} />
          </div>
        )}

        {/* Blocks */}
        {blocks.map(b => <Block key={b.id} x={b.x} y={b.y} color={b.color} />)}

        {/* Particles */}
        <ParticleEffect particles={particles} />

        {/* Ground */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(180deg, #1a1a4e, #0d0d2b)",
          borderTop: "2px solid rgba(162,155,254,0.3)",
          boxShadow: "0 -4px 20px rgba(162,155,254,0.2)",
        }}>
          {/* Ground tiles */}
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              bottom: 10,
              left: i * 46 + 4,
              width: 40,
              height: 30,
              background: "rgba(162,155,254,0.08)",
              borderRadius: 4,
              border: "1px solid rgba(162,155,254,0.12)",
            }} />
          ))}
        </div>

        {/* Player */}
        {gameState !== "menu" && (
          <Player x={playerX} isHit={isHit} isDashing={isDashing} />
        )}

        {/* MENU */}
        {gameState === "menu" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            gap: 20,
          }}>
            {/* Animated demo cube */}
            <div style={{
              width: 60, height: 60,
              background: `linear-gradient(145deg, ${PLAYER_COLOR.bg}, ${PLAYER_COLOR.shadow})`,
              borderRadius: 12,
              boxShadow: `0 8px 0 ${PLAYER_COLOR.shadow}, 0 0 30px ${PLAYER_COLOR.glow}`,
              border: `3px solid ${PLAYER_COLOR.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
              animation: "float 2s ease-in-out infinite",
            }}>
              <span style={{ fontSize: 28 }}>😊</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: 36, fontWeight: 900, textShadow: "0 0 20px #A29BFE", marginBottom: 8 }}>
                BLOCK DASH
              </div>
            </div>
            <div style={{ color: "#888", fontSize: 12, textAlign: "center", lineHeight: 1.8 }}>
              🖱️ Souris / Doigt → déplacer le cube<br/>
              ⌨️ Flèches ou A/D → clavier
            </div>
            <button
              onClick={startGame}
              style={{
                background: "linear-gradient(135deg, #A29BFE, #6C5CE7)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "16px 48px",
                fontSize: 20,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 6px 0 #4a3aaa, 0 0 20px rgba(162,155,254,0.5)",
                letterSpacing: 2,
                textTransform: "uppercase",
                transform: "translateY(0)",
                transition: "all 0.1s",
              }}
              onMouseDown={e => e.currentTarget.style.transform = "translateY(4px)"}
              onMouseUp={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              ▶ JOUER
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === "dead" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            gap: 16,
          }}>
            <div style={{ fontSize: 50 }}>💥</div>
            <div style={{ color: "#FF6B6B", fontSize: 32, fontWeight: 900, textShadow: "0 0 20px #ff4444", letterSpacing: 2 }}>
              PERDU !
            </div>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "16px 32px",
              textAlign: "center",
              backdropFilter: "blur(4px)",
            }}>
              <div style={{ color: "#aaa", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Score final</div>
              <div style={{ color: "#fff", fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{score}</div>
              {score >= highScore && score > 0 && (
                <div style={{ color: "#FFD93D", fontSize: 13, marginTop: 6, fontWeight: 700 }}>⭐ NOUVEAU RECORD !</div>
              )}
              <div style={{ color: "#FFD93D", fontSize: 14, marginTop: 8 }}>🏆 Record : {highScore}</div>
              <div style={{ color: levelColor, fontSize: 13, marginTop: 4 }}>Niveau atteint : {level}</div>
            </div>
            <button
              onClick={startGame}
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #C0392B)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "14px 42px",
                fontSize: 18,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 6px 0 #922b21, 0 0 20px rgba(255,107,107,0.4)",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              🔄 REJOUER
            </button>
            <button
              onClick={() => { setGameState("menu"); gameStateRef.current = "menu"; setIsHit(false); }}
              style={{
                background: "transparent",
                color: "#aaa",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 10,
                padding: "10px 30px",
                fontSize: 14,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              ← Menu
            </button>
          </div>
        )}

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>

      <div style={{ color: "#444", fontSize: 12, marginTop: 12, letterSpacing: 1 }}>
        Chaque 100 pts = niveau +1 · Les blocs accélèrent !
      </div>
    </div>
  );
}
