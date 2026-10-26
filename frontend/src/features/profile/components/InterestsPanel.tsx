import { PROFILE_LABELS } from '../labels';
import type { InterestCategory } from '../types';
import { InterestTag } from './InterestTag';
import panels from './ProfilePanels.module.css';

type InterestsPanelProps = {
  interests: readonly InterestCategory[] | null;
  loading: boolean;
  error: string | null;
  own: boolean;
};

const text = PROFILE_LABELS.interests;

export function InterestsPanel({ interests, loading, error, own }: InterestsPanelProps) {
  return (
    <section className={panels.panel} aria-labelledby="profile-interests-title">
      <div className={panels.panelHead}>
        <h2 id="profile-interests-title">{text.title}</h2>
        {interests && interests.length > 0 && <span className={panels.count}>{interests.length}</span>}
      </div>

      {loading && (
        <p className={panels.state} role="status">
          {text.loading}
        </p>
      )}
      {error && (
        <p className={[panels.state, panels.error].join(' ')} role="alert">
          {error}
        </p>
      )}
      {!loading && !error && interests && (
        interests.length === 0 ? (
          <p className={panels.state}>{own ? text.emptyMine : text.empty}</p>
        ) : (
          <ul className={panels.tags}>
            {interests.map((interest) => (
              <li key={interest}>
                <InterestTag interest={interest} />
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
