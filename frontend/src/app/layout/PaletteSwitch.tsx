import { useState } from 'react';
import { APP_LABELS } from '../labels';
import { applyPalette, PALETTES, readPalette, type Palette } from '../palette';
import styles from './PaletteSwitch.module.css';

const text = APP_LABELS.palette;

/**
 * Bascule entre les fiches de couleurs (exploration DA, branche explore/palettes) : pastille fixe en bas à droite,
 * un bouton par palette (`aria-pressed` = la palette courante). Le choix est appliqué sur <html> et mémorisé par
 * `app/palette.ts`. À retirer une fois la palette choisie.
 */
export function PaletteSwitch() {
  const [palette, setPalette] = useState<Palette>(readPalette);

  const choose = (next: Palette) => {
    applyPalette(next);
    setPalette(next);
  };

  return (
    <div className={styles.switch} role="group" aria-label={text.label}>
      {PALETTES.map((option) => (
        <button
          key={option}
          type="button"
          className={styles.option}
          aria-pressed={option === palette}
          onClick={() => choose(option)}
        >
          <span className={styles.swatch} data-palette={option} aria-hidden="true" />
          <span className={styles.name}>{text.names[option]}</span>
        </button>
      ))}
    </div>
  );
}
