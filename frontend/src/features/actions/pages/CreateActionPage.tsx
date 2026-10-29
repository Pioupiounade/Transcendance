import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMyProfile } from '@/features/profile';
import { pageTitle } from '@/shared/lib/pageTitle';
import { ActionEditor } from '../components/ActionEditor';
import { DRAFT_PARAM, parseDraft } from '../draftParam';
import { ACTIONS_LABELS } from '../labels';
import { FOCUS_PARAM } from '../mapConfig';
import type { ActionRecord } from '../types';
import styles from './ActionEditorPage.module.css';
import { useEffect } from 'react';

const text = ACTIONS_LABELS.create;
const photoText = ACTIONS_LABELS.photos;

/** `/actions/new` (protégée) : choisir un lieu sur la carte puis décrire l'action. `?at=lat,lng` pré-place le pin. */
type CreateActionPageProps = {
  /** Chemin de la carte, destination après envoi ou abandon ; `app/` le connaît, la feature non. */
  mapPath: string;
};

export function CreateActionPage({ mapPath }: CreateActionPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftParam = searchParams.get(DRAFT_PARAM);
  const initialLocation = useMemo(() => parseDraft(draftParam), [draftParam]);
  // Sans `?at=`, la carte s'ouvre sur le quartier de l'utilisateur (sinon 42 Paris) ; aucun pin n'est posé pour lui.
  const { profile } = useMyProfile();

  const onSaved = (action: ActionRecord, failedPhotos: string[]) =>
    navigate(`${mapPath}?${FOCUS_PARAM}=${action.action_id}`, {
      state: { notice: photoText.withFailures(text.submitted, failedPhotos) },
    });

  useEffect(() => {
    const testOrganizations = async () => {
    };

    testOrganizations();
  }, []);

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.pageEyebrow)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.pageEyebrow}</p>
        <h1>{text.pageTitle}</h1>
        <p className={styles.lead}>{text.pageLead}</p>
      </header>
      <ActionEditor
        initialLocation={initialLocation}
        home={profile?.location}
        onSaved={onSaved}
        onCancel={() => navigate(mapPath)}
      />
    </section>
  );
}
