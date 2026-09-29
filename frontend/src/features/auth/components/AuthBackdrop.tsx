import { Icon, type IconName } from '@/shared/ui';
import styles from './AuthLayout.module.css';

// Fond sous l'illustration : quelques pins des catégories (feuille, cœur, soleil), très atténués (CSS `.backdrop`).
// La carte d'auth occupe le centre (x 475–965 sur 1440) : les pins restent sur les côtés.

type Pin = { x: number; y: number; scale: number; color: string; icon: IconName; outline?: boolean };

const PINS: Pin[] = [
  { x: 150, y: 140, scale: 1.3, color: 'var(--brand)', icon: 'leaf' },
  { x: 330, y: 330, scale: 0.9, color: 'var(--terra)', icon: 'heart', outline: true },
  { x: 90, y: 520, scale: 1.1, color: 'var(--culture)', icon: 'sun' },
  { x: 400, y: 620, scale: 0.7, color: 'var(--brand)', icon: 'leaf', outline: true },
  { x: 1080, y: 120, scale: 1, color: 'var(--terra)', icon: 'heart' },
  { x: 1300, y: 300, scale: 1.4, color: 'var(--brand)', icon: 'leaf', outline: true },
  { x: 1120, y: 500, scale: 0.8, color: 'var(--culture)', icon: 'sun' },
  { x: 1340, y: 640, scale: 1, color: 'var(--terra)', icon: 'heart' },
];

const PIN_PATH = 'M0 0C-14-18-22-28-22-40a22 22 0 1 1 44 0c0 12-8 22-22 40Z';

export function AuthBackdrop() {
  return (
    <svg className={styles.backdropScene} viewBox="0 0 1440 700" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      {PINS.map((pin) => (
        <g key={`${pin.x}-${pin.y}`} transform={`translate(${pin.x} ${pin.y}) scale(${pin.scale})`}>
          <path
            d={PIN_PATH}
            fill={pin.outline ? 'none' : pin.color}
            stroke={pin.color}
            strokeWidth={pin.outline ? 3 : 0}
          />
          <Icon name={pin.icon} size={22} x={-11} y={-51} color={pin.outline ? pin.color : '#fffef7'} />
        </g>
      ))}
    </svg>
  );
}
