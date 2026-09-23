import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import type { IconName } from '../Icon/icons';
import styles from './Chip.module.css';

type ChipProps = {
  /** État enfoncé (filtre actif) : exposé par `aria-pressed`. */
  pressed: boolean;
  icon?: IconName;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'aria-pressed' | 'children'>;

/** Puce de filtre (DESIGN.md §6 « Category chip ») : un bouton à bascule, jamais un lien. */
export function Chip({ pressed, icon, className, children, ...rest }: ChipProps) {
  return (
    <button type="button" aria-pressed={pressed} className={[styles.chip, className].filter(Boolean).join(' ')} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
