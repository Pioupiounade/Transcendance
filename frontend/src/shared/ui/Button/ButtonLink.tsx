import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router';
import { buttonClass, type ButtonStyleProps } from './buttonClass';

type ButtonLinkProps = ButtonStyleProps & ComponentPropsWithoutRef<typeof Link>;

/** Lien de navigation habillé en bouton (même API visuelle que `Button`). */
export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...rest} />;
}
