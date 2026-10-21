/**
 * Spectris Configuration and Tuning Parameters
 */
export const CONFIG = {
  // Game Info
  title: {
    value: 'Spectris: Astral Odyssey',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },

  // System
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Audio
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Theme & Aesthetics
  backgroundColor: {
    value: '#080614',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#00f3ff',
    type: 'color',
    label: 'Primary Neon Color',
    group: 'THEME',
  },
  secondaryColor: {
    value: '#ff007f',
    type: 'color',
    label: 'Secondary Neon Color',
    group: 'THEME',
  },
  fontFamily: {
    value: "'Orbitron', 'Rajdhani', sans-serif",
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Gameplay Tuning (Rules & Balance)
  linesPerRound: {
    value: 4,
    type: 'number',
    label: 'Lines per Round',
    group: 'Rules',
  },
  dasDelay: {
    value: 0.17,
    type: 'number',
    label: 'DAS Initial Delay (sec)',
    group: 'Rules',
  },
  arrInterval: {
    value: 0.045,
    type: 'number',
    label: 'ARR Auto-Repeat Interval (sec)',
    group: 'Rules',
  },
  dropIntervalStart: {
    value: 0.8,
    type: 'number',
    label: 'Base Fall Interval (sec)',
    group: 'Rules',
  },
  softDropMultiplier: {
    value: 12,
    type: 'number',
    label: 'Soft Drop Speed Multiplier',
    group: 'Rules',
  },
  breakoutOrbSpeed: {
    value: 480,
    type: 'number',
    label: 'Breakout Orb Speed',
    group: 'Rules',
  },
  skillEnergyMax: {
    value: 100,
    type: 'number',
    label: 'Skill Energy Max',
    group: 'Rules',
  },
  slotBaseSpins: {
    value: 1,
    type: 'number',
    label: 'Base Slot Spins per Stage',
    group: 'Rules',
  },

  // Asset Dimensions & Aspect Ratios
  assetBackgroundWidth: {
    value: 1376,
    type: 'number',
    label: 'Background Width',
    group: 'ASSETS',
  },
  assetBackgroundHeight: {
    value: 768,
    type: 'number',
    label: 'Background Height',
    group: 'ASSETS',
  },
  assetBackgroundAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Background Aspect Ratio',
    group: 'ASSETS',
  },

  assetClawWidth: {
    value: 641,
    type: 'number',
    label: 'Crane Claw Width',
    group: 'ASSETS',
  },
  assetClawHeight: {
    value: 953,
    type: 'number',
    label: 'Crane Claw Height',
    group: 'ASSETS',
  },
  assetClawAspectRatio: {
    value: 641 / 953,
    type: 'number',
    label: 'Crane Claw Aspect Ratio',
    group: 'ASSETS',
  },

  assetAsteroidWidth: {
    value: 810,
    type: 'number',
    label: 'Void Asteroid Width',
    group: 'ASSETS',
  },
  assetAsteroidHeight: {
    value: 582,
    type: 'number',
    label: 'Void Asteroid Height',
    group: 'ASSETS',
  },
  assetAsteroidAspectRatio: {
    value: 810 / 582,
    type: 'number',
    label: 'Void Asteroid Aspect Ratio',
    group: 'ASSETS',
  },

  assetDroneWidth: {
    value: 608,
    type: 'number',
    label: 'Scrap Drone Width',
    group: 'ASSETS',
  },
  assetDroneHeight: {
    value: 713,
    type: 'number',
    label: 'Scrap Drone Height',
    group: 'ASSETS',
  },
  assetDroneAspectRatio: {
    value: 608 / 713,
    type: 'number',
    label: 'Scrap Drone Aspect Ratio',
    group: 'ASSETS',
  },

  assetOrbWidth: {
    value: 596,
    type: 'number',
    label: 'Prismatic Orb Width',
    group: 'ASSETS',
  },
  assetOrbHeight: {
    value: 619,
    type: 'number',
    label: 'Prismatic Orb Height',
    group: 'ASSETS',
  },
  assetOrbAspectRatio: {
    value: 596 / 619,
    type: 'number',
    label: 'Prismatic Orb Aspect Ratio',
    group: 'ASSETS',
  },

  assetSkillIconWidth: {
    value: 600,
    type: 'number',
    label: 'Skill Icon Width',
    group: 'ASSETS',
  },
  assetSkillIconHeight: {
    value: 600,
    type: 'number',
    label: 'Skill Icon Height',
    group: 'ASSETS',
  },
  assetSkillIconAspectRatio: {
    value: 1.0,
    type: 'number',
    label: 'Skill Icon Aspect Ratio',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}
