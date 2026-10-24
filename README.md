# Spectris: Astral Odyssey

Spectris is a free, browser-based cosmic arcade puzzle game from [Spectral Garden](https://spectralgarden.net/). Stack and rotate pieces, clear lines, meet round goals, and explore astral realms.

## Features

- A classic falling-block puzzle grid with progressively challenging rounds
- A Breakout boss battle every 10 rounds, followed by the slot machine only after victory
- Special skills, score multipliers, and changing cosmic backgrounds
- Keyboard and touch-friendly on-screen controls

## Controls

- **Left / Right Arrow:** Move the piece
- **Up Arrow / Rotate button:** Rotate the piece
- **Down Arrow:** Soft drop
- **Space / Drop button:** Hard drop
- **Boss battle:** Click or tap, or press Space, to fire at the boss; hold the left/right paddle controls to move continuously and dodge attacks

## Run locally

Requires [Node.js](https://nodejs.org/) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

Create and locally preview the production build:

```sh
npm run build
npm run preview
```

The production files are generated in `dist/`. The repository includes a GitHub Actions workflow for deploying the site to GitHub Pages.

## Play

When published, the game is available at [spectris.spectralgarden.net](https://spectris.spectralgarden.net/).
