import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NeighborhoodMap, type LatLng } from '@/features/actions';
import { pageTitle } from '@/shared/lib/pageTitle';
import { OrganizationForm } from '../components/OrganizationForm';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { Organization } from '../types';
import styles from './CreateOrganizationPage.module.css';

type CreateOrganizationPageProps = {
  /** Fiche de l'organisation créée, destination après l'envoi ; `app/` connaît les chemins, la feature non. */
  organizationPath: (id: string) => string;
  /** L'annuaire, destination d'un abandon. */
  listPath: string;
};

const text = ORGANIZATIONS_LABELS.create;
const NO_ACTIONS: never[] = [];
const noop = () => {};

/**
 * `/organizations/new` (protégée, #106) : placer l'organisation sur la carte (pin déplaçable de `NeighborhoodMap`,
 * sans popup), puis la décrire. Le backend me fait `OWNER` à la création (#135) : la fiche propose « Manage »
 * dès l'arrivée, c'est la confirmation.
 */
export function CreateOrganizationPage({ organizationPath, listPath }: CreateOrganizationPageProps) {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LatLng | null>(null);

  const onSaved = (organization: Organization) => navigate(organizationPath(organization.organization_id));

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.eyebrow)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1>{text.pageTitle}</h1>
        <p className={styles.lead}>{text.lead}</p>
      </header>
      <div className={styles.editor}>
        <div className={styles.map}>
          <NeighborhoodMap
            actions={NO_ACTIONS}
            selectedId={null}
            onSelect={noop}
            draft={location}
            onDraftChange={setLocation}
          />
        </div>
        <div className={styles.form}>
          <OrganizationForm location={location} onSaved={onSaved} onCancel={() => navigate(listPath)} />
        </div>
      </div>
    </section>
  );
}
