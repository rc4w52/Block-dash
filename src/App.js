import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qdjlcjpbqwwgkdbgvdin.supabase.co",
  "sb_publishable_gDlznP0Qv94GqLmLu_rgpw_ktzhoecX"
);

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const BLOCK_WIDTH = 45;
const BLOCK_HEIGHT = 30;
const GROUND_Y = GAME_HEIGHT - 60;
const PLAYER_Y = GROUND_Y - PLAYER_SIZE;
const LANES = [60, 140, 220, 300, 360];

const SKINS = [
  { id: "default", name: "Défaut", emoji: "😊", price: 0, color: { bg: "#A29BFE", shadow: "#6C5CE7", glow: "#7c6fff" }, shape: "square" },
  { id: "gold", name: "Or", emoji: "⭐", price: 200, color: { bg: "#FFD700", shadow: "#B8860B", glow: "#ffdd00" }, shape: "square" },
  { id: "silver", name: "Argent", emoji: "🥈", price: 100, color: { bg: "#C0C0C0", shadow: "#808080", glow: "#dddddd" }, shape: "square" },
  { id: "fire", name: "Feu", emoji: "🔥", price: 300, color: { bg: "#FF4500", shadow: "#8B0000", glow: "#ff6600" }, shape: "square" },
  { id: "ice", name: "Glace", emoji: "❄️", price: 300, color: { bg: "#00BFFF", shadow: "#00688B", glow: "#00eeff" }, shape: "square" },
  { id: "rainbow", name: "Arc-en-ciel", emoji: "🌈", price: 500, color: { bg: "#FF6B6B", shadow: "#A29BFE", glow: "#ff44cc" }, shape: "square", rainbow: true },
  { id: "diamond", name: "Diamant", emoji: "💎", price: 800, color: { bg: "#B9F2FF", shadow: "#00CED1", glow: "#88ffff" }, shape: "diamond" },
  { id: "star", name: "Étoile", emoji: "⭐", price: 600, color: { bg: "#FFD700", shadow: "#FF8C00", glow: "#ffee00" }, shape: "star" },
  { id: "ghost", name: "Fantôme", emoji: "👻", price: 400, color: { bg: "rgba(255,255,255,0.3)", shadow: "rgba(200,200,255,0.5)", glow: "#ffffff" }, shape: "round" },
];

const WORLDS = [
  { name: "ESPACE", emoji: "🌌", bg: "linear-gradient(180deg,#0d0d2b,#111133,#1a1a3e)", ground: "linear-gradient(180deg,#1a1a4e,#0d0d2b)", groundBorder: "rgba(162,155,254,0.3)", groundGlow: "rgba(162,155,254,0.2)", gridColor: "rgba(255,255,255,0.04)", blockColors: [{ bg: "#FF6B6B", shadow: "#C0392B", glow: "#ff4444" }, { bg: "#FFD93D", shadow: "#F39C12", glow: "#ffcc00" }, { bg: "#4D96FF", shadow: "#2980B9", glow: "#4488ff" }, { bg: "#FF6FC8", shadow: "#8E44AD", glow: "#ff44cc" }], stars: true },
  { name: "ENFER", emoji: "🔥", bg: "linear-gradient(180deg,#1a0000,#2d0000,#1a0000)", ground: "linear-gradient(180deg,#4a0000,#1a0000)", groundBorder: "rgba(255,100,0,0.5)", groundGlow: "rgba(255,50,0,0.3)", gridColor: "rgba(255,80,0,0.06)", blockColors: [{ bg: "#FF4500", shadow: "#8B0000", glow: "#ff2200" }, { bg: "#FF6B35", shadow: "#C0392B", glow: "#ff4400" }, { bg: "#FFD700", shadow: "#B8860B", glow: "#ffaa00" }, { bg: "#FF1493", shadow: "#8B0000", glow: "#ff0066" }], stars: false },
  { name: "OCÉAN", emoji: "🌊", bg: "linear-gradient(180deg,#001a33,#002244,#001a33)", ground: "linear-gradient(180deg,#003366,#001a33)", groundBorder: "rgba(0,200,255,0.4)", groundGlow: "rgba(0,150,255,0.2)", gridColor: "rgba(0,200,255,0.05)", blockColors: [{ bg: "#00CED1", shadow: "#006994", glow: "#00ffff" }, { bg: "#1E90FF", shadow: "#00008B", glow: "#4488ff" }, { bg: "#00FA9A", shadow: "#006400", glow: "#00ff88" }, { bg: "#7B68EE", shadow: "#4B0082", glow: "#8866ff" }], stars: false },
  { name: "FORÊT", emoji: "🌿", bg: "linear-gradient(180deg,#0a1a00,#0d2200,#0a1a00)", ground: "linear-gradient(180deg,#1a3300,#0a1a00)", groundBorder: "rgba(100,200,50,0.4)", groundGlow: "rgba(80,180,30,0.2)", gridColor: "rgba(100,200,50,0.05)", blockColors: [{ bg: "#6BCB77", shadow: "#27AE60", glow: "#44ff66" }, { bg: "#8BC34A", shadow: "#33691E", glow: "#88cc00" }, { bg: "#FF9800", shadow: "#E65100", glow: "#ff8800" }, { bg: "#CDDC39", shadow: "#827717", glow: "#ccdd00" }], stars: false },
];

