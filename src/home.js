import './style.css';
import cfg from '../site.config.json';
import { renderHero, renderFind, renderReels } from './ui.js';

const root = document.documentElement.style;
root.setProperty('--primary', cfg.theme.primary);
root.setProperty('--accent', cfg.theme.accent);
root.setProperty('--tint', cfg.theme.tint);

renderHero(cfg);
renderFind(cfg);
renderReels(cfg);
