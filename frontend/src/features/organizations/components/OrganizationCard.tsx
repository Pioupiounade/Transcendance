import { Link } from 'react-router';
import { Icon } from '@/shared/ui';
import { ORGANIZATION_STATUS_LABELS } from '../labels';
import { ORGANIZATION_STATUS, type Organization } from '../types';
import styles from './OrganizationCard.module.css';

type OrganizationCardProps = {
  organization: Organization;
  to: string;
};

/** Carte de la liste : tout le bloc est un lien vers la fiche. Le statut n'apparaît que s'il n'est pas « active ». */
export function OrganizationCard({ organization, to }: OrganizationCardProps) {
  const inactive = organization.organization_status !== ORGANIZATION_STATUS.ACTIVE;
  return (
    <Link to={to} className={[styles.card, inactive && styles.inactive].filter(Boolean).join(' ')}>
      <span className={styles.icon}>
        <Icon name="building" size={20} />
      </span>
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.title}>{organization.title}</span>
          {inactive && <span className={styles.status}>{ORGANIZATION_STATUS_LABELS[organization.organization_status]}</span>}
        </span>
        <span className={styles.address}>
          <Icon name="pin" size={13} />
          {organization.address}
        </span>
        <span className={styles.description}>{organization.description}</span>
      </span>
    </Link>
  );
}