const COMBO_MESSAGES = ["NICE!", "SUPER!", "COMBO!", "INCROYABLE!", "LÉGENDAIRE!"];
let blockIdCounter = 0;
let comboIdCounter = 0;

// ─── Player component ───
function Player({ x, isHit, skin }) {
  const s = SKINS.find(s => s.id === skin) || SKINS[0];
  const c = s.color;
  const baseStyle = {
    position: "absolute",
    left: x - PLAYER_SIZE / 2,
    top: PLAYER_Y,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    background: isHit ? "#FF6B6B" : (s.rainbow ? "linear-gradient(135deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#ff6fc8)" : `linear-gradient(145deg,${c.bg},${c.shadow})`),
    borderRadius: s.shape === "round" ? "50%" : s.shape === "diamond" ? "0" : 8,
    boxShadow: isHit ? "0 0 20px #ff4444,0 6px 0 #c0392b" : `0 6px 0 ${c.shadow},0 0 20px ${c.glow}`,
    border: `2px solid ${isHit ? "#ff8888" : c.bg}`,
    transition: "left 0.08s ease-out",
    transform: s.shape === "diamond" ? "rotate(45deg)" : "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18,
  };
  return (
    <div style={baseStyle}>
      {s.shape !== "diamond" && (
        <>
          <div style={{ position: "absolute", top: 10, left: 6, width: 9, height: 9, background: "#fff", borderRadius: "50%", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 10, right: 6, width: 9, height: 9, background: "#fff", borderRadius: "50%", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 13, left: 9, width: 4, height: 4, background: "#333", borderRadius: "50%", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 13, right: 9, width: 4, height: 4, background: "#333", borderRadius: "50%", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 4, left: 5, right: 5, height: 7, background: "rgba(255,255,255,0.25)", borderRadius: 4 }} />
        </>
      )}
    </div>
  );
}

function Block({ x, y, color }) {
  return (
    <div style={{ position: "absolute", left: x - BLOCK_WIDTH / 2, top: y, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, background: `linear-gradient(145deg,${color.bg},${color.shadow})`, borderRadius: 6, boxShadow: `0 4px 0 ${color.shadow},0 0 10px ${color.glow}66`, border: `2px solid ${color.bg}` }}>
      <div style={{ position: "absolute", top: 3, left: 4, right: 4, height: 5, background: "rgba(255,255,255,0.3)", borderRadius: 3 }} />
    </div>
  );
}

