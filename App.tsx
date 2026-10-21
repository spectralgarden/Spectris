// tslint:disable
/* eslint-disable */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Play,
  RotateCw,
  Volume2,
  VolumeX,
  Pause,
  Menu,
  HelpCircle,
  Home,
  Zap,
  Sparkles,
  Shield,
  ArrowLeft,
  Trophy,
  Star,
  CheckCircle2,
  CircleDot,
  Gift,
  Coins,
  Bookmark,
  RefreshCw,
} from 'lucide-react';
import {getConfig} from './constants';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  formatTime,
  gameAudio,
  type GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  useRpc,
} from './utils/usePlayground';

// --- TETROMINO SHAPES & COSMIC PASTEL PALETTE DEFINITIONS ---
export type TetrominoKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'W';

export interface TetrominoDef {
  shape: number[][];
  color: string;
  highlight: string;
  accent: string;
  glow: string;
  name: string;
  isWild?: boolean;
}

const TETROMINOES: Record<TetrominoKey, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#7bf1e8', // Pastel Celestial Cyan / Mint Frost
    highlight: '#a8ffeb',
    accent: '#e0ffff',
    glow: 'rgba(123, 241, 232, 0.75)',
    name: 'Celestial I-Mint',
    isWild: false,
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#fff07c', // Pastel Solar Stardust / Lemon Cream
    highlight: '#fff8b8',
    accent: '#fffae0',
    glow: 'rgba(255, 240, 124, 0.75)',
    name: 'Solar O-Stardust',
    isWild: false,
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#d18aff', // Pastel Lilac Nebulae / Cosmic Amethyst
    highlight: '#e6baff',
    accent: '#f8ebff',
    glow: 'rgba(209, 138, 255, 0.75)',
    name: 'Nebula T-Lilac',
    isWild: false,
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#7efcb0', // Pastel Emerald Aurora / Seafoam Jade
    highlight: '#b5ffd2',
    accent: '#edfff5',
    glow: 'rgba(126, 252, 176, 0.75)',
    name: 'Aurora S-Jade',
    isWild: false,
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ff8fa3', // Pastel Rose Quartz / Cosmic Blush
    highlight: '#ffbfcb',
    accent: '#ffe8ed',
    glow: 'rgba(255, 143, 163, 0.75)',
    name: 'Rose Quartz Z',
    isWild: false,
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#8ea8ff', // Pastel Periwinkle / Twilight Sky
    highlight: '#b3c5ff',
    accent: '#e8eeff',
    glow: 'rgba(142, 168, 255, 0.75)',
    name: 'Periwinkle J',
    isWild: false,
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#ffb088', // Pastel Peach / Cosmic Apricot
    highlight: '#ffd1b3',
    accent: '#fff0e6',
    glow: 'rgba(255, 176, 136, 0.75)',
    name: 'Apricot L',
    isWild: false,
  },
  W: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ], // Cosmic Plus / Star Omni-Piece
    color: 'rainbow',
    highlight: '#ffffff',
    accent: '#fff0ff',
    glow: 'rgba(255, 255, 255, 0.95)',
    name: '★ COSMIC WILD ★',
    isWild: true,
  },
};

const STANDARD_KEYS: TetrominoKey[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Map of pastel colors to their highlights/accents for locked blocks
const PASTEL_COLOR_MAP: Record<string, {highlight: string; accent: string; glow: string}> = {
  '#7bf1e8': {highlight: '#a8ffeb', accent: '#e0ffff', glow: 'rgba(123, 241, 232, 0.7)'},
  '#fff07c': {highlight: '#fff8b8', accent: '#fffae0', glow: 'rgba(255, 240, 124, 0.7)'},
  '#d18aff': {highlight: '#e6baff', accent: '#f8ebff', glow: 'rgba(209, 138, 255, 0.7)'},
  '#7efcb0': {highlight: '#b5ffd2', accent: '#edfff5', glow: 'rgba(126, 252, 176, 0.7)'},
  '#ff8fa3': {highlight: '#ffbfcb', accent: '#ffe8ed', glow: 'rgba(255, 143, 163, 0.7)'},
  '#8ea8ff': {highlight: '#b3c5ff', accent: '#e8eeff', glow: 'rgba(142, 168, 255, 0.7)'},
  '#ffb088': {highlight: '#ffd1b3', accent: '#fff0e6', glow: 'rgba(255, 176, 136, 0.7)'},
  // Legacy mappings fallback
  '#00f3ff': {highlight: '#a8ffeb', accent: '#e0ffff', glow: 'rgba(123, 241, 232, 0.7)'},
  '#ffd700': {highlight: '#fff8b8', accent: '#fffae0', glow: 'rgba(255, 240, 124, 0.7)'},
  '#bd00ff': {highlight: '#e6baff', accent: '#f8ebff', glow: 'rgba(209, 138, 255, 0.7)'},
  '#00ff88': {highlight: '#b5ffd2', accent: '#edfff5', glow: 'rgba(126, 252, 176, 0.7)'},
  '#ff0055': {highlight: '#ffbfcb', accent: '#ffe8ed', glow: 'rgba(255, 143, 163, 0.7)'},
  '#0066ff': {highlight: '#b3c5ff', accent: '#e8eeff', glow: 'rgba(142, 168, 255, 0.7)'},
  '#ffaa00': {highlight: '#ffd1b3', accent: '#fff0e6', glow: 'rgba(255, 176, 136, 0.7)'},
};

// Sub-Phases: Classic Spectris Grid, Spectris Breakout Bonus Level, and 5th-Round Slot Machine
type AstralPhase = 'GRID' | 'BREAKOUT' | 'SLOT_MACHINE';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'star' | 'shard';
}

interface BreakoutBlock {
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  glow: string;
  hp: number;
}

interface BreakoutOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: {x: number; y: number; alpha: number}[];
}

// Quest definition
interface QuestItem {
  id: string;
  tier: 1 | 2;
  title: string;
  desc: string;
  current: number;
  target: number;
  rewardSpins: number;
  rewardProgress?: number;
  completed: boolean;
}

// Slot Machine Symbol
interface SlotSymbolDef {
  key: string;
  name: string;
  icon: string;
  color: string;
  payout3: number;
  weight: number;
}

const SLOT_SYMBOLS: SlotSymbolDef[] = [
  {key: '777', name: 'Astral 777', icon: '7️⃣', color: '#ffd700', payout3: 5000, weight: 1},
  {key: 'crown', name: 'Celestial Crown', icon: '👑', color: '#ffaa00', payout3: 3000, weight: 2},
  {key: 'star', name: 'Supernova Star', icon: '⭐', color: '#00f3ff', payout3: 2000, weight: 3},
  {key: 'diamond', name: 'Astral Diamond', icon: '💎', color: '#00ffff', payout3: 1500, weight: 4},
  {key: 'bolt', name: 'Quantum Bolt', icon: '⚡', color: '#bd00ff', payout3: 1000, weight: 5},
  {key: 'gem', name: 'Nebula Gem', icon: '🔮', color: '#00ff88', payout3: 800, weight: 6},
];

