import { PROFILE_LABELS } from '../labels';
import panels from './ProfilePanels.module.css';

type AboutPanelProps = {
  description?: string | null;
  /** Mon profil : l'invitation à écrire remplace le simple « rien ». */
  own: boolean;
};

const text = PROFILE_LABELS.about;

export function AboutPanel({ description, own }: AboutPanelProps) {
  return (
    <section className={panels.panel} aria-labelledby="profile-about-title">
      <h2 id="profile-about-title">{text.title}</h2>
      {description ? (
        <p className={panels.description}>{description}</p>
      ) : (
        <p className={panels.state}>{own ? text.emptyMine : text.empty}</p>
      )}
    </section>
  );
}