function ComboPopup({ combos }) {
  return combos.map(c => (
    <div key={c.id} style={{ position: "absolute", left: c.x - 50, top: c.y, color: "#FFD93D", fontWeight: 900, fontSize: c.size, textShadow: "0 0 10px #ff8800", pointerEvents: "none", whiteSpace: "nowrap", animation: "comboFly 1s ease-out forwards", zIndex: 20 }}>
      {c.text}
    </div>
  ));
}

// ─── Auth Screen ───
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) { setError("Remplis tous les champs !"); return; }
    setLoading(true); setError("");
    if (mode === "register") {
      const { data: existing } = await supabase.from("users").select("id").eq("username", username).single();
      if (existing) { setError("Ce pseudo est déjà pris !"); setLoading(false); return; }
      const { data, error: err } = await supabase.from("users").insert([{ username, password, high_score: 0, coins: 0, owned_skins: ["default"], equipped_skin: "default" }]).select().single();
      if (err) { setError("Erreur lors de l'inscription"); setLoading(false); return; }
      onLogin(data);
    } else {
      const { data, error: err } = await supabase.from("users").select("*").eq("username", username).eq("password", password).single();
      if (err || !data) { setError("Pseudo ou mot de passe incorrect !"); setLoading(false); return; }
      onLogin(data);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg,#0a0a1a,#12122a,#0a0a1a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif", padding: 20 }}>
      <div style={{ width: 60, height: 60, background: "linear-gradient(145deg,#A29BFE,#6C5CE7)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 8px 0 #4a3aaa,0 0 30px #7c6fff", marginBottom: 16, animation: "float 2s ease-in-out infinite" }}>😊</div>
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: 3, marginBottom: 4, textShadow: "0 0 20px #A29BFE" }}>BLOCK DASH</div>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 24 }}>{mode === "login" ? "Connexion" : "Créer un compte"}</div>

      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Pseudo"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none" }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none" }}
        />
        {error && <div style={{ color: "#FF6B6B", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ background: "linear-gradient(135deg,#A29BFE,#6C5CE7)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 0 #4a3aaa", letterSpacing: 1 }}>
          {loading ? "..." : mode === "login" ? "SE CONNECTER" : "S'INSCRIRE"}
        </button>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} style={{ background: "transparent", color: "#A29BFE", border: "none", fontSize: 13, cursor: "pointer" }}>
          {mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
    </div>
  );
}