const GRID_COLS = 10;
const GRID_ROWS = 20;
const PROGRESSION_BACKGROUND_KEYS = [
  'spectral_garden_bg',
  'astral_nebula_grove_bg',
  'celestial_aurora_spires_bg',
  'reverse_asteroids_bg',
] as const;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper> | null>(null);
  const lastCancelRef = useRef(false);

  // Playground SDK integration
  const {sdk, isReady: sdkReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  const isMobile = useIsMobile();

  // Preload Assets Manifest
  const ASSETS_MANIFEST: Record<string, string> = {
    spectral_garden_bg: 'images/spectral_garden_bg.png',
    astral_nebula_grove_bg: 'images/astral_nebula_grove_bg.png',
    celestial_aurora_spires_bg: 'images/celestial_aurora_spires_bg.png',
    reverse_asteroids_bg: 'images/reverse_asteroids_bg.png',
    breakout_stage_bg: 'images/breakout_stage_bg.png',
    god_mode_bg: 'images/god_mode_bg.png',
    crane_claw: 'images/crane_gantry_claw.png',
    breakout_orb: 'images/breakout_orb_projectile.png',
    skill_bomb_icon: 'images/skill_bomb_icon.png',
    skill_laser_icon: 'images/skill_laser_icon.png',
    skill_freeze_icon: 'images/skill_freeze_icon.png',
  };

  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // --- React UI States ---
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    linesCleared: 0,
    phase: 'GRID' as AstralPhase,
  });

  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState('ANONYMOUS');
  const [leaderboardScores, setLeaderboardScores] = useState<Array<{ name: string; score: number }>>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Skill Energy & Quests State for UI readouts
  const [skillEnergy, setSkillEnergy] = useState(40);
  const [bonusSpins, setBonusSpins] = useState(0);
  const [spinMeterUi, setSpinMeterUi] = useState(0);
  const [currentBgmUrl, setCurrentBgmUrl] = useState<string>('audio/bgm_main_theme.mp3');
  const [phaseAnnounce, setPhaseAnnounce] = useState<string | null>(null);

  // Quests list state for UI rendering
  const [quests, setQuests] = useState<QuestItem[]>([]);

  // Slot Machine Overlay state
  const [slotSpinsRemaining, setSlotSpinsRemaining] = useState(1);
  const [slotTotalWon, setSlotTotalWon] = useState(0);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [slotLastWinMessage, setSlotLastWinMessage] = useState<string | null>(null);
  const [slotCompleted, setSlotCompleted] = useState(false);

  // Hold State for React UI sync
  const [canHoldUi, setCanHoldUi] = useState<boolean>(true);
  const [heldPieceKey, setHeldPieceKey] = useState<TetrominoKey | null>(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    if (gameState.status !== 'GAME_OVER') return;

    let isCurrent = true;
    setIsLoadingLeaderboard(true);
    fetch('https://flamefinder.spectralgarden.net/api/games/spectris/leaderboard', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as {
          scores?: Array<{ name: string; score: number }>;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || 'Could not load the leaderboard.');
        if (isCurrent) {
          setLeaderboardScores(result.scores || []);
          setLeaderboardStatus('');
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLeaderboardStatus(error instanceof Error ? error.message : 'Could not load the leaderboard.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingLeaderboard(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [gameState.status]);

  const submitSpectrisScore = async () => {
    const name = leaderboardName.trim().toUpperCase();
    if (!name || name.length > 12 || isSubmittingScore) return;

    setIsSubmittingScore(true);
    setLeaderboardStatus('Submitting score for moderator review...');
    try {
      const response = await fetch('https://flamefinder.spectralgarden.net/api/games/spectris/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score: gameState.score }),
      });
      const result = await response.json() as { pending?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save your score.');
      setHasSubmittedScore(true);
      setLeaderboardStatus(result.pending
        ? 'Score submitted for moderator review. If approved, it will appear on the leaderboard if it ranks in the top five.'
        : 'Score submitted.');
    } catch (error) {
      setLeaderboardStatus(error instanceof Error ? error.message : 'Could not save your score. Please try again.');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // --- Core Game Simulation Refs (High Performance 60FPS) ---
  const gridRef = useRef<(string | null)[][]>(
    Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(null))
  );

  // Active Tetromino
  const activePieceRef = useRef<{
    type: TetrominoKey;
    matrix: number[][];
    x: number;
    y: number;
    color: string;
    glow: string;
    isWild?: boolean;
  } | null>(null);

  const nextPieceRef = useRef<TetrominoKey>('T');
  const holdPieceRef = useRef<TetrominoKey | null>(null);
  const canHoldRef = useRef<boolean>(true);
  const pieceCounterRef = useRef<number>(0);

  // Crane Claw Animation Position
  const craneXRef = useRef<number>(canvasWidth / 2);
  const craneTargetXRef = useRef<number>(canvasWidth / 2);
  const craneSwayRef = useRef<number>(0);

  // Timers & Mechanics
  const dropTimerRef = useRef<number>(0);
  const dropLockoutTimerRef = useRef<number>(0);
  const freezeTimerRef = useRef<number>(0);
  const lockDelayTimerRef = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(false);
  const lockResetsRef = useRef<number>(0);
  const roundLinesTargetRef = useRef<number>(getConfig('linesPerRound') as number);
  const linesInRoundRef = useRef<number>(0);
  const scoreInRoundRef = useRef<number>(0);
  const skillsUsedInRoundRef = useRef<number>(0);
  const doublePlusClearsInRoundRef = useRef<number>(0);
  const skillEnergyRef = useRef<number>(40);
  const bonusSpinsBankRef = useRef<number>(0);
  const spinMeterRef = useRef<number>(0);

  // Visual Effects Refs
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const shakeRef = useRef<number>(0);
  const laserBeamTimerRef = useRef<{row1: number; row2: number; timer: number} | null>(null);
  const bgStarfieldRef = useRef<
    {x: number; y: number; s: number; alpha: number; speed: number}[]
  >([]);

  // Breakout Phase State
  const breakoutBlocksRef = useRef<BreakoutBlock[]>([]);
  const breakoutOrbsRef = useRef<BreakoutOrb[]>([]);
  const breakoutPaddleRef = useRef<{x: number; y: number; w: number; h: number}>({
    x: canvasWidth / 2 - 90,
    y: canvasHeight - 80,
    w: 180,
    h: 22,
  });
  const breakoutShotsRemainingRef = useRef<number>(6);
  const hasFiredFirstOrbRef = useRef<boolean>(false);
  const breakoutLaunchPromptAlphaRef = useRef<number>(1);

  // Slot Machine Simulation Refs
  const slotReelsRef = useRef<{
    symbols: SlotSymbolDef[];
    currentIndex: number;
    targetIndex: number;
    spinSpeed: number;
    isSpinning: boolean;
    stopTimer: number;
  }[]>([
    {symbols: SLOT_SYMBOLS, currentIndex: 0, targetIndex: 0, spinSpeed: 0, isSpinning: false, stopTimer: 0},
    {symbols: SLOT_SYMBOLS, currentIndex: 2, targetIndex: 2, spinSpeed: 0, isSpinning: false, stopTimer: 0},
    {symbols: SLOT_SYMBOLS, currentIndex: 4, targetIndex: 4, spinSpeed: 0, isSpinning: false, stopTimer: 0},
  ]);
  const slotSpinDurationRef = useRef<number>(0);
  const questsRef = useRef<QuestItem[]>([]);

  // Initialize Starfield
  useEffect(() => {
    const stars: {x: number; y: number; s: number; alpha: number; speed: number}[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        s: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 30 + 10,
      });
    }
    bgStarfieldRef.current = stars;
  }, [canvasWidth, canvasHeight]);

  // Keyboard edge triggers & DAS / ARR Movement state
  const upEdgeRef = useRef(false);
  const downEdgeRef = useRef(false);
  const spaceEdgeRef = useRef(false);
  const holdEdgeRef = useRef(false);
  const skillBombEdgeRef = useRef(false);
  const skillLaserEdgeRef = useRef(false);
  const skillFreezeEdgeRef = useRef(false);

  // Delayed Auto Shift (DAS) & Auto-Repeat Rate (ARR) timers
  const dasTimerRef = useRef<number>(0);
  const arrTimerRef = useRef<number>(0);
  const activeMoveDirRef = useRef<-1 | 0 | 1>(0);
  const touchLeftRef = useRef<boolean>(false);
  const touchRightRef = useRef<boolean>(false);
  const touchDownRef = useRef<boolean>(false);

  // --- Helper Functions for Spectris Grid ---
  const getRandomPieceKey = (): TetrominoKey => {
    pieceCounterRef.current += 1;
    // Wild Piece appears ~1 in every 9 pieces, or ~11% chance
    if (pieceCounterRef.current >= 8 && Math.random() < 0.28) {
      pieceCounterRef.current = 0;
      return 'W';
    }
    if (pieceCounterRef.current >= 11) {
      pieceCounterRef.current = 0;
      return 'W';
    }
    return STANDARD_KEYS[Math.floor(Math.random() * STANDARD_KEYS.length)];
  };

  const createPieceFromKey = (type: TetrominoKey) => {
    const def = TETROMINOES[type];
    return {
      type,
      matrix: def.shape.map((row) => [...row]),
      x: Math.floor((GRID_COLS - def.shape[0].length) / 2),
      y: 0,
      color: def.color,
      glow: def.glow,
      isWild: def.isWild,
    };
  };

  const createRandomPiece = (type?: TetrominoKey) => {
    const chosenType = type || getRandomPieceKey();
    if (chosenType === 'W') {
      gameAudio.playPowerupChime();
      addFloatingText('★ WILD PIECE SUMMONED! ★', canvasWidth / 2, 140, '#ffd700', 22);
    }
    return createPieceFromKey(chosenType);
  };

  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const result = Array.from({length: N}, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  const checkCollision = (
    matrix: number[][],
    offsetX: number,
    offsetY: number,
    grid: (string | null)[][]
  ): boolean => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const gx = offsetX + c;
          const gy = offsetY + r;
          if (gx < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) return true;
          if (gy >= 0 && grid[gy]?.[gx] !== null) return true;
        }
      }
    }
    return false;
  };

  const spawnParticles = (
    x: number,
    y: number,
    color: string,
    count = 12,
    shape: 'circle' | 'star' | 'shard' = 'circle'
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 40;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color === 'rainbow' ? `hsl(${Math.random() * 360}, 100%, 65%)` : color,
        size: Math.random() * 5 + 3,
        alpha: 1,
        decay: Math.random() * 1.5 + 0.8,
        shape,
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color = '#00f3ff', size = 24) => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      vy: -50,
      alpha: 1,
      color,
      size,
    });
  };

  // Spin progress helper to handle reduced/fractional rewards
  const grantBonusSpinProgress = (amount: number, reason?: string) => {
    spinMeterRef.current += amount;
    if (spinMeterRef.current >= 1.0) {
      const earned = Math.floor(spinMeterRef.current);
      spinMeterRef.current -= earned;
      bonusSpinsBankRef.current += earned;
      setBonusSpins(bonusSpinsBankRef.current);
      gameAudio.playPowerupChime();
      gameAudio.playCoinPickup();
      spawnParticles(canvasWidth / 2, canvasHeight / 2, '#ffd700', 30, 'star');
      addFloatingText(`🎰 +${earned} BONUS SPIN! 🎰`, canvasWidth / 2, 200, '#ffd700', 26);
    }
    setSpinMeterUi(Math.min(0.99, spinMeterRef.current));
  };

  // --- Quests System with Level Inflation Scaling (Rewards cut down by 60%) ---
  const generateQuestsForLevel = (level: number) => {
    const scoreTarget = Math.floor((1200 * Math.pow(level, 1.25)) / 100) * 100;
    const lineTarget = Math.min(8, 3 + Math.floor(level / 2));
    const tier2Options = [
      {
        id: 'spectris_double',
        title: 'Multi-Line Mastery',
        desc: 'Clear 2+ lines simultaneously',
        target: 1,
        rewardSpins: 1, // Scaled down from 2 by 60%
        rewardProgress: 0,
      },
      {
        id: 'skills_surge',
        title: 'Cosmic Tech Surge',
        desc: 'Activate 2 Skills this round',
        target: 2,
        rewardSpins: 1, // Scaled down from 2 by 60%
        rewardProgress: 0,
      },
      {
        id: 'quad_spectris',
        title: 'Quad Spectris Clears',
        desc: 'Achieve a 4-line Tetris clear',
        target: 1,
        rewardSpins: 1, // Scaled down from 2 by 60%
        rewardProgress: 0,
      },
    ];
    const pickedTier2 = tier2Options[(level - 1) % tier2Options.length];

    const newQuests: QuestItem[] = [
      {
        id: `score_target_${level}`,
        tier: 1,
        title: 'Astral Score Bounty',
        desc: `Score ${scoreTarget.toLocaleString()} pts this round`,
        current: 0,
        target: scoreTarget,
        rewardSpins: 0,
        rewardProgress: 0.4, // Scaled down by 60% (0.4 spin meter credit)
        completed: false,
      },
      {
        id: `lines_target_${level}`,
        tier: 1,
        title: 'Grid Resonance',
        desc: `Clear ${lineTarget} lines this round`,
        current: 0,
        target: lineTarget,
        rewardSpins: 0,
        rewardProgress: 0.4, // Scaled down by 60% (0.4 spin meter credit)
        completed: false,
      },
      {
        id: `${pickedTier2.id}_${level}`,
        tier: 2,
        title: pickedTier2.title,
        desc: pickedTier2.desc,
        current: 0,
        target: pickedTier2.target,
        rewardSpins: pickedTier2.rewardSpins,
        rewardProgress: 0,
        completed: false,
      },
    ];

    questsRef.current = newQuests;
    setQuests(newQuests);
    scoreInRoundRef.current = 0;
    linesInRoundRef.current = 0;
    skillsUsedInRoundRef.current = 0;
    doublePlusClearsInRoundRef.current = 0;
  };

  const updateQuestProgress = (type: 'score' | 'lines' | 'skill' | 'double_clear' | 'quad_clear', value = 1) => {
    let updated = false;
    const currentQ = questsRef.current.map((q) => {
      if (q.completed) return q;
      let newCurrent = q.current;

      if (type === 'score' && q.id.startsWith('score_target')) {
        newCurrent = Math.min(q.target, newCurrent + value);
      } else if (type === 'lines' && q.id.startsWith('lines_target')) {
        newCurrent = Math.min(q.target, newCurrent + value);
      } else if (type === 'skill' && q.id.startsWith('skills_surge')) {
        newCurrent = Math.min(q.target, newCurrent + value);
      } else if (type === 'double_clear' && q.id.startsWith('spectris_double')) {
        newCurrent = Math.min(q.target, newCurrent + value);
      } else if (type === 'quad_clear' && q.id.startsWith('quad_spectris')) {
        newCurrent = Math.min(q.target, newCurrent + value);
      }

      const justCompleted = newCurrent >= q.target && !q.completed;
      if (justCompleted) {
        updated = true;
        if (q.rewardSpins > 0) {
          bonusSpinsBankRef.current += q.rewardSpins;
          setBonusSpins(bonusSpinsBankRef.current);
          gameAudio.playPowerupChime();
          gameAudio.playCoinPickup();
          spawnParticles(canvasWidth / 2, canvasHeight / 2, '#ffd700', 30, 'star');
          addFloatingText(`✨ QUEST ACHIEVED! +${q.rewardSpins} SPIN ✨`, canvasWidth / 2, 200, '#ffd700', 26);
        } else if (q.rewardProgress) {
          grantBonusSpinProgress(q.rewardProgress, q.title);
          gameAudio.playCoinPickup();
          spawnParticles(canvasWidth / 2, canvasHeight / 2, '#00f3ff', 20, 'star');
          addFloatingText(`✨ QUEST ACHIEVED! +40% SPIN MTR ✨`, canvasWidth / 2, 200, '#00f3ff', 24);
        }
        return {...q, current: newCurrent, completed: true};
      }
      return {...q, current: newCurrent};
    });

    if (updated || currentQ.some((q, i) => q.current !== questsRef.current[i].current)) {
      questsRef.current = currentQ;
      setQuests(currentQ);
    }
  };

  // --- Phase Setup Helpers ---
  const setupBreakoutPhase = () => {
    const blocks: BreakoutBlock[] = [];
    const bCols = 10;
    const bRows = 5;
    const blockW = (canvasWidth - 420) / bCols;
    const blockH = 30;
    const startX = 210;
    const startY = 120;

    const colors = ['#7bf1e8', '#ff8fa3', '#fff07c', '#d18aff', '#7efcb0', '#8ea8ff', '#ffb088'];

    for (let r = 0; r < bRows; r++) {
      for (let c = 0; c < bCols; c++) {
        if (Math.random() > 0.12) {
          const colIndex = r % colors.length;
          blocks.push({
            row: r,
            col: c,
            x: startX + c * blockW + 4,
            y: startY + r * blockH + 4,
            w: blockW - 8,
            h: blockH - 8,
            color: colors[colIndex],
            glow: colors[colIndex],
            hp: 1,
          });
        }
      }
    }

    breakoutBlocksRef.current = blocks;
    breakoutOrbsRef.current = [];
    breakoutPaddleRef.current = {
      x: canvasWidth / 2 - 90,
      y: canvasHeight - 75,
      w: 180,
      h: 22,
    };
    breakoutShotsRemainingRef.current = 6;
    hasFiredFirstOrbRef.current = false;
    breakoutLaunchPromptAlphaRef.current = 1.0;
  };

  const launchBreakoutOrb = (targetX: number, targetY: number) => {
    if (breakoutShotsRemainingRef.current <= 0) return;
    const p = breakoutPaddleRef.current;
    const startX = p.x + p.w / 2;
    const startY = p.y - 14;

    const dx = targetX - startX;
    const dy = Math.min(-60, targetY - startY);
    const len = Math.hypot(dx, dy) || 1;
    const speed = getConfig('breakoutOrbSpeed') as number;

    breakoutOrbsRef.current.push({
      x: startX,
      y: startY,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      radius: 14,
      trail: [],
    });

    breakoutShotsRemainingRef.current -= 1;
    hasFiredFirstOrbRef.current = true;
    breakoutLaunchPromptAlphaRef.current = 0;
    gameAudio.playArcadeLaser();
    spawnParticles(startX, startY, '#00f3ff', 12);
  };

  // --- Slot Machine Bonus Round Setup ---
  const setupSlotMachinePhase = () => {
    const baseSpins = (getConfig('slotBaseSpins') as number) || 1;
    const totalSpins = baseSpins + bonusSpinsBankRef.current;
    setSlotSpinsRemaining(totalSpins);
    setSlotTotalWon(0);
    setIsSlotSpinning(false);
    setSlotLastWinMessage(null);
    setSlotCompleted(false);

    bonusSpinsBankRef.current = 0;
    spinMeterRef.current = 0;
    setBonusSpins(0);
    setSpinMeterUi(0);
  };

  const triggerSlotSpin = () => {
    if (isSlotSpinning || slotSpinsRemaining <= 0) return;

    setIsSlotSpinning(true);
    setSlotLastWinMessage(null);
    setSlotSpinsRemaining((prev) => prev - 1);
    gameAudio.playRetroJump();

    const pickRandomSymbolIndex = () => {
      const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
      let rand = Math.random() * totalWeight;
      for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
        if (rand < SLOT_SYMBOLS[i].weight) return i;
        rand -= SLOT_SYMBOLS[i].weight;
      }
      return Math.floor(Math.random() * SLOT_SYMBOLS.length);
    };

    slotReelsRef.current.forEach((reel, idx) => {
      reel.isSpinning = true;
      reel.spinSpeed = 16 + idx * 4;
      reel.targetIndex = pickRandomSymbolIndex();
      reel.stopTimer = 1.0 + idx * 0.6;
    });

    slotSpinDurationRef.current = 2.4;
  };

  const evaluateSlotOutcome = () => {
    const s1 = SLOT_SYMBOLS[slotReelsRef.current[0].currentIndex];
    const s2 = SLOT_SYMBOLS[slotReelsRef.current[1].currentIndex];
    const s3 = SLOT_SYMBOLS[slotReelsRef.current[2].currentIndex];

    const currentLevel = gameStateRef.current.level;
    let winPoints = 0;
    let winLabel = '';

    if (s1.key === s2.key && s2.key === s3.key) {
      const basePay = s1.payout3;
      winPoints = basePay * currentLevel;
      winLabel = `🎉 3X ${s1.name.toUpperCase()} JACKPOT! +${winPoints.toLocaleString()} PTS 🎉`;
      gameAudio.playVictoryFanfare();
      gameAudio.playGeneralWin();
      shakeRef.current = 15;
      spawnParticles(canvasWidth / 2, canvasHeight / 2 - 50, s1.color, 45, 'star');
    } else if (s1.key === s2.key || s2.key === s3.key || s1.key === s3.key) {
      const matchedSymbol = s1.key === s2.key ? s1 : s3;
      winPoints = 400 * currentLevel;
      winLabel = `✨ DOUBLE MATCH! +${winPoints.toLocaleString()} PTS ✨`;
      gameAudio.playPowerupChime();
      gameAudio.playCoinPickup();
      spawnParticles(canvasWidth / 2, canvasHeight / 2 - 50, matchedSymbol.color, 20, 'shard');
    } else if (s1.key === 'star' || s2.key === 'star' || s3.key === 'star') {
      winPoints = 250 * currentLevel;
      winLabel = `⭐ COSMIC STAR BLESSING! +${winPoints.toLocaleString()} PTS ⭐`;
      gameAudio.playCoinPickup();
      spawnParticles(canvasWidth / 2, canvasHeight / 2 - 50, '#00f3ff', 15, 'star');
    } else {
      winLabel = 'No match this spin - Try again!';
      gameAudio.playShieldBlock();
    }

    if (winPoints > 0) {
      setSlotTotalWon((prev) => prev + winPoints);
      setGameState((prev) => ({...prev, score: prev.score + winPoints}));
      addFloatingText(`+${winPoints.toLocaleString()}`, canvasWidth / 2, canvasHeight / 2 - 60, '#ffd700', 32);
    }

    setSlotLastWinMessage(winLabel);
    setIsSlotSpinning(false);
  };

  const announcePhase = (title: string) => {
    setPhaseAnnounce(title);
    setTimeout(() => {
      setPhaseAnnounce(null);
    }, 2500);
  };

  const startNextPhase = (newPhase: AstralPhase, customLevel?: number) => {
    const nextLevel = customLevel !== undefined ? customLevel : gameStateRef.current.level;
    setGameState((prev) => ({...prev, phase: newPhase, level: nextLevel}));
    gameStateRef.current = {...gameStateRef.current, phase: newPhase, level: nextLevel};

    if (newPhase === 'GRID') {
      setCurrentBgmUrl('audio/bgm_main_theme.mp3');
      linesInRoundRef.current = 0;
      generateQuestsForLevel(nextLevel);
      announcePhase(`ASTRAL REALM ${nextLevel}`);
      gameAudio.playLevelUpStinger();
    } else if (newPhase === 'BREAKOUT') {
      setCurrentBgmUrl('audio/bgm_bonus_rush.mp3');
      setupBreakoutPhase();
      announcePhase('🔮 MILESTONE: SPECTRIS BREAKOUT 🔮');
      gameAudio.playConfirmSelect();
    } else if (newPhase === 'SLOT_MACHINE') {
      setCurrentBgmUrl('audio/bgm_god_mode.mp3');
      setupSlotMachinePhase();
      announcePhase('🎰 CELESTIAL SLOT MACHINE BONUS 🎰');
      gameAudio.playLevelUpStinger();
      gameAudio.playPowerupChime();
    }
  };

  // --- Skills Implementation ---
  const isGridPhaseActive = () => gameStateRef.current.phase === 'GRID';

  const triggerSkillBomb = () => {
    if (skillEnergyRef.current < 35 || !isGridPhaseActive()) {
      gameAudio.playErrorBuzz();
      return;
    }
    skillEnergyRef.current -= 35;
    setSkillEnergy(skillEnergyRef.current);
    skillsUsedInRoundRef.current += 1;
    updateQuestProgress('skill', 1);
    gameAudio.playChiptuneExplosion();
    shakeRef.current = 18;

    const p = activePieceRef.current;
    const targetGx = p ? Math.max(1, Math.min(GRID_COLS - 2, p.x + 1)) : 5;
    const targetGy = p ? Math.max(1, Math.min(GRID_ROWS - 2, p.y + 2)) : 17;

    const cellW = 32;
    const startX = (canvasWidth - GRID_COLS * cellW) / 2;
    const startY = 70;

    for (let r = targetGy - 1; r <= targetGy + 1; r++) {
      for (let c = targetGx - 1; c <= targetGx + 1; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          if (gridRef.current[r][c]) {
            gridRef.current[r][c] = null;
            spawnParticles(startX + c * cellW + 16, startY + r * cellW + 16, '#ff0055', 8);
          }
        }
      }
    }

    const pts = 450 * gameStateRef.current.level;
    setGameState((prev) => ({...prev, score: prev.score + pts}));
    updateQuestProgress('score', pts);
    addFloatingText(`BOMB NOVA +${pts}`, canvasWidth / 2, canvasHeight / 2, '#ffaa00', 28);
  };

  const triggerSkillLaser = () => {
    if (skillEnergyRef.current < 45 || !isGridPhaseActive()) {
      gameAudio.playErrorBuzz();
      return;
    }
    skillEnergyRef.current -= 45;
    setSkillEnergy(skillEnergyRef.current);
    skillsUsedInRoundRef.current += 1;
    updateQuestProgress('skill', 1);
    gameAudio.playArcadeLaser();
    shakeRef.current = 14;

    const r1 = GRID_ROWS - 1;
    const r2 = GRID_ROWS - 2;
    gridRef.current[r1] = Array(GRID_COLS).fill(null);
    gridRef.current[r2] = Array(GRID_COLS).fill(null);

    laserBeamTimerRef.current = {row1: r1, row2: r2, timer: 0.35};
    const pts = 800 * gameStateRef.current.level;
    setGameState((prev) => ({...prev, score: prev.score + pts}));
    updateQuestProgress('score', pts);
    addFloatingText(`VAPORIZER LASER +${pts}`, canvasWidth / 2, canvasHeight / 2, '#00f3ff', 28);
  };

  const triggerSkillFreeze = () => {
    if (skillEnergyRef.current < 30 || !isGridPhaseActive()) {
      gameAudio.playErrorBuzz();
      return;
    }
    skillEnergyRef.current -= 30;
    setSkillEnergy(skillEnergyRef.current);
    skillsUsedInRoundRef.current += 1;
    updateQuestProgress('skill', 1);
    freezeTimerRef.current = 8.0;
    gameAudio.playShieldBlock();
    addFloatingText('CHRONO FREEZE 8s', canvasWidth / 2, canvasHeight / 2, '#88ddff', 28);
  };

  // --- HOLD / SWAP PIECE MECHANIC ---
  const swapHoldPiece = () => {
    if (gameStateRef.current.status !== 'PLAYING' || !isGridPhaseActive()) return;
    if (!canHoldRef.current) {
      gameAudio.playErrorBuzz();
      addFloatingText('HOLD LOCKED (1x PER DROP)', canvasWidth / 2, 280, '#ff0055', 18);
      return;
    }

    const currentP = activePieceRef.current;
    if (!currentP) return;

    gameAudio.playConfirmSelect();
    const prevHold = holdPieceRef.current;
    holdPieceRef.current = currentP.type;
    setHeldPieceKey(currentP.type);

    if (prevHold === null) {
      activePieceRef.current = createRandomPiece(nextPieceRef.current);
      nextPieceRef.current = getRandomPieceKey();
    } else {
      activePieceRef.current = createPieceFromKey(prevHold);
    }

    canHoldRef.current = false;
    setCanHoldUi(false);
    dropTimerRef.current = 0;
    lockDelayTimerRef.current = 0;
    isGroundedRef.current = false;
    lockResetsRef.current = 0;

    // Sparkle VFX at Hold Panel
    const cellW = 32;
    const startX = (canvasWidth - GRID_COLS * cellW) / 2;
    spawnParticles(startX - 100, 140, '#00f3ff', 16, 'star');
    addFloatingText('HOLD SWAPPED', startX - 100, 110, '#00f3ff', 18);
  };

  // --- Initializer ---
  const initGame = useCallback(() => {
    gridRef.current = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(null));
    pieceCounterRef.current = 0;
    activePieceRef.current = createRandomPiece();
    nextPieceRef.current = getRandomPieceKey();
    holdPieceRef.current = null;
    canHoldRef.current = true;
    setHeldPieceKey(null);
    setCanHoldUi(true);

    craneXRef.current = canvasWidth / 2;
    craneTargetXRef.current = canvasWidth / 2;
    craneSwayRef.current = 0;
    activeMoveDirRef.current = 0;
    dasTimerRef.current = 0;
    arrTimerRef.current = 0;
    touchLeftRef.current = false;
    touchRightRef.current = false;
    touchDownRef.current = false;

    dropTimerRef.current = 0;
    dropLockoutTimerRef.current = 0.15;
    freezeTimerRef.current = 0;
    lockDelayTimerRef.current = 0;
    isGroundedRef.current = false;
    lockResetsRef.current = 0;
    linesInRoundRef.current = 0;
    scoreInRoundRef.current = 0;
    bonusSpinsBankRef.current = 0;
    spinMeterRef.current = 0;
    setBonusSpins(0);
    setSpinMeterUi(0);
    roundLinesTargetRef.current = getConfig('linesPerRound') as number;
    skillEnergyRef.current = 50;
    setSkillEnergy(50);
    setHasSubmittedScore(false);
    setLeaderboardStatus('');

    particlesRef.current = [];
    floatingTextsRef.current = [];
    laserBeamTimerRef.current = null;

    generateQuestsForLevel(1);

    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      linesCleared: 0,
      phase: 'GRID',
    });

    setCurrentBgmUrl('audio/bgm_main_theme.mp3');
    setIsGameMenuOpen(false);
    setIsHowToPlayOpen(false);
    announcePhase('ASTRAL REALM 1: SPECTRAL GARDEN');
    gameAudio.playConfirmSelect();

    if (sdk) {
      sdk.startGame();
    }
  }, [canvasWidth, sdk]);

  // Hook for lifecycle & score updates
  usePlaygroundGameLifecycle(gameState, sdk);

  // Auto-start when ?autoplay is present
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // --- Lock Piece & Clear Lines (With Wild Piece Gap Filler Expansion) ---
  const lockActivePiece = () => {
    const p = activePieceRef.current;
    if (!p) return;

    gameAudio.playMeleePunch();
    shakeRef.current = 5;

    const cellW = 32;
    const startX = (canvasWidth - GRID_COLS * cellW) / 2;
    const startY = 70;
    const isWild = p.isWild || p.type === 'W';

    // Track occupied rows
    const occupiedRows = new Set<number>();

    for (let r = 0; r < p.matrix.length; r++) {
      for (let c = 0; c < p.matrix[r].length; c++) {
        if (p.matrix[r][c]) {
          const gx = p.x + c;
          const gy = p.y + r;
          if (gy >= 0 && gy < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
            gridRef.current[gy][gx] = p.color;
            occupiedRows.add(gy);
            spawnParticles(
              startX + gx * cellW + 16,
              startY + gy * cellW + 16,
              p.color,
              isWild ? 8 : 4,
              isWild ? 'star' : 'circle'
            );
          }
        }
      }
    }

    // WILD PIECE "FIT ANY" MECHANIC:
    // If a Wild piece lands, its omni-blocks expand across all holes in intersected rows to guarantee line completes!
    if (isWild) {
      gameAudio.playLevelUpStinger();
      shakeRef.current = 14;
      occupiedRows.forEach((gy) => {
        let filledCount = 0;
        for (let gx = 0; gx < GRID_COLS; gx++) {
          if (gridRef.current[gy][gx] === null) {
            gridRef.current[gy][gx] = 'rainbow';
            filledCount++;
            spawnParticles(startX + gx * cellW + 16, startY + gy * cellW + 16, 'rainbow', 6, 'star');
          }
        }
        if (filledCount > 0) {
          addFloatingText('★ GAP FILLED! ★', startX + (GRID_COLS * cellW) / 2, startY + gy * cellW, '#ffd700', 20);
        }
      });
      addFloatingText('★ PRISMATIC WILD RESONANCE! ★', canvasWidth / 2, startY + p.y * cellW - 10, '#ffd700', 26);
    }

    // Check full lines
    let clearedCount = 0;
    const newGrid: (string | null)[][] = [];
    const cosmicPastelPalette = [
      '#7bf1e8',
      '#fff07c',
      '#d18aff',
      '#7efcb0',
      '#ff8fa3',
      '#8ea8ff',
      '#ffb088',
      '#ffffff',
    ];

    for (let r = 0; r < GRID_ROWS; r++) {
      if (gridRef.current[r].every((cell) => cell !== null)) {
        clearedCount++;
        for (let c = 0; c < GRID_COLS; c++) {
          const burstColor = cosmicPastelPalette[(c + r) % cosmicPastelPalette.length];
          spawnParticles(
            startX + c * cellW + 16,
            startY + r * cellW + 16,
            burstColor,
            14,
            'shard'
          );
          spawnParticles(
            startX + c * cellW + 16,
            startY + r * cellW + 16,
            '#ffffff',
            4,
            'star'
          );
        }
      } else {
        newGrid.push([...gridRef.current[r]]);
      }
    }

    while (newGrid.length < GRID_ROWS) {
      newGrid.unshift(Array(GRID_COLS).fill(null));
    }
    gridRef.current = newGrid;

    if (clearedCount > 0) {
      const scoreTable = [0, 100, 300, 700, 1500];
      const wildBonus = isWild ? 350 * clearedCount : 0;
      const baseScore = ((scoreTable[clearedCount] || 100) + wildBonus) * gameStateRef.current.level;
      const energyGain = clearedCount * 25;

      skillEnergyRef.current = Math.min(100, skillEnergyRef.current + energyGain);
      setSkillEnergy(skillEnergyRef.current);
      linesInRoundRef.current += clearedCount;
      scoreInRoundRef.current += baseScore;

      setGameState((prev) => ({
        ...prev,
        score: prev.score + baseScore,
        linesCleared: (prev.linesCleared || 0) + clearedCount,
      }));

      // Update Quests
      updateQuestProgress('lines', clearedCount);
      updateQuestProgress('score', baseScore);
      if (clearedCount >= 2) {
        doublePlusClearsInRoundRef.current += 1;
        updateQuestProgress('double_clear', 1);
      }
      if (clearedCount === 4) {
        updateQuestProgress('quad_clear', 1);
        grantBonusSpinProgress(0.4, 'QUAD SPECTRIS');
      }

      gameAudio.playCoinPickup();
      const labels = ['', 'SINGLE CLEAR', 'DOUBLE CLEAR', 'TRIPLE CLEAR', '⚡ QUAD SPECTRIS ⚡'];
      addFloatingText(
        `${isWild ? '★ WILD ' : ''}${labels[clearedCount]} +${baseScore}`,
        canvasWidth / 2,
        startY + (p.y * cellW),
        clearedCount === 4 || isWild ? '#ffd700' : '#00f3ff',
        clearedCount === 4 || isWild ? 30 : 24
      );

      // Check Round Completion -> Breakout every 5 rounds (Round 5, 10, 15...), otherwise advance Realm
      if (linesInRoundRef.current >= roundLinesTargetRef.current) {
        grantBonusSpinProgress(0.4, 'ROUND CLEAR');
        if (gameStateRef.current.level % 5 === 0) {
          startNextPhase('BREAKOUT');
          return;
        } else {
          // Normal Round Complete -> Advance to next level directly
          const nextLvl = gameStateRef.current.level + 1;
          gameAudio.playVictoryFanfare();
          spawnParticles(canvasWidth / 2, canvasHeight / 2, '#00ff88', 35, 'star');
          addFloatingText(`✨ ROUND ${gameStateRef.current.level} CLEARED! ✨`, canvasWidth / 2, 170, '#00ff88', 26);
          startNextPhase('GRID', nextLvl);
          return;
        }
      }
    }

    // Reset lock delay & UNLOCK HOLD for the new piece
    isGroundedRef.current = false;
    lockDelayTimerRef.current = 0;
    lockResetsRef.current = 0;
    dropLockoutTimerRef.current = 0.1;
    canHoldRef.current = true;
    setCanHoldUi(true);

    // Check Loss condition: top rows occupied
    if (gridRef.current[0].some((c) => c !== null) || gridRef.current[1].some((c) => c !== null)) {
      setGameState((prev) => ({...prev, status: 'GAME_OVER'}));
      gameAudio.playDefeatMotif();
      return;
    }

    // Next piece
    activePieceRef.current = createRandomPiece(nextPieceRef.current);
    nextPieceRef.current = getRandomPieceKey();

    // Instant collision check on spawn
    if (
      checkCollision(
        activePieceRef.current.matrix,
        activePieceRef.current.x,
        activePieceRef.current.y,
        gridRef.current
      )
    ) {
      setGameState((prev) => ({...prev, status: 'GAME_OVER'}));
      gameAudio.playDefeatMotif();
    }
  };

  const hardDropPiece = () => {
    if (!isGridPhaseActive()) return;
    if (dropLockoutTimerRef.current > 0) return;
    const p = activePieceRef.current;
    if (!p) return;

    dropLockoutTimerRef.current = 0.12;
    let dropY = p.y;
    while (!checkCollision(p.matrix, p.x, dropY + 1, gridRef.current)) {
      dropY++;
    }
    const dropDist = dropY - p.y;
    p.y = dropY;
    const addedScore = dropDist * 4;
    setGameState((prev) => ({...prev, score: prev.score + addedScore}));
    updateQuestProgress('score', addedScore);
    lockActivePiece();
  };

  const movePiece = (dx: number) => {
    const p = activePieceRef.current;
    if (!p) return;

    if (!checkCollision(p.matrix, p.x + dx, p.y, gridRef.current)) {
      p.x += dx;
      craneSwayRef.current = dx * 12;
      gameAudio.playCrispClick();

      // Lateral tuck-in / landing slide window check
      const groundedNow = checkCollision(p.matrix, p.x, p.y + 1, gridRef.current);
      if (isGroundedRef.current || groundedNow) {
        if (lockResetsRef.current < 12) {
          lockDelayTimerRef.current = 0.45;
          lockResetsRef.current += 1;
        }
        isGroundedRef.current = groundedNow;

        const cellW = 32;
        const startX = (canvasWidth - GRID_COLS * cellW) / 2;
        const startY = 70;
        spawnParticles(
          startX + (p.x + p.matrix[0].length / 2) * cellW,
          startY + (p.y + p.matrix.length) * cellW,
          '#00f3ff',
          6,
          'shard'
        );
      }
    }
  };

  const rotateActivePiece = () => {
    const p = activePieceRef.current;
    if (!p) return;
    const rotated = rotateMatrix(p.matrix);
    let rotatedSuccess = false;

    // Wall kick attempts
    if (!checkCollision(rotated, p.x, p.y, gridRef.current)) {
      p.matrix = rotated;
      rotatedSuccess = true;
    } else if (!checkCollision(rotated, p.x - 1, p.y, gridRef.current)) {
      p.matrix = rotated;
      p.x -= 1;
      rotatedSuccess = true;
    } else if (!checkCollision(rotated, p.x + 1, p.y, gridRef.current)) {
      p.matrix = rotated;
      p.x += 1;
      rotatedSuccess = true;
    } else if (!checkCollision(rotated, p.x, p.y - 1, gridRef.current)) {
      p.matrix = rotated;
      p.y -= 1;
      rotatedSuccess = true;
    }

    if (rotatedSuccess) {
      gameAudio.playRetroJump();
      const groundedNow = checkCollision(p.matrix, p.x, p.y + 1, gridRef.current);
      if (isGroundedRef.current || groundedNow) {
        if (lockResetsRef.current < 12) {
          lockDelayTimerRef.current = 0.45;
          lockResetsRef.current += 1;
        }
        isGroundedRef.current = groundedNow;
      }
    }
  };

  // --- Main 60 FPS Update Function ---
  const update = (dt: number) => {
    if (gameStateRef.current.status !== 'PLAYING' || isGameMenuOpen) return;

    // Decay Screen Shake
    if (shakeRef.current > 0) {
      shakeRef.current = Math.max(0, shakeRef.current - dt * 25);
    }

    // Laser Beam VFX timer
    if (laserBeamTimerRef.current) {
      laserBeamTimerRef.current.timer -= dt;
      if (laserBeamTimerRef.current.timer <= 0) {
        laserBeamTimerRef.current = null;
      }
    }

    // Update Starfield
    bgStarfieldRef.current.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > canvasHeight) {
        star.y = -5;
        star.x = Math.random() * canvasWidth;
      }
    });

    // Update Particles
    particlesRef.current = particlesRef.current.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= pt.decay * dt;
      return pt.alpha > 0;
    });

    // Update Floating Texts
    floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.7;
      return ft.alpha > 0;
    });

    // Sub-Phase Updates
    const phase = gameStateRef.current.phase;

    // Drop lockout debounce decay
    if (dropLockoutTimerRef.current > 0) {
      dropLockoutTimerRef.current = Math.max(0, dropLockoutTimerRef.current - dt);
    }

    // Input actions from keyboard / pointer
    const input = inputRef.current;
    const leftDown = input.actions.left || touchLeftRef.current;
    const rightDown = input.actions.right || touchRightRef.current;
    const upDown = input.actions.up;
    const downDown = input.actions.down || touchDownRef.current;
    const confirmDown = input.actions.confirm;
    const holdDown = input.actions.hold;
    const skillBombDown = input.actions.skillBomb;
    const skillLaserDown = input.actions.skillLaser;
    const skillFreezeDown = input.actions.skillFreeze;

    if (skillBombDown && !skillBombEdgeRef.current && phase === 'GRID') {
      triggerSkillBomb();
    }
    skillBombEdgeRef.current = skillBombDown;

    if (skillLaserDown && !skillLaserEdgeRef.current && phase === 'GRID') {
      triggerSkillLaser();
    }
    skillLaserEdgeRef.current = skillLaserDown;

    if (skillFreezeDown && !skillFreezeEdgeRef.current && phase === 'GRID') {
      triggerSkillFreeze();
    }
    skillFreezeEdgeRef.current = skillFreezeDown;

    // Hold Piece Trigger (C / Shift)
    if (holdDown && !holdEdgeRef.current) {
      holdEdgeRef.current = true;
      if (phase === 'GRID') {
        swapHoldPiece();
      }
    } else if (!holdDown) {
      holdEdgeRef.current = false;
    }

    // Edge detections: Rotation (Up)
    if (upDown && !upEdgeRef.current) {
      if (phase === 'GRID') {
        rotateActivePiece();
      }
    }
    upEdgeRef.current = upDown;
    downEdgeRef.current = downDown;

    // Strict One-Shot Hard Drop or Breakout Launch / Slot Spin (Space / Enter)
    if (confirmDown && !spaceEdgeRef.current) {
      spaceEdgeRef.current = true;
      if (phase === 'GRID') {
        hardDropPiece();
      } else if (phase === 'BREAKOUT') {
        const p = breakoutPaddleRef.current;
        launchBreakoutOrb(p.x + p.w / 2, p.y - 200);
      } else if (phase === 'SLOT_MACHINE') {
        if (!isSlotSpinning && slotSpinsRemaining > 0) {
          triggerSlotSpin();
        }
      }
    } else if (!confirmDown) {
      spaceEdgeRef.current = false;
    }

    // Delayed Auto Shift (DAS) & Auto-Repeat Rate (ARR) for GRID phase
    if (phase === 'GRID') {
      // Check click / tap on Hold Box on Canvas directly
      if (input.pointer.down && input.actions.tap) {
        const cellW = 32;
        const startX = (canvasWidth - GRID_COLS * cellW) / 2;
        const holdBoxX = startX - 160;
        const holdBoxY = 70;
        const holdBoxW = 140;
        const holdBoxH = 135;

        if (
          input.pointer.x >= holdBoxX &&
          input.pointer.x <= holdBoxX + holdBoxW &&
          input.pointer.y >= holdBoxY &&
          input.pointer.y <= holdBoxY + holdBoxH
        ) {
          swapHoldPiece();
        }
      }

      let desiredDir: -1 | 0 | 1 = 0;
      if (leftDown && !rightDown) desiredDir = -1;
      else if (rightDown && !leftDown) desiredDir = 1;

      if (desiredDir !== activeMoveDirRef.current) {
        activeMoveDirRef.current = desiredDir;
        if (desiredDir !== 0) {
          movePiece(desiredDir);
          dasTimerRef.current = (getConfig('dasDelay') as number) || 0.17;
          arrTimerRef.current = 0;
        }
      } else if (desiredDir !== 0) {
        if (dasTimerRef.current > 0) {
          dasTimerRef.current -= dt;
        } else {
          arrTimerRef.current += dt;
          const arrInterval = (getConfig('arrInterval') as number) || 0.045;
          while (arrTimerRef.current >= arrInterval) {
            arrTimerRef.current -= arrInterval;
            movePiece(desiredDir);
          }
        }
      }

      const cellW = 32;
      const startX = (canvasWidth - GRID_COLS * cellW) / 2;
      const startY = 70;
      const p = activePieceRef.current;

      // Trailing stardust micro-glints & cosmic aura around active falling piece
      if (p && Math.random() < 0.42) {
        const isWild = p.isWild || p.type === 'W';
        const pCol = isWild ? 'rainbow' : p.color;
        const pbx = startX + (p.x + Math.random() * p.matrix[0].length) * cellW;
        const pby = startY + (p.y + Math.random() * p.matrix.length) * cellW;
        particlesRef.current.push({
          x: pbx,
          y: pby,
          vx: (Math.random() - 0.5) * 20,
          vy: -(Math.random() * 25 + 10),
          color: pCol === 'rainbow' ? `hsl(${Math.random() * 360}, 90%, 82%)` : pCol,
          size: Math.random() * 3.2 + 1.2,
          alpha: 0.9,
          decay: 1.4,
          shape: Math.random() < 0.5 ? 'star' : 'circle',
        });
      }

      if (p) {
        craneTargetXRef.current = startX + (p.x + p.matrix[0].length / 2) * cellW;
      }
      craneXRef.current += (craneTargetXRef.current - craneXRef.current) * Math.min(1, dt * 14);
      craneSwayRef.current *= Math.max(0, 1 - dt * 6);

      // Freeze Timer
      if (freezeTimerRef.current > 0) {
        freezeTimerRef.current = Math.max(0, freezeTimerRef.current - dt);
      }

      // Landing Slide / Lock Delay Gravity Tick
      if (p) {
        const touchingGround = checkCollision(p.matrix, p.x, p.y + 1, gridRef.current);
        if (touchingGround) {
          if (!isGroundedRef.current) {
            isGroundedRef.current = true;
            lockDelayTimerRef.current = 0.45;
            lockResetsRef.current = 0;
          }

          lockDelayTimerRef.current -= dt;
          if (lockDelayTimerRef.current <= 0) {
            if (checkCollision(p.matrix, p.x, p.y + 1, gridRef.current)) {
              lockActivePiece();
            } else {
              isGroundedRef.current = false;
            }
          }
        } else {
          isGroundedRef.current = false;
          const baseDropInterval = (getConfig('dropIntervalStart') as number) / (1 + (gameStateRef.current.level - 1) * 0.15);
          const isSoftDrop = downDown;
          const currentDropSpeed = freezeTimerRef.current > 0
            ? 999
            : isSoftDrop
            ? baseDropInterval / (getConfig('softDropMultiplier') as number)
            : baseDropInterval;

          dropTimerRef.current += dt;
          if (dropTimerRef.current >= currentDropSpeed) {
            dropTimerRef.current = 0;
            if (!checkCollision(p.matrix, p.x, p.y + 1, gridRef.current)) {
              p.y += 1;
              if (isSoftDrop) {
                setGameState((prev) => ({...prev, score: prev.score + 1}));
              }
              if (checkCollision(p.matrix, p.x, p.y + 1, gridRef.current)) {
                isGroundedRef.current = true;
                lockDelayTimerRef.current = 0.45;
              }
            } else {
              isGroundedRef.current = true;
              lockDelayTimerRef.current = 0.45;
            }
          }
        }
      }
    } else if (phase === 'BREAKOUT') {
      const p = breakoutPaddleRef.current;
      const paddleSpeed = 540;
      if (leftDown) p.x = Math.max(80, p.x - paddleSpeed * dt);
      if (rightDown) p.x = Math.min(canvasWidth - p.w - 80, p.x + paddleSpeed * dt);

      // Mouse drag paddle support
      if (input.pointer.down) {
        p.x = Math.max(80, Math.min(canvasWidth - p.w - 80, input.pointer.x - p.w / 2));
      }

      // Pointer tap to launch orb
      if (input.pointer.down && input.actions.tap) {
        launchBreakoutOrb(input.pointer.x, input.pointer.y);
      }

      // Update Orbs
      breakoutOrbsRef.current.forEach((orb) => {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.trail.push({x: orb.x, y: orb.y, alpha: 1});
        if (orb.trail.length > 8) orb.trail.shift();
        orb.trail.forEach((t) => (t.alpha -= dt * 3));

        // Wall collisions
        if (orb.x - orb.radius < 60) {
          orb.x = 60 + orb.radius;
          orb.vx = Math.abs(orb.vx);
          gameAudio.playShieldBlock();
        } else if (orb.x + orb.radius > canvasWidth - 60) {
          orb.x = canvasWidth - 60 - orb.radius;
          orb.vx = -Math.abs(orb.vx);
          gameAudio.playShieldBlock();
        }

        if (orb.y - orb.radius < 50) {
          orb.y = 50 + orb.radius;
          orb.vy = Math.abs(orb.vy);
          gameAudio.playShieldBlock();
        }

        // Paddle Collision
        if (
          orb.y + orb.radius >= p.y &&
          orb.y - orb.radius <= p.y + p.h &&
          orb.x >= p.x &&
          orb.x <= p.x + p.w
        ) {
          orb.y = p.y - orb.radius;
          const hitOffset = (orb.x - (p.x + p.w / 2)) / (p.w / 2);
          const currentSpeed = Math.hypot(orb.vx, orb.vy);
          const newAngle = -Math.PI / 2 + hitOffset * 0.85;
          orb.vx = Math.cos(newAngle) * currentSpeed;
          orb.vy = Math.sin(newAngle) * currentSpeed;
          gameAudio.playRetroJump();
          spawnParticles(orb.x, orb.y, '#00f3ff', 8);
        }

        // Block Collisions
        breakoutBlocksRef.current.forEach((blk) => {
          if (blk.hp > 0) {
            if (
              orb.x + orb.radius > blk.x &&
              orb.x - orb.radius < blk.x + blk.w &&
              orb.y + orb.radius > blk.y &&
              orb.y - orb.radius < blk.y + blk.h
            ) {
              blk.hp -= 1;
              orb.vy = -orb.vy;
              gameAudio.playCoinPickup();
              spawnParticles(blk.x + blk.w / 2, blk.y + blk.h / 2, blk.color, 12);
              const pts = 300 * gameStateRef.current.level;
              setGameState((prev) => ({...prev, score: prev.score + pts}));
              addFloatingText(`+${pts}`, blk.x + blk.w / 2, blk.y, blk.color, 22);
            }
          }
        });
      });

      // Remove Dead Blocks & Out-of-bounds Orbs
      breakoutBlocksRef.current = breakoutBlocksRef.current.filter((b) => b.hp > 0);
      breakoutOrbsRef.current = breakoutOrbsRef.current.filter((o) => o.y < canvasHeight + 50);

      // Check Completion of Breakout Phase -> Proceed to 5th Round Slot Machine
      const allCleared = breakoutBlocksRef.current.length === 0;
      const noShotsLeft = breakoutShotsRemainingRef.current <= 0 && breakoutOrbsRef.current.length === 0;

      if (allCleared || noShotsLeft) {
        if (allCleared) {
          // Breakout clear bonus (scaled down by 60% -> +1 bonus spin)
          bonusSpinsBankRef.current += 1;
          setBonusSpins(bonusSpinsBankRef.current);
          addFloatingText('★ BREAKOUT CLEARED! +1 BONUS SPIN ★', canvasWidth / 2, canvasHeight / 2 - 40, '#ffd700', 26);
        }
        startNextPhase('SLOT_MACHINE');
      }
    } else if (phase === 'SLOT_MACHINE') {
      if (isSlotSpinning) {
        let allStopped = true;
        slotReelsRef.current.forEach((reel, idx) => {
          if (reel.isSpinning) {
            reel.stopTimer -= dt;
            reel.currentIndex = (reel.currentIndex + reel.spinSpeed * dt) % SLOT_SYMBOLS.length;

            if (reel.stopTimer <= 0) {
              reel.isSpinning = false;
              reel.currentIndex = reel.targetIndex;
              gameAudio.playShieldBlock();
              spawnParticles(
                canvasWidth / 2 - 200 + idx * 200,
                canvasHeight / 2,
                '#ffd700',
                12,
                'star'
              );
            } else {
              allStopped = false;
            }
          }
        });

        if (allStopped) {
          evaluateSlotOutcome();
        }
      }
    }
  };

  // Helper to draw a single block with Cosmic Pastel shimmering gradients and celestial effects
  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    bw: number,
    color: string,
    isWild: boolean = false,
    options: {
      isGhost?: boolean;
      isActive?: boolean;
      isQueueOrHold?: boolean;
      timeOffset?: number;
    } = {}
  ) => {
    const time = (performance.now() * 0.0025) + (options.timeOffset || 0);

    if (isWild || color === 'rainbow') {
      // Animated Iridescent Pastel Rainbow Prism
      const hueShift = (time * 65 + bx * 3 + by * 3) % 360;
      const c1 = `hsl(${hueShift}, 85%, 76%)`;
      const c2 = `hsl(${(hueShift + 60) % 360}, 90%, 82%)`;
      const c3 = `hsl(${(hueShift + 120) % 360}, 95%, 88%)`;

      ctx.save();
      const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bw);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);

      ctx.fillStyle = grad;
      ctx.shadowColor = c1;
      ctx.shadowBlur = options.isActive ? 16 : 10;
      ctx.fillRect(bx + 1, by + 1, bw - 2, bw - 2);

      // Crystalline inner border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 2, by + 2, bw - 4, bw - 4);

      // Iridescent gloss sweep overlay
      const sweepOffset = (Math.sin(time * 2 + bx * 0.1) + 1) * 0.5;
      const glossGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bw);
      glossGrad.addColorStop(Math.max(0, sweepOffset - 0.2), 'rgba(255, 255, 255, 0.05)');
      glossGrad.addColorStop(sweepOffset, 'rgba(255, 255, 255, 0.75)');
      glossGrad.addColorStop(Math.min(1, sweepOffset + 0.2), 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = glossGrad;
      ctx.fillRect(bx + 2, by + 2, bw - 4, bw - 4);

      // Rotating Star Sparkle in Center
      ctx.save();
      ctx.translate(bx + bw / 2, by + bw / 2);
      ctx.rotate(time * 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.font = `bold ${Math.floor(bw * 0.58)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
      ctx.restore();

      ctx.restore();
    } else {
      // Cosmic Pastel Palette Shimmer & Crystalline Core
      const pastelMeta = PASTEL_COLOR_MAP[color] || {
        highlight: '#ffffff',
        accent: '#ffffff',
        glow: color,
      };

      ctx.save();

      // Shimmering Linear Gradient across block
      const shimmerAngle = (Math.sin(time * 1.8 + (bx + by) * 0.08) * 0.2);
      const grad = ctx.createLinearGradient(
        bx,
        by + shimmerAngle * bw,
        bx + bw,
        by + bw - shimmerAngle * bw
      );
      grad.addColorStop(0, pastelMeta.highlight);
      grad.addColorStop(0.45, color);
      grad.addColorStop(1, pastelMeta.glow.replace('0.7', '0.9') || color);

      ctx.fillStyle = grad;
      ctx.shadowColor = options.isActive ? pastelMeta.highlight : pastelMeta.glow;
      ctx.shadowBlur = options.isActive ? 14 : 8;
      ctx.fillRect(bx + 1, by + 1, bw - 2, bw - 2);

      // Soft pulsating inner starlight gleam
      const pulse = (Math.sin(time * 3 + (bx * 0.15 + by * 0.15)) + 1) * 0.5;
      const innerGlow = ctx.createRadialGradient(
        bx + bw * 0.35,
        by + bw * 0.35,
        1,
        bx + bw * 0.5,
        by + bw * 0.5,
        bw * 0.65
      );
      innerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.45 + pulse * 0.35})`);
      innerGlow.addColorStop(0.6, `rgba(255, 255, 255, ${0.1 + pulse * 0.15})`);
      innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = innerGlow;
      ctx.fillRect(bx + 2, by + 2, bw - 4, bw - 4);

      // Beveled starlight crystal rim / top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(bx + 2, by + 2, bw - 4, 2.5);
      ctx.fillRect(bx + 2, by + 2, 2.5, bw - 4);

      // Soft cosmic shadow bevel on bottom-right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(bx + 2, by + bw - 3, bw - 4, 1.5);
      ctx.fillRect(bx + bw - 3, by + 2, 1.5, bw - 4);

      // Subtle celestial micro-glint (occasional twinkle)
      const glintPhase = Math.sin(time * 2.5 + bx * 1.3 + by * 2.1);
      if (glintPhase > 0.82) {
        const glintAlpha = (glintPhase - 0.82) / 0.18;
        ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.9})`;
        const gx = bx + bw * 0.75;
        const gy = by + bw * 0.3;
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // 4-point micro cross
        ctx.strokeStyle = `rgba(255, 255, 255, ${glintAlpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx - 3.5, gy);
        ctx.lineTo(gx + 3.5, gy);
        ctx.moveTo(gx, gy - 3.5);
        ctx.lineTo(gx, gy + 3.5);
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  // --- Main Canvas Drawing ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    ctx.save();
    // Screen shake offset
    if (shakeRef.current > 0) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(sx, sy);
    }

    const currentPhase = gameStateRef.current.phase;
    const currentLevel = gameStateRef.current.level;

    // Background selection
    let bgAssetKey = 'spectral_garden_bg';
    if (currentPhase === 'BREAKOUT') {
      bgAssetKey = 'breakout_stage_bg';
    } else if (currentPhase === 'SLOT_MACHINE') {
      bgAssetKey = 'god_mode_bg';
    } else {
      bgAssetKey = PROGRESSION_BACKGROUND_KEYS[
        (currentLevel - 1) % PROGRESSION_BACKGROUND_KEYS.length
      ];
    }

    drawBackground(ctx, assets[bgAssetKey], canvasWidth, canvasHeight, '#080614');

    // Draw Ambient Starfield
    bgStarfieldRef.current.forEach((star) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
      ctx.fill();
    });

    const cellW = 32;
    const startX = (canvasWidth - GRID_COLS * cellW) / 2;
    const startY = 70;

    // ==========================================
    // PHASE 1: MAIN SPECTRIS GRID & HUD
    // ==========================================
    if (currentPhase === 'GRID') {
      // Grid Frame / Cyber Cosmic Backdrop
      ctx.fillStyle = 'rgba(8, 12, 30, 0.88)';
      ctx.fillRect(startX - 8, startY - 8, GRID_COLS * cellW + 16, GRID_ROWS * cellW + 16);

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX - 8, startY - 8, GRID_COLS * cellW + 16, GRID_ROWS * cellW + 16);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(startX, startY + r * cellW);
        ctx.lineTo(startX + GRID_COLS * cellW, startY + r * cellW);
        ctx.stroke();
      }
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(startX + c * cellW, startY);
        ctx.lineTo(startX + c * cellW, startY + GRID_ROWS * cellW);
        ctx.stroke();
      }

      // Top loss threshold warning line
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.6)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, startY + 2 * cellW);
      ctx.lineTo(startX + GRID_COLS * cellW, startY + 2 * cellW);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Settled Blocks
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const color = gridRef.current[r]?.[c];
          if (color) {
            drawBlock(ctx, startX + c * cellW, startY + r * cellW, cellW, color, color === 'rainbow');
          }
        }
      }

      // Draw Ghost Piece
      const p = activePieceRef.current;
      if (p) {
        let ghostY = p.y;
        while (!checkCollision(p.matrix, p.x, ghostY + 1, gridRef.current)) {
          ghostY++;
        }

        const isWild = p.isWild || p.type === 'W';
        const ghostColor = isWild ? 'rgba(255, 240, 150, 0.85)' : p.color;
        const now = performance.now() * 0.003;
        const ghostPulse = (Math.sin(now * 3) + 1) * 0.5;

        for (let r = 0; r < p.matrix.length; r++) {
          for (let c = 0; c < p.matrix[r].length; c++) {
            if (p.matrix[r][c]) {
              const gx = p.x + c;
              const gy = ghostY + r;
              const bx = startX + gx * cellW;
              const by = startY + gy * cellW;

              ctx.save();
              ctx.strokeStyle = ghostColor;
              ctx.lineWidth = 1.8;
              ctx.shadowColor = ghostColor;
              ctx.shadowBlur = 8 + ghostPulse * 4;
              ctx.strokeRect(bx + 2, by + 2, cellW - 4, cellW - 4);

              // Soft starlight gradient fill
              const gGrad = ctx.createLinearGradient(bx, by, bx + cellW, by + cellW);
              gGrad.addColorStop(0, `rgba(255, 255, 255, ${0.12 + ghostPulse * 0.08})`);
              gGrad.addColorStop(1, `${isWild ? 'rgba(255, 240, 150, 0.12)' : (p.glow || 'rgba(123, 241, 232, 0.15)')}`);
              ctx.fillStyle = gGrad;
              ctx.fillRect(bx + 2, by + 2, cellW - 4, cellW - 4);

              // Subtle dashed inner core
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(bx + 5, by + 5, cellW - 10, cellW - 10);
              ctx.setLineDash([]);
              ctx.restore();
            }
          }
        }

        // Draw Active Falling Piece with glowing celestial aura
        for (let r = 0; r < p.matrix.length; r++) {
          for (let c = 0; c < p.matrix[r].length; c++) {
            if (p.matrix[r][c]) {
              const gx = p.x + c;
              const gy = p.y + r;
              drawBlock(ctx, startX + gx * cellW, startY + gy * cellW, cellW, p.color, isWild, {
                isActive: true,
              });
            }
          }
        }

        // Landing slide indicator glow
        if (isGroundedRef.current) {
          ctx.strokeStyle = isWild ? '#fff07c' : (p.color || '#7bf1e8');
          ctx.shadowColor = isWild ? '#fff07c' : (p.color || '#7bf1e8');
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            startX + p.x * cellW,
            startY + p.y * cellW,
            p.matrix[0].length * cellW,
            p.matrix.length * cellW
          );
          ctx.shadowBlur = 0;
        }

        // Animated Spectra Crane Clamp & Glowing Cables
        const clawTargetX = craneXRef.current;
        const clawY = 32;
        const pieceMidX = startX + (p.x + p.matrix[0].length / 2) * cellW;
        const pieceTopY = startY + p.y * cellW;

        ctx.strokeStyle = isWild ? 'rgba(255, 240, 124, 0.9)' : (p.glow || 'rgba(123, 241, 232, 0.7)');
        ctx.lineWidth = 2;
        ctx.shadowColor = isWild ? '#fff07c' : (p.color || '#7bf1e8');
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(clawTargetX - 18, clawY + 28);
        ctx.lineTo(pieceMidX - 12 + craneSwayRef.current, pieceTopY);
        ctx.moveTo(clawTargetX + 18, clawY + 28);
        ctx.lineTo(pieceMidX + 12 + craneSwayRef.current, pieceTopY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Crane Claw Asset Rendering
        const clawW = 68;
        const clawH = clawW / (getConfig('assetClawAspectRatio') as number);
        drawAsset(
          ctx,
          assets['crane_claw'],
          clawTargetX - clawW / 2,
          clawY - 20,
          clawW,
          clawH,
          (fCtx) => {
            fCtx.fillStyle = isWild ? '#fff07c' : (p.color || '#7bf1e8');
            fCtx.fillRect(clawTargetX - 25, clawY - 10, 50, 20);
          }
        );
      }

      // ==========================================
      // HOLD PIECE CONTAINER BOX (TOP-LEFT OF BOARD)
      // ==========================================
      const holdBoxX = startX - 160;
      const holdBoxW = 140;
      const holdBoxY = startY;
      const holdBoxH = 135;

      const canHold = canHoldRef.current;
      ctx.fillStyle = canHold ? 'rgba(12, 18, 42, 0.92)' : 'rgba(10, 10, 25, 0.85)';
      ctx.fillRect(holdBoxX, holdBoxY, holdBoxW, holdBoxH);

      ctx.strokeStyle = canHold ? 'rgba(0, 243, 255, 0.7)' : 'rgba(100, 100, 130, 0.4)';
      ctx.lineWidth = canHold ? 2 : 1;
      ctx.shadowColor = canHold ? '#00f3ff' : 'transparent';
      ctx.shadowBlur = canHold ? 8 : 0;
      ctx.strokeRect(holdBoxX, holdBoxY, holdBoxW, holdBoxH);
      ctx.shadowBlur = 0;

      // Header Tag
      ctx.fillStyle = canHold ? '#00f3ff' : '#888899';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ HOLD [C / ⇧]', holdBoxX + holdBoxW / 2, holdBoxY + 22);

      // Sub-status indicator
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillStyle = canHold ? '#00ff88' : '#ff4466';
      ctx.fillText(canHold ? 'READY TO SWAP' : 'LOCKED THIS DROP', holdBoxX + holdBoxW / 2, holdBoxY + 36);

      // Render Held Tetromino if any
      const heldKey = holdPieceRef.current;
      if (heldKey) {
        const hDef = TETROMINOES[heldKey];
        if (hDef) {
          const hMat = hDef.shape;
          const hCell = 20;
          const isHeldWild = hDef.isWild || heldKey === 'W';
          const offX = holdBoxX + (holdBoxW - hMat[0].length * hCell) / 2;
          const offY = holdBoxY + 52 + (60 - hMat.length * hCell) / 2;

          for (let r = 0; r < hMat.length; r++) {
            for (let c = 0; c < hMat[r].length; c++) {
              if (hMat[r][c]) {
                drawBlock(ctx, offX + c * hCell, offY + r * hCell, hCell, hDef.color, isHeldWild, {
                  isQueueOrHold: true,
                  timeOffset: 5,
                });
              }
            }
          }
        }
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '11px sans-serif';
        ctx.fillText('Empty Slot', holdBoxX + holdBoxW / 2, holdBoxY + 82);
        ctx.font = '9px sans-serif';
        ctx.fillText('(Press C / Shift)', holdBoxX + holdBoxW / 2, holdBoxY + 100);
      }
      ctx.textAlign = 'left';

      // ==========================================
      // FAR-LEFT PANEL: ROUND ACHIEVEMENTS & QUESTS
      // ==========================================
      const questBoxX = startX - 425;
      const questBoxW = 250;
      const questBoxH = 490;

      ctx.fillStyle = 'rgba(10, 16, 36, 0.92)';
      ctx.fillRect(questBoxX, startY, questBoxW, questBoxH);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(questBoxX, startY, questBoxW, questBoxH);

      // Header Banner
      ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.fillRect(questBoxX, startY, questBoxW, 36);
      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 13px Orbitron, sans-serif';
      ctx.fillText('🏆 ROUND QUESTS', questBoxX + 14, startY + 23);

      // Bonus Spins Bank Badge
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText(`🎰 +${bonusSpinsBankRef.current} SPINS`, questBoxX + 140, startY + 23);

      // Render Individual Quests Cards
      let qY = startY + 48;
      questsRef.current.forEach((quest) => {
        const cardH = 92;
        const isComplete = quest.completed;

        ctx.fillStyle = isComplete ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(questBoxX + 10, qY, questBoxW - 20, cardH);

        ctx.strokeStyle = isComplete ? '#00ff88' : 'rgba(255, 255, 255, 0.12)';
        ctx.shadowColor = isComplete ? '#00ff88' : 'transparent';
        ctx.shadowBlur = isComplete ? 8 : 0;
        ctx.lineWidth = isComplete ? 1.5 : 1;
        ctx.strokeRect(questBoxX + 10, qY, questBoxW - 20, cardH);
        ctx.shadowBlur = 0;

        // Title & Reward Tag
        ctx.fillStyle = isComplete ? '#00ff88' : '#e0e0e0';
        ctx.font = 'bold 11px Orbitron, sans-serif';
        ctx.fillText(quest.title, questBoxX + 18, qY + 18);

        // Spin Reward Badge
        ctx.fillStyle = quest.tier === 2 ? '#ffd700' : '#00f3ff';
        ctx.font = 'bold 10px Orbitron, sans-serif';
        const spinTag = quest.rewardSpins > 0 ? `+${quest.rewardSpins} SPIN` : '+40% MTR';
        ctx.fillText(spinTag, questBoxX + questBoxW - 85, qY + 18);

        // Description
        ctx.fillStyle = isComplete ? '#aaffcc' : '#888899';
        ctx.font = '10px sans-serif';
        ctx.fillText(quest.desc, questBoxX + 18, qY + 36);

        // Progress Bar
        const barX = questBoxX + 18;
        const barY = qY + 48;
        const barW = questBoxW - 36;
        const barH = 8;
        const pct = Math.min(1, quest.current / quest.target);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = isComplete ? '#00ff88' : quest.tier === 2 ? '#ffd700' : '#00f3ff';
        ctx.fillRect(barX, barY, barW * pct, barH);

        // Status text / Checkmark
        ctx.fillStyle = isComplete ? '#00ff88' : '#bbbbcc';
        ctx.font = 'bold 10px Orbitron, sans-serif';
        const progressLabel = isComplete
          ? '✓ COMPLETED (+SPINS CLAIMED)'
          : `${quest.current.toLocaleString()} / ${quest.target.toLocaleString()}`;
        ctx.fillText(progressLabel, barX, qY + 74);

        qY += cardH + 10;
      });

      // Goal Gauge at bottom of Quest Panel
      const linesLeft = Math.max(0, roundLinesTargetRef.current - linesInRoundRef.current);
      const isMilestoneRound = currentLevel % 5 === 0;
      ctx.fillStyle = isMilestoneRound ? 'rgba(255, 0, 127, 0.18)' : 'rgba(0, 243, 255, 0.12)';
      ctx.fillRect(questBoxX + 10, questBoxH + startY - 95, questBoxW - 20, 85);
      ctx.strokeStyle = isMilestoneRound ? '#ff007f' : '#00f3ff';
      ctx.strokeRect(questBoxX + 10, questBoxH + startY - 95, questBoxW - 20, 85);

      ctx.fillStyle = isMilestoneRound ? '#ff007f' : '#00f3ff';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.fillText(isMilestoneRound ? '🔮 BREAKOUT MILESTONE' : `⚡ REALM ${currentLevel} GOAL`, questBoxX + 18, questBoxH + startY - 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Orbitron, sans-serif';
      ctx.fillText(`${linesLeft}`, questBoxX + 18, questBoxH + startY - 45);

      ctx.fillStyle = '#aaa';
      ctx.font = '10px Orbitron, sans-serif';
      ctx.fillText(isMilestoneRound ? 'Lines to Breakout & Slots!' : 'Lines to Next Realm', questBoxX + 50, questBoxH + startY - 48);

      // Skill Energy Gauge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(questBoxX + 18, questBoxH + startY - 32, questBoxW - 36, 12);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(questBoxX + 18, questBoxH + startY - 32, (skillEnergyRef.current / 100) * (questBoxW - 36), 12);
      ctx.strokeStyle = '#00f3ff';
      ctx.strokeRect(questBoxX + 18, questBoxH + startY - 32, questBoxW - 36, 12);

      // ==========================================
      // RIGHT PANEL: NEXT PIECE & LEVEL STATS
      // ==========================================
      const sideBoxX = startX + GRID_COLS * cellW + 25;
      const sideBoxW = 150;

      // Next Piece Box
      ctx.fillStyle = 'rgba(12, 18, 40, 0.88)';
      ctx.fillRect(sideBoxX, startY, sideBoxW, 135);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
      ctx.strokeRect(sideBoxX, startY, sideBoxW, 135);

      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('NEXT PIECE', sideBoxX + 24, startY + 24);

      const nextDef = TETROMINOES[nextPieceRef.current];
      if (nextDef) {
        const isNextWild = nextDef.isWild || nextPieceRef.current === 'W';
        const nMat = nextDef.shape;
        const nCell = 20;
        const offX = sideBoxX + (sideBoxW - nMat[0].length * nCell) / 2;
        const offY = startY + 44 + (60 - nMat.length * nCell) / 2;

        for (let r = 0; r < nMat.length; r++) {
          for (let c = 0; c < nMat[r].length; c++) {
            if (nMat[r][c]) {
              drawBlock(ctx, offX + c * nCell, offY + r * nCell, nCell, nextDef.color, isNextWild, {
                isQueueOrHold: true,
                timeOffset: 12,
              });
            }
          }
        }

        if (isNextWild) {
          ctx.fillStyle = '#fff07c';
          ctx.font = 'bold 10px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★ WILD PIECE ★', sideBoxX + sideBoxW / 2, startY + 124);
          ctx.textAlign = 'left';
        }
      }

      // Breakout & Slot Milestone Countdown Box
      const roundsUntilMilestone = 5 - (currentLevel % 5 === 0 ? 5 : currentLevel % 5);
      ctx.fillStyle = 'rgba(12, 18, 40, 0.88)';
      ctx.fillRect(sideBoxX, startY + 155, sideBoxW, 120);
      ctx.strokeStyle = roundsUntilMilestone === 0 ? 'rgba(255, 0, 127, 0.7)' : 'rgba(255, 215, 0, 0.4)';
      ctx.strokeRect(sideBoxX, startY + 155, sideBoxW, 120);

      ctx.fillStyle = roundsUntilMilestone === 0 ? '#ff007f' : '#ffd700';
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.fillText('🔮 BREAKOUT & SLOTS', sideBoxX + 10, startY + 178);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Orbitron, sans-serif';
      ctx.fillText(`${roundsUntilMilestone === 0 ? 'THIS ROUND!' : `${roundsUntilMilestone} Rds`}`, sideBoxX + 14, startY + 212);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 10px Orbitron, sans-serif';
      const mtrPct = Math.floor((spinMeterRef.current || 0) * 100);
      ctx.fillText(`Bank: +${bonusSpinsBankRef.current} (${mtrPct}%)`, sideBoxX + 14, startY + 246);

      // Controls Quick Reference Card on Canvas
      ctx.fillStyle = 'rgba(12, 18, 40, 0.88)';
      ctx.fillRect(sideBoxX, startY + 295, sideBoxW, 175);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.strokeRect(sideBoxX, startY + 295, sideBoxW, 175);

      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.fillText('🎮 CONTROLS', sideBoxX + 16, startY + 318);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px sans-serif';
      ctx.fillText('• ◄ / ► : Move Left/Right', sideBoxX + 10, startY + 340);
      ctx.fillText('• ▲ / W : Rotate Piece', sideBoxX + 10, startY + 358);
      ctx.fillText('• ▼ / S : Soft Drop', sideBoxX + 10, startY + 376);
      ctx.fillText('• SPACE : Hard Drop', sideBoxX + 10, startY + 394);
      ctx.fillStyle = '#ffd700';
      ctx.fillText('• C / SHIFT : Hold / Swap', sideBoxX + 10, startY + 414);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('• 1 / 2 / 3 : Skills', sideBoxX + 10, startY + 434);
      ctx.fillStyle = '#a855f7';
      ctx.fillText('★ Wild: Fills Row Gaps!', sideBoxX + 10, startY + 454);
    }

    // ==========================================
    // PHASE 2: SPECTRIS BREAKOUT BONUS LEVEL
    // ==========================================
    if (currentPhase === 'BREAKOUT') {
      // Draw Breakout Blocks
      breakoutBlocksRef.current.forEach((blk) => {
        ctx.fillStyle = blk.color;
        ctx.shadowColor = blk.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(blk.x + 2, blk.y + 2, blk.w - 4, 4);
        ctx.shadowBlur = 0;
      });

      // Draw Paddle
      const p = breakoutPaddleRef.current;
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 4);
      ctx.shadowBlur = 0;

      // Draw Orbs & Trails
      breakoutOrbsRef.current.forEach((orb) => {
        orb.trail.forEach((t) => {
          ctx.fillStyle = `rgba(0, 243, 255, ${Math.max(0, t.alpha * 0.4)})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, orb.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });

        const orbW = orb.radius * 2.4;
        const orbH = orbW / (getConfig('assetOrbAspectRatio') as number);
        drawAsset(
          ctx,
          assets['breakout_orb'],
          orb.x - orbW / 2,
          orb.y - orbH / 2,
          orbW,
          orbH,
          (fCtx) => {
            fCtx.fillStyle = '#00f3ff';
            fCtx.beginPath();
            fCtx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            fCtx.fill();
          }
        );
      });

      // Aim Line helper from paddle center when aiming
      const input = inputRef.current;
      if (input.pointer.down) {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y);
        ctx.lineTo(input.pointer.x, input.pointer.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // HUD Header
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.fillText(`Orbs Remaining: ${breakoutShotsRemainingRef.current}`, 60, 90);
      ctx.fillText(`Blocks Left: ${breakoutBlocksRef.current.length}`, canvasWidth - 220, 90);

      // CLICK TO FIRE PROMPT
      if (!hasFiredFirstOrbRef.current && breakoutOrbsRef.current.length === 0) {
        const promptY = p.y - 65;
        const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;

        ctx.save();
        ctx.fillStyle = `rgba(0, 243, 255, ${0.2 * pulse})`;
        ctx.fillRect(canvasWidth / 2 - 220, promptY - 25, 440, 50);

        ctx.strokeStyle = `rgba(0, 243, 255, ${0.9 * pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.strokeRect(canvasWidth / 2 - 220, promptY - 25, 440, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦ CLICK / TAP TO FIRE ✦', canvasWidth / 2, promptY + 6);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#00f3ff';
        ctx.fillText('or press SPACE / TAP SCREEN to launch', canvasWidth / 2, promptY + 22);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }

    // ==========================================
    // PHASE 3: 5TH ROUND SLOT MACHINE BONUS
    // ==========================================
    if (currentPhase === 'SLOT_MACHINE') {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2 - 20;

      // Slot Machine Cabinet Outer Frame
      ctx.fillStyle = 'rgba(10, 14, 30, 0.95)';
      ctx.fillRect(centerX - 360, centerY - 220, 720, 440);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;
      ctx.strokeRect(centerX - 360, centerY - 220, 720, 440);
      ctx.shadowBlur = 0;

      // Cabinet Neon Crown
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎰 ASTRAL COSMIC SLOTS 🎰', centerX, centerY - 170);

      ctx.fillStyle = '#00f3ff';
      ctx.font = '14px Orbitron, sans-serif';
      ctx.fillText('EVERY 5 ROUNDS BONUS STAGE', centerX, centerY - 145);

      // 3 Reels Windows
      const reelWidth = 180;
      const reelHeight = 160;
      const reelGap = 30;
      const reelsStartX = centerX - (3 * reelWidth + 2 * reelGap) / 2;

      slotReelsRef.current.forEach((reel, idx) => {
        const rx = reelsStartX + idx * (reelWidth + reelGap);
        const ry = centerY - 90;

        // Reel Backdrop
        ctx.fillStyle = '#050714';
        ctx.fillRect(rx, ry, reelWidth, reelHeight);
        ctx.strokeStyle = reel.isSpinning ? '#00f3ff' : '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, reelWidth, reelHeight);

        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, reelWidth, reelHeight);
        ctx.clip();

        const symIdx = Math.floor(reel.currentIndex) % SLOT_SYMBOLS.length;
        const sym = SLOT_SYMBOLS[symIdx];

        // Draw symbol
        ctx.fillStyle = sym.color;
        ctx.font = '54px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = sym.color;
        ctx.shadowBlur = 15;
        ctx.fillText(sym.icon, rx + reelWidth / 2, ry + reelHeight / 2 + 18);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.fillText(sym.name, rx + reelWidth / 2, ry + reelHeight - 12);

        ctx.restore();
      });

      // Payline center indicator line
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(reelsStartX - 20, centerY - 10);
      ctx.lineTo(reelsStartX + 3 * reelWidth + 2 * reelGap + 20, centerY - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spins Left & Payout Information
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Orbitron, sans-serif';
      ctx.fillText(`SPINS REMAINING: ${slotSpinsRemaining}`, centerX, centerY + 110);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.fillText(`TOTAL WON THIS STAGE: +${slotTotalWon.toLocaleString()} PTS`, centerX, centerY + 140);

      if (slotLastWinMessage) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.fillText(slotLastWinMessage, centerX, centerY + 175);
      } else if (!isSlotSpinning && slotSpinsRemaining > 0) {
        ctx.fillStyle = '#00f3ff';
        ctx.font = '14px Orbitron, sans-serif';
        ctx.fillText('PRESS [SPACE] OR CLICK "SPIN" TO PLAY!', centerX, centerY + 175);
      } else if (slotSpinsRemaining === 0 && !isSlotSpinning) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Orbitron, sans-serif';
        ctx.fillText('ALL SPINS USED! CLICK "PROCEED TO NEXT REALM" BELOW', centerX, centerY + 175);
      }

      ctx.textAlign = 'left';
    }

    // Draw Laser Beam VFX
    if (laserBeamTimerRef.current) {
      const {row1, row2} = laserBeamTimerRef.current;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 25;
      ctx.fillRect(0, startY + row2 * cellW, canvasWidth, cellW * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, startY + row2 * cellW + 16, canvasWidth, 16);
      ctx.shadowBlur = 0;
    }

    // Draw Particles
    particlesRef.current.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Floating Texts
    floatingTextsRef.current.forEach((ft) => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `bold ${ft.size}px Orbitron, sans-serif`;
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  };

  // --- Game Loop Management ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          const currentStatus = gameStateRef.current.status;
          if (currentStatus === 'PLAYING') {
            setIsGameMenuOpen((prev) => !prev);
          } else if (currentStatus === 'START') {
            void exitChat({});
          } else if (['GAME_OVER', 'VICTORY'].includes(currentStatus)) {
            setGameState((prev) => ({...prev, status: 'START'}));
          }
        }
        lastCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat]);

  const isMusicPlaying =
    gameState.status === 'PLAYING' && !isGameMenuOpen && !isMusicMuted;

  return (
    <div className="sg-game-app relative w-full h-full min-h-0 overflow-hidden touch-none flex flex-col items-center justify-center bg-slate-950 text-white select-none font-sans">
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-cyan-400 font-mono">
          <div className="text-2xl font-bold animate-pulse">
            INITIALIZING SPECTRA GANTRY...
          </div>
        </div>
      )}

      <BackgroundMusic url={currentBgmUrl} isPlaying={isMusicPlaying} isMuted={isMusicMuted} />

      {/* TOP HUD BAR */}
      <div className="w-full h-14 bg-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between px-4 z-20 shrink-0 backdrop-blur-md">
        {/* Left Stats */}
        <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-mono text-cyan-300">
          <div>
            SCORE: <span className="font-bold text-white text-sm md:text-base">{gameState.score}</span>
          </div>
          <div>
            ROUND: <span className="font-bold text-yellow-400">{gameState.level}</span>
          </div>
          <div className="hidden sm:block">
            BONUS SPINS: <span className="font-bold text-emerald-400">+{bonusSpins}</span>{' '}
            <span className="text-[10px] text-cyan-400/80">({Math.floor(spinMeterUi * 100)}%)</span>
          </div>
          <div>
            PHASE:{' '}
            <span
              className={`font-bold ${
                gameState.phase === 'SLOT_MACHINE'
                  ? 'text-yellow-400 animate-pulse'
                  : gameState.phase === 'BREAKOUT'
                  ? 'text-pink-400'
                  : 'text-cyan-400'
              }`}
            >
              {gameState.phase === 'SLOT_MACHINE'
                ? '🎰 ASTRAL SLOTS'
                : gameState.phase === 'BREAKOUT'
                ? '🔮 SPECTRIS BREAKOUT'
                : 'GRID'}
            </span>
          </div>
        </div>

        {/* Center Announce */}
        {phaseAnnounce && (
          <div className="text-xs md:text-sm font-bold text-yellow-300 animate-bounce tracking-widest uppercase">
            {phaseAnnounce}
          </div>
        )}

        {/* Right Menu & Hold Quick-Button */}
        <div className="flex items-center gap-2">
          {gameState.status === 'PLAYING' && gameState.phase === 'GRID' && (
            <button
              onClick={swapHoldPiece}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold border transition-all shadow-md min-w-[48px] min-h-[36px] ${
                canHoldUi
                  ? 'bg-amber-950/80 hover:bg-amber-800 text-amber-300 border-amber-500/60 shadow-amber-950/50 animate-pulse'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
              }`}
            >
              <RefreshCw size={15} />
              HOLD [C]
            </button>
          )}

          <button
            onClick={() => setIsGameMenuOpen(true)}
            className="flex items-center gap-1 bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all shadow-md min-w-[48px] min-h-[36px]"
          >
            <Menu size={16} />
            MENU
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
          }}
          className="h-auto max-w-full max-h-full drop-shadow-2xl shadow-cyan-950/50 cursor-pointer"
        />
      </div>

      {/* BOTTOM ACTION & MOBILE CONTROLS BAR */}
      {gameState.status === 'PLAYING' && (
        <div className="w-full bg-slate-900/95 border-t border-cyan-500/30 py-2 px-3 flex flex-wrap items-center justify-around gap-2 z-20 backdrop-blur-md shrink-0">
          {/* SLOT MACHINE ACTION BUTTONS */}
          {gameState.phase === 'SLOT_MACHINE' ? (
            <div className="flex items-center gap-3 w-full max-w-lg justify-center">
              {slotSpinsRemaining > 0 ? (
                <button
                  onClick={triggerSlotSpin}
                  disabled={isSlotSpinning}
                  className={`w-full max-w-xs bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-lg shadow-lg transition-all min-h-[48px] flex items-center justify-center gap-2 ${
                    isSlotSpinning ? 'opacity-60 cursor-not-allowed' : 'animate-pulse'
                  }`}
                >
                  <Coins size={22} />
                  SPIN REELS ({slotSpinsRemaining} LEFT)
                </button>
              ) : (
                <button
                  onClick={() => {
                    startNextPhase('GRID', gameState.level + 1);
                  }}
                  className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black px-6 py-3 rounded-xl text-lg shadow-lg transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <Sparkles size={22} />
                  PROCEED TO REALM {gameState.level + 1} ▶
                </button>
              )}
            </div>
          ) : gameState.phase === 'BREAKOUT' ? (
            <div className="flex items-center gap-3 w-full justify-around">
              <button
                onPointerDown={() => {
                  const p = breakoutPaddleRef.current;
                  p.x = Math.max(80, p.x - 60);
                }}
                className="bg-slate-800 active:bg-cyan-600 text-cyan-300 px-6 py-3 rounded-lg font-bold border border-cyan-500/40 min-w-[54px] min-h-[48px]"
              >
                ◀ PADDLE LEFT
              </button>

              <button
                onClick={() => {
                  const p = breakoutPaddleRef.current;
                  launchBreakoutOrb(p.x + p.w / 2, p.y - 200);
                }}
                className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl font-black border border-pink-400 shadow-lg min-h-[48px] animate-pulse"
              >
                🔥 FIRE ORB
              </button>

              <button
                onPointerDown={() => {
                  const p = breakoutPaddleRef.current;
                  p.x = Math.min(canvasWidth - p.w - 80, p.x + 60);
                }}
                className="bg-slate-800 active:bg-cyan-600 text-cyan-300 px-6 py-3 rounded-lg font-bold border border-cyan-500/40 min-w-[54px] min-h-[48px]"
              >
                PADDLE RIGHT ▶
              </button>
            </div>
          ) : (
            <>
              {/* Skills Cluster */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={triggerSkillBomb}
                  disabled={skillEnergy < 35 || !isGridPhaseActive()}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-lg font-mono text-xs font-bold border transition-all min-w-[44px] min-h-[44px] ${
                    skillEnergy >= 35 && isGridPhaseActive()
                      ? 'bg-red-950/80 hover:bg-red-700 text-red-300 border-red-500 shadow-lg'
                      : 'bg-slate-800/40 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Zap size={15} className="text-yellow-400" />
                  [1] BOMB
                </button>

                <button
                  onClick={triggerSkillLaser}
                  disabled={skillEnergy < 45 || !isGridPhaseActive()}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-lg font-mono text-xs font-bold border transition-all min-w-[44px] min-h-[44px] ${
                    skillEnergy >= 45 && isGridPhaseActive()
                      ? 'bg-cyan-950/80 hover:bg-cyan-700 text-cyan-300 border-cyan-500 shadow-lg'
                      : 'bg-slate-800/40 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={15} className="text-cyan-400" />
                  [2] LASER
                </button>

                <button
                  onClick={triggerSkillFreeze}
                  disabled={skillEnergy < 30 || !isGridPhaseActive()}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-lg font-mono text-xs font-bold border transition-all min-w-[44px] min-h-[44px] ${
                    skillEnergy >= 30 && isGridPhaseActive()
                      ? 'bg-blue-950/80 hover:bg-blue-700 text-blue-300 border-blue-500 shadow-lg'
                      : 'bg-slate-800/40 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Shield size={15} className="text-blue-300" />
                  [3] FREEZE
                </button>
              </div>

              {/* D-Pad & Hold / Rotate / Drop Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={swapHoldPiece}
                  className={`px-3 py-2 rounded-lg font-bold border transition-all min-w-[44px] min-h-[44px] text-xs flex items-center gap-1 ${
                    canHoldUi
                      ? 'bg-amber-950 active:bg-amber-700 text-amber-300 border-amber-500 shadow-md'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700 opacity-50'
                  }`}
                >
                  <RefreshCw size={14} />
                  HOLD
                </button>

                <button
                  onPointerDown={(e) => {
                    try {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchLeftRef.current = true;
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchLeftRef.current = false;
                  }}
                  onPointerCancel={() => {
                    touchLeftRef.current = false;
                  }}
                  onPointerLeave={() => {
                    touchLeftRef.current = false;
                  }}
                  className="bg-slate-800 active:bg-cyan-600 text-cyan-300 px-3 py-2 rounded-lg font-bold border border-cyan-500/40 min-w-[44px] min-h-[44px] touch-none select-none text-xs"
                >
                  ◀
                </button>

                <button
                  onPointerDown={() => rotateActivePiece()}
                  className="bg-slate-800 active:bg-purple-600 text-purple-300 px-3 py-2 rounded-lg font-bold border border-purple-500/40 min-w-[44px] min-h-[44px] touch-none select-none text-xs"
                >
                  ↻ ROTATE
                </button>

                <button
                  onPointerDown={(e) => {
                    try {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchRightRef.current = true;
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchRightRef.current = false;
                  }}
                  onPointerCancel={() => {
                    touchRightRef.current = false;
                  }}
                  onPointerLeave={() => {
                    touchRightRef.current = false;
                  }}
                  className="bg-slate-800 active:bg-cyan-600 text-cyan-300 px-3 py-2 rounded-lg font-bold border border-cyan-500/40 min-w-[44px] min-h-[44px] touch-none select-none text-xs"
                >
                  ▶
                </button>

                <button
                  onPointerDown={(e) => {
                    try {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchDownRef.current = true;
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture?.(e.pointerId);
                    } catch (_) {}
                    touchDownRef.current = false;
                  }}
                  onPointerCancel={() => {
                    touchDownRef.current = false;
                  }}
                  onPointerLeave={() => {
                    touchDownRef.current = false;
                  }}
                  aria-label="Soft drop"
                  className="bg-slate-800 active:bg-cyan-600 text-cyan-300 px-3 py-2 rounded-lg font-bold border border-cyan-500/40 min-w-[44px] min-h-[44px] touch-none select-none text-xs"
                >
                  ▼ SOFT
                </button>

                <button
                  onPointerDown={() => hardDropPiece()}
                  className="bg-pink-950 active:bg-pink-600 text-pink-300 px-3.5 py-2 rounded-lg font-bold border border-pink-500/40 min-w-[44px] min-h-[44px] touch-none select-none text-xs"
                >
                  ⚡ DROP
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* START SCREEN OVERLAY */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="sg-menu-card sg-menu-card-start w-full max-w-md bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center backdrop-blur-xl text-center">
            <a
              href="https://spectralgarden.net/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Spectral Garden (opens in a new tab)"
              className="spectral-garden-logo mb-3 block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-300"
            >
              <img
                src="./images/favicon.png"
                alt="Spectral Garden"
                className="block h-16 w-16 rounded-2xl"
              />
            </a>
            <h1 className="sg-menu-title text-3xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 tracking-wider">
              SPECTRIS
            </h1>
            <h2 className="sg-menu-subtitle text-xs md:text-sm font-mono text-cyan-300 mb-4 tracking-widest">
              ASTRAL ODYSSEY & SLOT EXPEDITION
            </h2>

            <div className="sg-menu-feature-list bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 mb-5 text-left text-xs text-slate-300 space-y-1.5">
              <div className="sg-menu-feature-title text-yellow-400 font-bold">
                NEW FEATURES
              </div>
              <div><b>Hold and swap:</b> Save a piece for a later turn.</div>
              <div><b>Wild pieces:</b> Fill gaps across rows when they land.</div>
              <div><b>Bonus stages:</b> Breakout and slots unlock every five rounds.</div>
            </div>

            <button
              onClick={initGame}
              autoFocus
              className="sg-menu-primary w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-6 py-4 rounded-xl text-lg md:text-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 mb-4 min-h-[48px]"
            >
              <Play size={24} />
              LAUNCH ODYSSEY
            </button>

            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="sg-menu-secondary w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-4 py-3 rounded-xl text-sm border border-cyan-500/30 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <HelpCircle size={18} />
              HOW TO PLAY & CONTROLS
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* GAME MENU OVERLAY */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="sg-menu-card w-full max-w-md bg-slate-900 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center backdrop-blur-xl text-center">
            <h2 className="sg-menu-title text-2xl md:text-3xl font-black mb-6 text-cyan-400 tracking-wider">
              GAME MENU
            </h2>

            {/* Resume Button */}
            <button
              onClick={() => setIsGameMenuOpen(false)}
              autoFocus
              className="sg-menu-primary w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl mb-3 text-base flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Play size={20} />
              RESUME
            </button>

            {/* Audio Toggles */}
            <div className="w-full grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => {
                  const muted = gameAudio.toggleMute();
                  setIsSfxMuted(muted);
                }}
                className="sg-menu-secondary bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isSfxMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                SFX: {isSfxMuted ? 'OFF' : 'ON'}
              </button>

              <button
                onClick={() => setIsMusicMuted((prev) => !prev)}
                className="sg-menu-secondary bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isMusicMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                MUSIC: {isMusicMuted ? 'OFF' : 'ON'}
              </button>
            </div>

            {/* Restart Level */}
            <button
              onClick={initGame}
              className="sg-menu-secondary w-full bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/30 font-bold py-3 rounded-xl mb-3 text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <RotateCw size={18} />
              RESTART ODYSSEY
            </button>

            {/* How to play */}
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="sg-menu-secondary w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold py-3 rounded-xl mb-3 text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <HelpCircle size={18} />
              HOW TO PLAY
            </button>

            {/* Quit to Start Menu */}
            <button
              onClick={() => {
                setIsGameMenuOpen(false);
                setGameState((prev) => ({...prev, status: 'START'}));
              }}
              className="sg-menu-secondary sg-menu-exit w-full bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/30 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Home size={18} />
              QUIT TO MAIN MENU
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY OVERLAY */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="sg-menu-card w-full max-w-lg bg-slate-900 border-2 border-cyan-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center backdrop-blur-xl text-left">
            <h2 className="sg-menu-title text-2xl font-black mb-4 text-cyan-400 text-center tracking-wider">
              HOW TO PLAY SPECTRIS
            </h2>

            <div className="text-xs md:text-sm text-slate-300 space-y-3 mb-6 overflow-y-auto max-h-[60vh] pr-2">
              <div className="border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-yellow-400">★ 1. Hold / Swap & Rainbow Wild Pieces:</span>
                <p className="mt-1">
                  • <b>Hold Box (Key 'C' or 'Shift' / Tap Hold Box):</b> Store a piece to use later or swap with the current piece! Unlocks once per drop.<br />
                  • <b>Rainbow Wild Pieces (★):</b> Rare prismatic pieces. When landed, they automatically expand to fill in missing gaps across all intersected rows, triggering instant clears!
                </p>
              </div>

              <div className="border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-cyan-300">2. Main Spectris Grid:</span>
                <p className="mt-1">
                  Move piece with Left/Right, rotate with Up/Rotate, soft drop with Down, hard drop with Space/Drop button.
                  Stack and complete horizontal lines to charge Skill Energy and complete Round Goals.
                </p>
              </div>

              <div className="border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-yellow-300">3. Round Quests & Slot Spins:</span>
                <p className="mt-1">
                  Check the <b>Round Quests Panel</b> on the left! Complete objectives and score Quad clears to charge your <b>Spin Meter</b> and earn <b>Bonus Spins (+1 Spin / +40% Meter)</b> for the milestone Slot Machine round.
                </p>
              </div>

              <div className="border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-pink-300">4. Spectris Breakout Bonus Stage (Every 5 Rounds):</span>
                <p className="mt-1">
                  Every 5 rounds (Round 5, 10, 15...), clear the required lines to activate the Breakout Bonus Stage! Click/Tap or press Space to fire glowing orbs and shatter floating crystal blocks for huge point multipliers.
                </p>
              </div>

              <div className="border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-emerald-300">5. Celestial Slot Machine (Every 5 Rounds):</span>
                <p className="mt-1">
                  Immediately following the Breakout milestone stage, spin the 3-Reel Astral Slot Machine! Payout combos award massive bonus score:
                  3x 777 (5,000x Level), 3x Crowns (3,000x Level), 3x Stars (2,000x Level), and Double Matches.
                </p>
              </div>

              <div>
                <span className="font-bold text-cyan-300">6. Unlocked Skills:</span>
                <p className="mt-1">
                  • <b>Bomb (Key 1 / Button):</b> Obliterates a 3x3 block cluster.<br />
                  • <b>Laser (Key 2 / Button):</b> Vaporizes bottom 2 rows instantly.<br />
                  • <b>Freeze (Key 3 / Button):</b> Freezes gravity for 8 seconds.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              autoFocus
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl text-base flex items-center justify-center gap-2 min-h-[48px]"
            >
              <ArrowLeft size={18} />
              BACK
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={50}>
          <div className="w-full max-w-md rounded-2xl border-2 border-red-500/70 bg-slate-950/95 p-6 text-center text-white shadow-2xl">
            <h1 className="mb-3 text-3xl font-black text-red-300 md:text-5xl">GRID OVERLOAD</h1>
            <p className="mb-5 text-base md:text-lg">
              Final Score: {gameState.score.toLocaleString()} · Realm Reached: {gameState.level}
            </p>
            <div className="mb-5 rounded-xl border border-cyan-500/30 bg-slate-900/80 p-4 text-left">
              <h2 className="mb-3 text-center text-lg font-black text-cyan-300">SPECTRIS TOP FIVE</h2>
              {isLoadingLeaderboard ? (
                <p className="text-center text-sm text-slate-300">Loading leaderboard...</p>
              ) : leaderboardScores.length > 0 ? (
                <ol className="space-y-1 text-sm">
                  {leaderboardScores.map((entry, index) => (
                    <li key={`${entry.name}-${entry.score}-${index}`} className="flex justify-between gap-3">
                      <span>{index + 1}. {entry.name}</span>
                      <span className="font-bold text-yellow-300">{entry.score.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-center text-sm text-slate-300">
                  {leaderboardStatus || 'No approved scores yet.'}
                </p>
              )}
            </div>
            <label className="mb-2 block text-left text-sm font-bold text-cyan-200" htmlFor="spectris-leaderboard-name">
              Name for the leaderboard
            </label>
            <input
              id="spectris-leaderboard-name"
              type="text"
              value={leaderboardName}
              maxLength={12}
              autoComplete="nickname"
              onChange={(event) => setLeaderboardName(event.target.value.toUpperCase())}
              className="mb-3 min-h-11 w-full rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-300"
            />
            <button
              type="button"
              onClick={() => void submitSpectrisScore()}
              disabled={isSubmittingScore || hasSubmittedScore || !leaderboardName.trim()}
              className="mb-2 min-h-11 w-full rounded-lg bg-cyan-500 px-4 py-2 font-black text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmittingScore ? 'SUBMITTING...' : hasSubmittedScore ? 'SCORE SUBMITTED' : 'SUBMIT SCORE'}
            </button>
            <p className="mb-4 min-h-10 text-sm text-cyan-100" role="status" aria-live="polite">
              {leaderboardStatus}
            </p>
            <button
              type="button"
              onClick={initGame}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-bold text-white transition-colors hover:bg-slate-600"
            >
              <RotateCw size={20} />
              TRY AGAIN
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* VICTORY OVERLAY */}
      {gameState.status === 'VICTORY' && (
        <Overlay
          title="ASTRAL TRANSCENDENCE"
          description={`Flawless Run! Final Score: ${gameState.score}`}
          actionLabel="PLAY AGAIN"
          onAction={initGame}
          icon={<RotateCw size={24} />}
          tone="victory"
        />
      )}
    </div>
  );
}
