import {createRoot} from 'react-dom/client';
import App from './App';
import './src.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <div className="sg-desktop">
    <header className="sg-sitebar">
      <a className="sg-brand" href="https://spectralgarden.net/">
        <img src="./images/favicon.png" alt="" />
        <span>SPECTRAL GARDEN</span>
      </a>
      <nav className="sg-breadcrumbs" aria-label="Breadcrumb">
        <a href="https://spectralgarden.net/">HOME</a>
        <span aria-hidden="true">&gt;</span>
        <span>GAMES</span>
        <span aria-hidden="true">&gt;</span>
        <strong>SPECTRIS</strong>
      </nav>
      <a className="sg-home-link" href="https://spectralgarden.net/">
        ◀ BACK TO GARDEN
      </a>
    </header>

    <main className="sg-workspace">
      <section className="sg-game-window" aria-label="Spectris game window">
        <div className="sg-window-titlebar">
          <span className="sg-window-title">
            C:\PROG\GAMES\SPECTRIS.EXE
          </span>
          <a className="sg-window-close" href="https://spectralgarden.net/" aria-label="Close Spectris and return to Spectral Garden">
            X
          </a>
        </div>
        <div className="sg-window-content">
          <App />
        </div>
      </section>
    </main>

    <footer className="sg-taskbar">
      <a className="sg-start-button" href="https://spectralgarden.net/">
        <img src="./images/favicon.png" alt="" />
        SPECTRAL GARDEN
      </a>
      <span className="sg-taskbar-status">
        <span className="sg-status-light" />
        GAME SYSTEM ONLINE
      </span>
      <span className="sg-taskbar-project">SPECTRIS // ASTRAL ODYSSEY</span>
    </footer>

    <div className="sg-crt-overlay" aria-hidden="true" />
  </div>,
);