// ─── Shop Screen ───
function ShopScreen({ user, onClose, onBuy, onEquip }) {
  const ownedSkins = user.owned_skins || ["default"];
  const equippedSkin = user.equipped_skin || "default";

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>🛍️ BOUTIQUE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#FFD93D", fontWeight: 900, fontSize: 16 }}>🪙 {user.coins}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      </div>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SKINS.map(skin => {
          const owned = ownedSkins.includes(skin.id);
          const equipped = equippedSkin === skin.id;
          return (
            <div key={skin.id} style={{ background: equipped ? "rgba(162,155,254,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${equipped ? "#A29BFE" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* Skin preview */}
              <div style={{ width: 44, height: 44, background: skin.rainbow ? "linear-gradient(135deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#ff6fc8)" : `linear-gradient(145deg,${skin.color.bg},${skin.color.shadow})`, borderRadius: skin.shape === "round" ? "50%" : skin.shape === "diamond" ? 0 : 8, transform: skin.shape === "diamond" ? "rotate(45deg)" : "none", boxShadow: `0 4px 0 ${skin.color.shadow},0 0 12px ${skin.color.glow}` }} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{skin.emoji} {skin.name}</div>
              {owned ? (
                <button onClick={() => onEquip(skin.id)} style={{ background: equipped ? "linear-gradient(135deg,#A29BFE,#6C5CE7)" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, width: "100%" }}>
                  {equipped ? "✓ ÉQUIPÉ" : "ÉQUIPER"}
                </button>
              ) : (
                <button onClick={() => onBuy(skin)} disabled={user.coins < skin.price} style={{ background: user.coins >= skin.price ? "linear-gradient(135deg,#FFD93D,#FF9F43)" : "rgba(255,255,255,0.05)", color: user.coins >= skin.price ? "#000" : "#555", border: "none", borderRadius: 8, padding: "6px 14px", cursor: user.coins >= skin.price ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, width: "100%" }}>
                  🪙 {skin.price}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Game ───
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("auth"); // auth | menu | playing | dead | shop
  const [playerX, setPlayerX] = useState(200);
  const [blocks, setBlocks] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [worldIndex, setWorldIndex] = useState(0);
  const [isHit, setIsHit] = useState(false);
  const [combos, setCombos] = useState([]);
  const [comboCount, setComboCount] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showShop, setShowShop] = useState(false);

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
  const comboCountRef = useRef(0);
  const blocksDodgedRef = useRef(0);
  const coinsEarnedRef = useRef(0);

  const world = WORLDS[worldIndex];
  const equippedSkin = user?.equipped_skin || "default";

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen("menu");
  };

  const saveScore = useCallback(async (finalScore, coins) => {
    if (!user) return;
    const newHighScore = Math.max(user.high_score || 0, finalScore);
    const newCoins = (user.coins || 0) + coins;
    await supabase.from("users").update({ high_score: newHighScore, coins: newCoins }).eq("id", user.id);
    setUser(prev => ({ ...prev, high_score: newHighScore, coins: newCoins }));
  }, [user]);

  const handleBuy = async (skin) => {
    if (!user || user.coins < skin.price) return;
    const newCoins = user.coins - skin.price;
    const newSkins = [...(user.owned_skins || ["default"]), skin.id];
    await supabase.from("users").update({ coins: newCoins, owned_skins: newSkins, equipped_skin: skin.id }).eq("id", user.id);
    setUser(prev => ({ ...prev, coins: newCoins, owned_skins: newSkins, equipped_skin: skin.id }));
  };

  const handleEquip = async (skinId) => {
    if (!user) return;
    await supabase.from("users").update({ equipped_skin: skinId }).eq("id", user.id);
    setUser(prev => ({ ...prev, equipped_skin: skinId }));
  };

  const spawnBlock = useCallback(() => {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const w = WORLDS[worldIndexRef.current];
    const color = w.blockColors[Math.floor(Math.random() * w.blockColors.length)];
    blockIdCounter++;
    return { id: blockIdCounter, x: lane, y: -BLOCK_HEIGHT, color, passed: false };
  }, []);

  const addCombo = useCallback((x, y, count) => {
    comboIdCounter++;
    const msg = COMBO_MESSAGES[Math.min(count - 1, COMBO_MESSAGES.length - 1)];
    const newCombo = { id: comboIdCounter, x, y, text: `${count}x ${msg}`, size: Math.min(13 + count * 2, 22) };
    setCombos(prev => [...prev, newCombo]);
    setTimeout(() => setCombos(prev => prev.filter(c => c.id !== newCombo.id)), 1000);
  }, []);

  const gameLoop = useCallback((timestamp) => {
    if (gameStateRef.current !== "playing") return;
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 2);
    lastTimeRef.current = timestamp;

    const currentLevel = levelRef.current;
    const baseSpeed = 2.5 + (currentLevel - 1) * 0.5;
    const spawnInterval = Math.max(45, 90 - currentLevel * 6);

    // Move player
    const moveSpeed = 5.5;
    let newX = playerXRef.current;
    if (keysRef.current["ArrowLeft"] || keysRef.current["a"]) newX -= moveSpeed * dt;
    if (keysRef.current["ArrowRight"] || keysRef.current["d"]) newX += moveSpeed * dt;
    newX = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, newX));
    playerXRef.current = newX;
    setPlayerX(newX);

    // Spawn
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

      if (!block.passed && newY > PLAYER_Y + PLAYER_SIZE) {
        blocksDodgedRef.current++;
        if (blocksDodgedRef.current % 3 === 0) {
          comboCountRef.current++;
          setComboCount(comboCountRef.current);
          addCombo(playerXRef.current, PLAYER_Y - 30, comboCountRef.current);
        }
        newBlocks.push({ ...block, y: newY, passed: true });
        continue;
      }

      const px = playerXRef.current;
      const margin = 6;
      if (!block.passed && newY + BLOCK_HEIGHT > PLAYER_Y + margin && newY < PLAYER_Y + PLAYER_SIZE - margin && Math.abs(block.x - px) < (PLAYER_SIZE + BLOCK_WIDTH) / 2 - margin) {
        hit = true;
        continue;
      }
      newBlocks.push({ ...block, y: newY });
    }

    if (hit) {
      const finalScore = Math.floor(scoreRef.current);
      const coins = Math.floor(finalScore / 10);
      coinsEarnedRef.current = coins;
      setCoinsEarned(coins);
      comboCountRef.current = 0;
      blocksDodgedRef.current = 0;
      setComboCount(0);
      blocksRef.current = newBlocks;
      setBlocks([...newBlocks]);
      gameStateRef.current = "dead";
      setScreen("dead");
      setIsHit(true);
      saveScore(finalScore, coins);
      return;
    }

    blocksRef.current = newBlocks;
    setBlocks([...newBlocks]);

    const comboMultiplier = 1 + comboCountRef.current * 0.1;
    scoreRef.current += dt * 0.5 * comboMultiplier;
    setScore(Math.floor(scoreRef.current));

    const newLevel = Math.floor(scoreRef.current / 100) + 1;
    if (newLevel !== levelRef.current) { levelRef.current = newLevel; setLevel(newLevel); }

    const newWorldIndex = Math.min(Math.floor((newLevel - 1) / 3), WORLDS.length - 1);
    if (newWorldIndex !== worldIndexRef.current) { worldIndexRef.current = newWorldIndex; setWorldIndex(newWorldIndex); }

    setBgOffset(prev => (prev + baseSpeed * 0.3 * dt) % 60);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [spawnBlock, addCombo, saveScore]);

  const startGame = useCallback(() => {
    playerXRef.current = 200;
    blocksRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    worldIndexRef.current = 0;
    comboCountRef.current = 0;
    blocksDodgedRef.current = 0;
    coinsEarnedRef.current = 0;
    spawnTimerRef.current = 0;
    lastTimeRef.current = null;
    gameStateRef.current = "playing";
    setPlayerX(200); setBlocks([]); setScore(0); setLevel(1); setWorldIndex(0);
    setComboCount(0); setIsHit(false); setCombos([]); setCoinsEarned(0);
    setScreen("playing");
  }, []);

  useEffect(() => {
    if (screen === "playing") animRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [screen, gameLoop]);

  useEffect(() => {
    const handleKey = (e) => { keysRef.current[e.key] = e.type === "keydown"; };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKey); };
  }, []);

  useEffect(() => {
    const preventMove = (e) => e.preventDefault();
    document.addEventListener("touchmove", preventMove, { passive: false });
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.removeEventListener("touchmove", preventMove);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (touchStartX.current === null || screen !== "playing") return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchStartX.current = e.touches[0].clientX;
    let newX = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, playerXRef.current + delta * 1.5));
    playerXRef.current = newX;
    setPlayerX(newX);
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  if (screen === "auth") return <AuthScreen onLogin={handleLogin} />;

  const levelColor = ["#6BCB77", "#FFD93D", "#FF9F43", "#FF6B6B", "#FF6FC8", "#4D96FF"][Math.min(level - 1, 5)];
  const skinColor = (SKINS.find(s => s.id === equippedSkin) || SKINS[0]).color;

  // Grid lines (fewer for perf)
  const gridLines = [];
  for (let i = 0; i < 6; i++) gridLines.push(<div key={`v${i}`} style={{ position: "absolute", left: i * 70, top: 0, bottom: 0, width: 1, background: world.gridColor }} />);
  for (let i = 0; i < 8; i++) gridLines.push(<div key={`h${i}`} style={{ position: "absolute", top: (i * 75 + bgOffset) % GAME_HEIGHT, left: 0, right: 0, height: 1, background: world.gridColor }} />);

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg,#0a0a1a,#12122a,#0a0a1a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif", userSelect: "none", touchAction: "none", overflow: "hidden", padding: "10px 0" }}>

      {/* Top bar */}
      {screen !== "auth" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: GAME_WIDTH, marginBottom: 8, padding: "0 4px" }}>
          <div style={{ color: "#A29BFE", fontWeight: 700, fontSize: 13 }}>👤 {user?.username}</div>
          <div style={{ color: "#FFD93D", fontWeight: 700, fontSize: 13 }}>🪙 {user?.coins || 0}</div>
          <div style={{ color: "#aaa", fontWeight: 700, fontSize: 13 }}>🏆 {user?.high_score || 0}</div>
        </div>
      )}

      <div
        style={{ position: "relative", width: GAME_WIDTH, height: GAME_HEIGHT, background: world.bg, borderRadius: 16, overflow: "hidden", boxShadow: `0 0 40px ${skinColor.glow}33,0 20px 60px rgba(0,0,0,0.6)`, border: `2px solid ${skinColor.glow}22`, transition: "background 1s", cursor: "none" }}
        onMouseMove={screen === "playing" ? (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          let nx = Math.max(PLAYER_SIZE / 2 + 10, Math.min(GAME_WIDTH - PLAYER_SIZE / 2 - 10, e.clientX - rect.left));
          playerXRef.current = nx; setPlayerX(nx);
        } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {gridLines}

        {world.stars && [...Array(15)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i * 47 + 13) % 100}%`, top: `${(i * 37 + 7) % 80}%`, width: 2, height: 2, background: "#fff", borderRadius: "50%", opacity: 0.3 + (i % 4) * 0.15 }} />
        ))}

        {/* World badge */}
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "3px 12px", color: skinColor.bg, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", zIndex: 5, border: `1px solid ${skinColor.glow}33`, whiteSpace: "nowrap", transition: "color 1s" }}>
          {world.emoji} {world.name}
        </div>

        {/* Shop button */}
        {(screen === "menu" || screen === "dead") && (
          <button onClick={() => setShowShop(true)} style={{ position: "absolute", top: 8, right: 12, background: "rgba(255,217,61,0.15)", border: "1px solid rgba(255,217,61,0.3)", color: "#FFD93D", borderRadius: 10, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 700, zIndex: 10 }}>
            🛍️
          </button>
        )}

        {/* HUD */}
        {screen === "playing" && (
          <>
            <div style={{ position: "absolute", top: 36, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 16px", zIndex: 10 }}>
              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "5px 12px", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color: "#aaa", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Score</div>
                <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{score}</div>
              </div>
              {comboCount >= 2 && (
                <div style={{ background: "rgba(255,150,0,0.2)", borderRadius: 10, padding: "5px 12px", border: "1px solid rgba(255,150,0,0.4)", textAlign: "center" }}>
                  <div style={{ color: "#FFD93D", fontSize: 10, fontWeight: 700 }}>COMBO</div>
                  <div style={{ color: "#FF9F43", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>x{comboCount}</div>
                </div>
              )}
              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "5px 12px", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color: "#aaa", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Record</div>
                <div style={{ color: "#FFD93D", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{user?.high_score || 0}</div>
              </div>
            </div>
            <div style={{ position: "absolute", top: 90, left: 16, right: 16, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, zIndex: 10 }}>
              <div style={{ width: `${scoreRef.current % 100}%`, height: "100%", background: `linear-gradient(90deg,${skinColor.shadow},${skinColor.bg})`, borderRadius: 2, transition: "background 1s" }} />
            </div>
            <div style={{ position: "absolute", top: 96, right: 16, color: levelColor, fontSize: 10, fontWeight: 700, zIndex: 10 }}>Niv.{level}</div>
          </>
        )}

        {blocks.map(b => <Block key={b.id} x={b.x} y={b.y} color={b.color} />)}
        <ComboPopup combos={combos} />

        {/* Ground */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: world.ground, borderTop: `2px solid ${world.groundBorder}`, boxShadow: `0 -4px 20px ${world.groundGlow}`, transition: "background 1s" }}>
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{ position: "absolute", bottom: 10, left: i * 46 + 4, width: 40, height: 30, background: `${skinColor.glow}08`, borderRadius: 4, border: `1px solid ${skinColor.glow}15` }} />
          ))}
        </div>

        {screen !== "menu" && <Player x={playerX} isHit={isHit} skin={equippedSkin} />}

        {/* MENU */}
        {screen === "menu" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", gap: 16 }}>
            <Player x={200} isHit={false} skin={equippedSkin} />
            <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, textShadow: `0 0 20px ${skinColor.glow}`, letterSpacing: 2, marginTop: 8 }}>BLOCK DASH</div>
            <div style={{ color: "#888", fontSize: 12, textAlign: "center", lineHeight: 2 }}>
              🖱️ Souris / Doigt → déplacer<br/>
              ⌨️ Flèches ou A/D → clavier
            </div>
            <button onClick={startGame} style={{ background: `linear-gradient(135deg,${skinColor.bg},${skinColor.shadow})`, color: "#fff", border: "none", borderRadius: 14, padding: "16px 48px", fontSize: 20, fontWeight: 900, cursor: "pointer", boxShadow: `0 6px 0 ${skinColor.shadow},0 0 20px ${skinColor.glow}55`, letterSpacing: 2, textTransform: "uppercase" }}>
              ▶ JOUER
            </button>
            <button onClick={() => setUser(null)} style={{ background: "transparent", color: "#555", border: "none", fontSize: 12, cursor: "pointer" }}>Se déconnecter</button>
          </div>
        )}

        {/* GAME OVER */}
        {screen === "dead" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", gap: 12 }}>
            <div style={{ fontSize: 48 }}>💥</div>
            <div style={{ color: "#FF6B6B", fontSize: 30, fontWeight: 900, textShadow: "0 0 20px #ff4444", letterSpacing: 2 }}>PERDU !</div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 28px", textAlign: "center" }}>
              <div style={{ color: "#aaa", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Score final</div>
              <div style={{ color: "#fff", fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{score}</div>
              {score > 0 && score >= (user?.high_score || 0) && <div style={{ color: "#FFD93D", fontSize: 13, marginTop: 6, fontWeight: 700 }}>⭐ NOUVEAU RECORD !</div>}
              <div style={{ color: "#FFD93D", fontSize: 13, marginTop: 6 }}>🏆 Record : {user?.high_score || 0}</div>
              <div style={{ color: "#6BCB77", fontSize: 13, marginTop: 4 }}>🪙 +{coinsEarned} pièces gagnées !</div>
              <div style={{ color: levelColor, fontSize: 12, marginTop: 4 }}>Niveau {level} · {world.emoji} {world.name}</div>
            </div>
            <button onClick={startGame} style={{ background: "linear-gradient(135deg,#FF6B6B,#C0392B)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 42px", fontSize: 18, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 0 #922b21", letterSpacing: 2, textTransform: "uppercase" }}>
              🔄 REJOUER
            </button>
            <button onClick={() => { gameStateRef.current = "menu"; setScreen("menu"); setIsHit(false); }} style={{ background: "transparent", color: "#aaa", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 30px", fontSize: 14, cursor: "pointer" }}>
              ← Menu
            </button>
          </div>
        )}

        {/* Shop overlay */}
        {showShop && <ShopScreen user={user} onClose={() => setShowShop(false)} onBuy={handleBuy} onEquip={handleEquip} />}

        <style>{`
          @keyframes comboFly { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-60px) scale(1.3);opacity:0} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          * { box-sizing:border-box; }
          html,body { overflow:hidden; touch-action:none; position:fixed; width:100%; }
          input::placeholder { color: rgba(255,255,255,0.3); }
        `}</style>
      </div>
    </div>
  );
}
