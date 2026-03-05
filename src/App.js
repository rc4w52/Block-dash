import { useState, useEffect, useRef, useCallback } from "react";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const BLOCK_WIDTH = 45;
const BLOCK_HEIGHT = 30;
const GROUND_Y = GAME_HEIGHT - 60;
const PLAYER_Y = GROUND_Y - PLAYER_SIZE;
const LANES = [60, 140, 220, 300, 360];

const WORLDS = [
  {
    name: "ESPACE",
    emoji: "🌌",
    bg: "linear-gradient(180deg, #0d0d2b 0%, #111133 60%, #1a1a3e 100%)",
    ground: "linear-gradient(180deg, #1a1a4e, #0d0d2b)",
    groundBorder: "rgba(162,155,254,0.3)",
    groundGlow: "rgba(162,155,254,0.2)",
    gridColor: "rgba(255,255,255,0.04)",
    playerColor: { bg: "#A29BFE", shadow: "#6C5CE7", glow: "#7c6fff" },
    blockColors: [
      { bg: "#FF6B6B", shadow: "#C0392B", glow: "#ff4444" },
      { bg: "#FFD93D", shadow: "#F39C12", glow: "#ffcc00" },
      { bg: "#4D96FF", shadow: "#2980B9", glow: "#4488ff" },
      { bg: "#FF6FC8", shadow: "#8E44AD", glow: "#ff44cc" },
    ],
    stars: true,
  },
  {
    name: "ENFER",
    emoji: "🔥",
    bg: "linear-gradient(180deg, #1a0000 0%, #2d0000 60%, #1a0000 100%)",
    ground: "linear-gradient(180deg, #4a0000, #1a0000)",
    groundBorder: "rgba(255,100,0,0.5)",
    groundGlow: "rgba(255,50,0,0.3)",
    gridColor: "rgba(255,80,0,0.06)",
    playerColor: { bg: "#FF6B35", shadow: "#C0392B", glow: "#ff4400" },
    blockColors: [
      { bg: "#FF4500", shadow: "#8B0000", glow: "#ff2200" },
      { bg: "#FF6B35", shadow: "#C0392B", glow: "#ff4400" },
      { bg: "#FFD700", shadow: "#B8860B", glow: "#ffaa00" },
      { bg: "#FF1493", shadow: "#8B0000", glow: "#ff0066" },
    ],
    stars: false,
  },
  {
    name: "OCÉAN",
    emoji: "🌊",
    bg: "linear-gradient(180deg, #001a33 0%, #002244 60%, #001a33 100%)",
    ground: "linear-gradient(180deg, #003366, #001a33)",
    groundBorder: "rgba(0,200,255,0.4)",
    groundGlow: "rgba(0,150,255,0.2)",
    gridColor: "rgba(0,200,255,0.05)",
    playerColor: { bg: "#00CED1", shadow: "#006994", glow: "#00ffff" },
    blockColors: [
      { bg: "#00CED1", shadow: "#006994", glow: "#00ffff" },
      { bg: "#1E90FF", shadow: "#00008B", glow: "#4488ff" },
      { bg: "#00FA9A", shadow: "#006400", glow: "#00ff88" },
      { bg: "#7B68EE", shadow: "#4B0082", glow: "#8866ff" },
    ],
    stars: false,
  },
  {
    name: "FORÊT",
    emoji: "🌿",
    bg: "linear-gradient(180deg, #0a1a00 0%, #0d2200 60%, #0a1a00 100%)",
    ground: "linear-gradient(180deg, #1a3300, #0a1a00)",
    groundBorder: "rgba(100,200,50,0.4)",
    groundGlow: "rgba(80,180,30,0.2)",
    gridColor: "rgba(100,200,50,0.05)",
    playerColor: { bg: "#6BCB77", shadow: "#27AE60", glow: "#44ff66" },
    blockColors: [
      { bg: "#6BCB77", shadow: "#27AE60", glow: "#44ff66" },
      { bg: "#8BC34A", shadow: "#33691E", glow: "#88cc00" },
      { bg: "#FF9800", shadow: "#E65100", glow: "#ff8800" },
      { bg: "#CDDC39", shadow: "#827717", glow: "#ccdd00" },
    ],
    stars: false,
  },
];

