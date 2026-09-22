import styles from './Avatar.module.css';

type AvatarProps = {
  /** Nom affiché : sert aux initiales et au texte alternatif. */
  name: string;
  src?: string | null;
  /** Diamètre en px (42 dans l'en-tête, 90 sur le profil). */
  size?: number;
  className?: string;
};

const initials = (name: string): string =>
  name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export function Avatar({ name, src, size = 42, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size / 3) };
  return (
    <span className={[styles.avatar, className].filter(Boolean).join(' ')} style={style} aria-hidden="true">
      {src ? <img className={styles.image} src={src} alt="" /> : initials(name)}
    </span>
  );
}
