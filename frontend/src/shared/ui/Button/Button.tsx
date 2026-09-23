import type { ComponentPropsWithoutRef } from 'react';
import { buttonClass, type ButtonStyleProps } from './buttonClass';

type ButtonProps = ButtonStyleProps & {
  /** Désactive le bouton et remplace le libellé (ex. « Connexion… »). */
  loadingLabel?: string;
  loading?: boolean;
} & ComponentPropsWithoutRef<'button'>;

export function Button({
  variant,
  size,
  block,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