const COMBO_MESSAGES = ["NICE!", "SUPER!", "COMBO!", "INCROYABLE!", "LÉGENDAIRE!"];

let blockIdCounter = 0;
let comboIdCounter = 0;

function Block({ x, y, color }) {
  return (
    <div style={{
      position: "absolute",
      left: x - BLOCK_WIDTH / 2,
      top: y,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      background: `linear-gradient(145deg, ${color.bg}, ${color.shadow})`,
      borderRadius: 6,
      boxShadow: `0 4px 0 ${color.shadow}, 0 0 12px ${color.glow}88`,
      border: `2px solid ${color.bg}`,
    }}>
      <div style={{ position: "absolute", top: 3, left: 4, right: 4, height: 6, background: "rgba(255,255,255,0.35)", borderRadius: 3 }} />
    </div>
  );
}

function Player({ x, isHit, isDashing, playerColor }) {
  return (
    <div style={{
      position: "absolute",
      left: x - PLAYER_SIZE / 2,
      top: PLAYER_Y,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      background: isHit ? "#FF6B6B" : `linear-gradient(145deg, ${playerColor.bg}, ${playerColor.shadow})`,
      borderRadius: 8,
      boxShadow: isHit ? "0 0 20px #ff4444, 0 6px 0 #c0392b" : `0 6px 0 ${playerColor.shadow}, 0 0 20px ${playerColor.glow}`,
      border: `2px solid ${isHit ? "#ff8888" : playerColor.bg}`,
      transition: "left 0.08s ease-out, background 0.1s",
      transform: isDashing ? "scaleX(1.15) scaleY(0.9)" : "scale(1)",
    }}>
      <div style={{ position: "absolute", top: 10, left: 6, width: 10, height: 10, background: "#fff", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 10, right: 6, width: 10, height: 10, background: "#fff", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 13, left: 9, width: 5, height: 5, background: "#333", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 13, right: 9, width: 5, height: 5, background: "#333", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 4, left: 5, right: 5, height: 8, background: "rgba(255,255,255,0.3)", borderRadius: 4 }} />
    </div>
  );
}

function ParticleEffect({ particles }) {
  return particles.map(p => (
    <div key={p.id} style={{
      position: "absolute", left: p.x, top: p.y,
      width: p.size, height: p.size,
      background: p.color, borderRadius: p.size / 2,
      opacity: p.opacity, pointerEvents: "none",
    }} />
  ));
}

function ComboPopup({ combos }) {
  return combos.map(c => (
    <div key={c.id} style={{
      position: "absolute", left: c.x - 60, top: c.y,
      color: "#FFD93D", fontWeight: 900, fontSize: c.size,
      textShadow: "0 0 10px #ff8800, 0 2px 4px rgba(0,0,0,0.8)",
      pointerEvents: "none", whiteSpace: "nowrap",
      animation: "comboFly 1s ease-out forwards",
      zIndex: 20,
    }}>
      {c.text}
    </div>
  ));
}

