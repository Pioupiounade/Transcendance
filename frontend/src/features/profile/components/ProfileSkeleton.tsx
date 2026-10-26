import { PROFILE_LABELS } from '../labels';
import styles from './ProfileSkeleton.module.css';

/** Silhouette de la fiche pendant le chargement : bandeau, avatar, deux lignes, deux panneaux. */
export function ProfileSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-live="polite">
      <span className={styles.srOnly}>{PROFILE_LABELS.loading}</span>
      <div className={styles.hero} aria-hidden="true">
        <div className={styles.cover} />
        <div className={styles.identity}>
          <div className={styles.avatar} />
          <div className={styles.lines}>
            <span className={[styles.line, styles.short].join(' ')} />
            <span className={[styles.line, styles.title].join(' ')} />
            <span className={[styles.line, styles.medium].join(' ')} />
          </div>
        </div>
      </div>
      <div className={styles.panels} aria-hidden="true">
        <div className={styles.panel}>
          <span className={[styles.line, styles.short].join(' ')} />
          <span className={styles.line} />
          <span className={[styles.line, styles.medium].join(' ')} />
        </div>
        <div className={styles.panel}>
          <span className={[styles.line, styles.short].join(' ')} />
          <span className={styles.line} />
        </div>
      </div>
    </div>
  );
}
