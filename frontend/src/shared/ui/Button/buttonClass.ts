import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text';
export type ButtonSize = 'md' | 'lg';

export type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pleine largeur. */
  block?: boolean;
};

export const buttonClass = (
  { variant = 'primary', size = 'md', block = false }: ButtonStyleProps,
  className?: string,
): string =>
  [styles.btn, styles[variant], size === 'lg' && styles.lg, block && styles.block, className]
    .filter(Boolean)
    .join(' ');
