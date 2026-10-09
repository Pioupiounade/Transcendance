import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/global.css';
import { App } from './App';
import { applyPalette, readPalette } from './palette';

// Exploration DA : la palette choisie est posée sur <html> avant le premier rendu (pas d'éclair de la forêt).
applyPalette(readPalette());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
