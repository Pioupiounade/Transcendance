import { Link } from 'react-router';
import { Icon } from '@/shared/ui';
import { PROFILE_LABELS } from '../labels';
import type { ProfileActivity } from '../types';
import panels from './ProfilePanels.module.css';

type ActivityPanelProps = {
  activity: ProfileActivity | null;
  loading: boolean;
  error: string | null;
  organizationPath: (id: string) => string;
  actionPath: (id: string) => string;
};

const text = PROFILE_LABELS.activity;

/** Mes organisations et les actions que j'ai rejointes, en liens vers leurs fiches. */
export function ActivityPanel({ activity, loading, error, organizationPath, actionPath }: ActivityPanelProps) {
  return (
    <section className={panels.panel} aria-labelledby="profile-activity-title">
      <h2 id="profile-activity-title">{text.title}</h2>

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

      {activity && (
        <>
          <p className={panels.subhead}>
            <Icon name="building" size={14} />
            {text.organizations}
          </p>
          {activity.organizations.length === 0 ? (
            <p className={panels.muted}>{text.noOrganizations}</p>
          ) : (
            <ul className={panels.list}>
              {activity.organizations.map((organization) => (
                <li key={organization.id} className={panels.row}>
                  <span className={panels.rowIcon}>
                    <Icon name="building" size={18} />
                  </span>
                  <Link to={organizationPath(organization.id)} className={panels.rowLink}>
                    {organization.title}
                  </Link>
                  <Icon name="arrow" size={16} className={panels.rowGo} />
                </li>
              ))}
            </ul>
          )}

          <p className={panels.subhead}>
            <Icon name="calendar" size={14} />
            {text.actions}
          </p>
          {activity.participations.length === 0 ? (
            <p className={panels.muted}>{text.noActions}</p>
          ) : (
            <ul className={panels.list}>
              {activity.participations.map((participation) => (
                <li key={participation.actionId} className={panels.row}>
                  <span className={panels.rowIcon}>
                    <Icon name="flag" size={18} />
                  </span>
                  <Link to={actionPath(participation.actionId)} className={panels.rowLink}>
                    {participation.title}
                  </Link>
                  <Icon name="arrow" size={16} className={panels.rowGo} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
