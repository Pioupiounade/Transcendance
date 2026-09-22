import type { SVGProps } from 'react';
import { ICONS, type IconName } from './icons';

type IconProps = {
  name: IconName;
  /** Taille en px (20 par défaut, 16 en légende, 22 dans un marqueur). */
  size?: number;
  /** Libellé accessible ; sans lui l'icône est décorative (`aria-hidden`). */
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, 'name' | 'children' | 'dangerouslySetInnerHTML'>;

export function Icon({ name, size = 20, title, ...rest }: IconProps) {
  // Fragments statiques de `icons.ts`, jamais de contenu utilisateur.
  const markup = title ? `<title>${title}</title>${ICONS[name]}` : ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
      {...rest}
    />
  );
}
