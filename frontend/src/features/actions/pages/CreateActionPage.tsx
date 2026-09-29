import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { pageTitle } from '@/shared/lib/pageTitle';
import { ActionEditor } from '../components/ActionEditor';
import { DRAFT_PARAM, parseDraft } from '../draftParam';
import { ACTIONS_LABELS } from '../labels';
import { FOCUS_PARAM } from '../mapConfig';
import type { ActionRecord } from '../types';
import styles from './ActionEditorPage.module.css';

const text = ACTIONS_LABELS.create;

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

  const onSaved = (action: ActionRecord) =>
    navigate(`${mapPath}?${FOCUS_PARAM}=${action.action_id}`, { state: { notice: text.submitted } });

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.pageEyebrow)}</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>{text.pageEyebrow}</p>
        <h1>{text.pageTitle}</h1>
        <p className={styles.lead}>{text.pageLead}</p>
      </header>
      <ActionEditor initialLocation={initialLocation} onSaved={onSaved} onCancel={() => navigate(mapPath)} />
    </section>
  );
}