export default function App() {
  const [gameState, setGameState] = useState("menu");
  const [playerX, setPlayerX] = useState(200);
  const [blocks, setBlocks] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [worldIndex, setWorldIndex] = useState(0);
  const [isHit, setIsHit] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [particles, setParticles] = useState([]);
  const [combos, setCombos] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);

  const playerXRef = useRef(200);
  const blocksRef = useRef([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const worldIndexRef = useRef(0);
  const gameStateRef = useRef("menu");
  const keysRef = useRef({});
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  const spawnTimerRef = useRef(0);
  const particleIdRef = useRef(0);
  const comboCountRef = useRef(0);
  const blocksDodgedRef = useRef(0);

  const world = WORLDS[worldIndex];

  const spawnBlock = useCallback(() => {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const w = WORLDS[worldIndexRef.current];
    const color = w.blockColors[Math.floor(Math.random() * w.blockColors.length)];
    blockIdCounter++;
    return { id: blockIdCounter, x: lane, y: -BLOCK_HEIGHT, color, passed: false };
  }, []);

  const addParticles = useCallback((x, y, color) => {
    const newParticles = Array.from({ length: 8 }, () => {
      particleIdRef.current++;
      return {
        id: particleIdRef.current,
        x: x + Math.random() * 30 - 15,
        y: y + Math.random() * 20,
        size: Math.random() * 8 + 4,
        color: color.bg,
        opacity: 1,
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  }, []);

  const addCombo = useCallback((x, y, count) => {
    comboIdCounter++;
    const msg = COMBO_MESSAGES[Math.min(count - 1, COMBO_MESSAGES.length - 1)];
    const size = Math.min(13 + count * 2, 22);
    const newCombo = { id: comboIdCounter, x, y, text: `${count}x ${msg}`, size };
    setCombos(prev => [...prev, newCombo]);
    setTimeout(() => {
      setCombos(prev => prev.filter(c => c.id !== newCombo.id));
    }, 1000);
  }, []);

  const gameLoop = useCallback((timestamp) => {
    if (gameStateRef.current !== "playing") return;
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3);
    lastTimeRef.current = timestamp;

    const currentLevel = levelRef.current;
    const baseSpeed = 2.5 + (currentLevel - 1) * 0.6;
    const spawnInterval = Math.max(40, 90 - currentLevel * 7);

    // Move player
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

    // Move blocks & check collisions
    let hit = false;
    const newBlocks = [];
    for (const block of blocksRef.current) {
      const newY = block.y + baseSpeed * dt;

      if (newY > GAME_HEIGHT + 20) continue;

      // Block just passed player = dodged!
      if (!block.passed && newY > PLAYER_Y + PLAYER_SIZE) {
        blocksDodgedRef.current++;
        // Combo every 3 dodges
        if (blocksDodgedRef.current % 3 === 0) {
          comboCountRef.current++;
          setComboCount(comboCountRef.current);
          addCombo(playerXRef.current, PLAYER_Y - 30, comboCountRef.current);
        }
        newBlocks.push({ ...block, y: newY, passed: true });
        continue;
      }

      // Collision
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

    if (hit) {
      comboCountRef.current = 0;
      blocksDodgedRef.current = 0;
      setComboCount(0);
      blocksRef.current = newBlocks;
      setBlocks([...newBlocks]);
      gameStateRef.current = "dead";
      setGameState("dead");
      setIsHit(true);
      setHighScore(prev => Math.max(prev, Math.floor(scoreRef.current)));
      return;
    }

    blocksRef.current = newBlocks;
    setBlocks([...newBlocks]);

    // Score arrondi + combo bonus
    const comboMultiplier = 1 + comboCountRef.current * 0.1;
    scoreRef.current += dt * 0.5 * comboMultiplier;
    setScore(Math.floor(scoreRef.current));

    // Level up
    const newLevel = Math.floor(scoreRef.current / 100) + 1;
    if (newLevel !== levelRef.current) {
      levelRef.current = newLevel;
      setLevel(newLevel);
    }

    // World change every 3 levels
    const newWorldIndex = Math.min(Math.floor((newLevel - 1) / 3), WORLDS.length - 1);
    if (newWorldIndex !== worldIndexRef.current) {
      worldIndexRef.current = newWorldIndex;
      setWorldIndex(newWorldIndex);
    }

    setBgOffset(prev => (prev + baseSpeed * 0.3 * dt) % 60);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [spawnBlock, addParticles, addCombo]);

  const startGame = useCallback(() => {
    playerXRef.current = 200;
    blocksRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    worldIndexRef.current = 0;
    comboCountRef.current = 0;
    blocksDodgedRef.current = 0;
    spawnTimerRef.current = 0;
    lastTimeRef.current = null;
    gameStateRef.current = "playing";

    setPlayerX(200);
    setBlocks([]);
    setScore(0);
    setLevel(1);
    setWorldIndex(0);
    setComboCount(0);
    setIsHit(false);
    setIsDashing(false);
    setParticles([]);
    setCombos([]);
    setGameState("playing");
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKey = (e) => {
      keysRef.current[e.key] = e.type === "keydown";
      if (e.type === "keydown" && ["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
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

  // Bloquer scroll mobile
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    document.addEventListener("touchstart", prevent, { passive: false });
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.removeEventListener("touchmove", prevent);
      document.removeEventListener("touchstart", prevent);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  // Touch controls
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    e.preventDefault();
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (touchStartX.current === null || gameState !== "playing") return;
    const clientX = e.touches[0].clientX;
    const delta = clientX - touchStartX.current;
    touchStartX.current = clientX;
    let newX = playerXRef.current + delta * 1.5;
    newX = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, newX));
    playerXRef.current = newX;
    setPlayerX(newX);
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  const levelColor = ["#6BCB77", "#FFD93D", "#FF9F43", "#FF6B6B", "#FF6FC8", "#4D96FF"][Math.min(level - 1, 5)];

  const gridLines = [];
  for (let i = 0; i < 8; i++) {
    gridLines.push(<div key={`v${i}`} style={{ position: "absolute", left: i * 55, top: 0, bottom: 0, width: 1, background: world.gridColor }} />);
  }
  for (let i = 0; i < 12; i++) {
    gridLines.push(<div key={`h${i}`} style={{ position: "absolute", top: (i * 60 + bgOffset) % GAME_HEIGHT, left: 0, right: 0, height: 1, background: world.gridColor }} />);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #0a0a1a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      userSelect: "none",
      touchAction: "none",
      overflow: "hidden",
      padding: "10px 0",
    }}>
      <div style={{
        fontSize: 22, fontWeight: 900, color: "#fff",
        letterSpacing: 3, marginBottom: 8,
        textShadow: `0 0 20px ${world.playerColor.glow}`,
        textTransform: "uppercase",
        transition: "text-shadow 1s",
      }}>
        {world.emoji} BLOCK DASH
      </div>

      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background: world.bg,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 0 60px ${world.playerColor.glow}44, 0 20px 60px rgba(0,0,0,0.6)`,
          border: `2px solid ${world.playerColor.glow}33`,
          transition: "background 1s, box-shadow 1s",
          cursor: "none",
          touchAction: "none",
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
      >
        {gridLines}

        {world.stars && [...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 47 + 13) % 100}%`,
            top: `${(i * 37 + 7) % 80}%`,
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            background: "#fff", borderRadius: "50%",
            opacity: 0.3 + (i % 4) * 0.15,
          }} />
        ))}

        {/* World badge */}
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "3px 12px",
          color: world.playerColor.bg, fontSize: 10, fontWeight: 700,
          letterSpacing: 2, textTransform: "uppercase", zIndex: 5,
          border: `1px solid ${world.playerColor.glow}44`,
          transition: "color 1s", whiteSpace: "nowrap",
        }}>
          {world.emoji} MONDE {Math.min(Math.floor((level - 1) / 3) + 1, WORLDS.length)} — {world.name}
        </div>

        {/* HUD */}
        {gameState === "playing" && (
          <>
            <div style={{ position: "absolute", top: 36, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 16px", zIndex: 10 }}>
              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "5px 12px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color: "#aaa", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Score</div>
                <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{score}</div>
              </div>

              {comboCount >= 2 && (
                <div style={{
                  background: "rgba(255,150,0,0.2)", borderRadius: 10, padding: "5px 12px",
                  backdropFilter: "blur(6px)", border: "1px solid rgba(255,150,0,0.5)",
                  textAlign: "center",
                }}>
                  <div style={{ color: "#FFD93D", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>COMBO</div>
                  <div style={{ color: "#FF9F43", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>x{comboCount}</div>
                </div>
              )}

              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "5px 12px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color: "#aaa", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Record</div>
                <div style={{ color: "#FFD93D", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{highScore}</div>
              </div>
            </div>

            {/* Level progress bar */}
            <div style={{ position: "absolute", top: 90, left: 16, right: 16, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, zIndex: 10 }}>
              <div style={{
                width: `${(scoreRef.current % 100)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${world.playerColor.shadow}, ${world.playerColor.bg})`,
                borderRadius: 2,
                boxShadow: `0 0 6px ${world.playerColor.glow}`,
                transition: "background 1s",
              }} />
            </div>
            <div style={{ position: "absolute", top: 97, right: 16, color: levelColor, fontSize: 10, fontWeight: 700, zIndex: 10 }}>
              Niv.{level}
            </div>
          </>
        )}

        {blocks.map(b => <Block key={b.id} x={b.x} y={b.y} color={b.color} />)}
        <ParticleEffect particles={particles} />
        <ComboPopup combos={combos} />

        {/* Ground */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
          background: world.ground,
          borderTop: `2px solid ${world.groundBorder}`,
          boxShadow: `0 -4px 20px ${world.groundGlow}`,
          transition: "background 1s",
        }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", bottom: 10, left: i * 46 + 4,
              width: 40, height: 30,
              background: `${world.playerColor.glow}10`,
              borderRadius: 4,
              border: `1px solid ${world.playerColor.glow}20`,
            }} />
          ))}
        </div>

        {gameState !== "menu" && (
          <Player x={playerX} isHit={isHit} isDashing={isDashing} playerColor={world.playerColor} />
        )}

        {/* MENU */}
        {gameState === "menu" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", gap: 14,
          }}>
            <div style={{
              width: 60, height: 60,
              background: `linear-gradient(145deg, ${world.playerColor.bg}, ${world.playerColor.shadow})`,
              borderRadius: 12,
              boxShadow: `0 8px 0 ${world.playerColor.shadow}, 0 0 30px ${world.playerColor.glow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "float 2s ease-in-out infinite",
            }}>
              <span style={{ fontSize: 28 }}>😊</span>
            </div>
            <div style={{ color: "#fff", fontSize: 34, fontWeight: 900, textShadow: `0 0 20px ${world.playerColor.glow}`, letterSpacing: 2 }}>
              BLOCK DASH
            </div>
            <div style={{ color: "#888", fontSize: 12, textAlign: "center", lineHeight: 2 }}>
              🖱️ Souris / Doigt → déplacer<br/>
              ⌨️ Flèches ou A/D → clavier
            </div>
            <button
              onClick={startGame}
              style={{
                background: `linear-gradient(135deg, ${world.playerColor.bg}, ${world.playerColor.shadow})`,
                color: "#fff", border: "none", borderRadius: 14,
                padding: "16px 48px", fontSize: 20, fontWeight: 900, cursor: "pointer",
                boxShadow: `0 6px 0 ${world.playerColor.shadow}, 0 0 20px ${world.playerColor.glow}66`,
                letterSpacing: 2, textTransform: "uppercase",
              }}
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
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", gap: 12,
          }}>
            <div style={{ fontSize: 50 }}>💥</div>
            <div style={{ color: "#FF6B6B", fontSize: 32, fontWeight: 900, textShadow: "0 0 20px #ff4444", letterSpacing: 2 }}>
              PERDU !
            </div>
            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "16px 32px", textAlign: "center",
            }}>
              <div style={{ color: "#aaa", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Score final</div>
              <div style={{ color: "#fff", fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{score}</div>
              {score > 0 && score >= highScore && (
                <div style={{ color: "#FFD93D", fontSize: 13, marginTop: 6, fontWeight: 700 }}>⭐ NOUVEAU RECORD !</div>
              )}
              <div style={{ color: "#FFD93D", fontSize: 13, marginTop: 6 }}>🏆 Record : {highScore}</div>
              <div style={{ color: levelColor, fontSize: 12, marginTop: 4 }}>Niveau {level} · {world.emoji} {world.name}</div>
            </div>
            <button
              onClick={startGame}
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #C0392B)",
                color: "#fff", border: "none", borderRadius: 14,
                padding: "14px 42px", fontSize: 18, fontWeight: 900, cursor: "pointer",
                boxShadow: "0 6px 0 #922b21, 0 0 20px rgba(255,107,107,0.4)",
                letterSpacing: 2, textTransform: "uppercase",
              }}
            >
              🔄 REJOUER
            </button>
            <button
              onClick={() => { setGameState("menu"); gameStateRef.current = "menu"; setIsHit(false); }}
              style={{
                background: "transparent", color: "#aaa",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10,
                padding: "10px 30px", fontSize: 14, cursor: "pointer",
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
          @keyframes comboFly {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-60px) scale(1.3); opacity: 0; }
          }
          * { box-sizing: border-box; }
          html, body { overflow: hidden; touch-action: none; position: fixed; width: 100%; }
        `}</style>
      </div>

    </div>
  );
}
