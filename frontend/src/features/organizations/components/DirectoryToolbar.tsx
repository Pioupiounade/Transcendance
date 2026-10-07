import { Checkbox, Chip, FloatingField } from '@/shared/ui';
import { DIRECTORY_SCOPE, DIRECTORY_SORT, type DirectoryView } from '../directory';
import { DIRECTORY_SORT_LABELS, ORGANIZATIONS_LABELS } from '../labels';
import styles from './DirectoryToolbar.module.css';

type DirectoryToolbarProps = {
  view: DirectoryView;
  onChange: (view: DirectoryView) => void;
  /** Propose « All / Mine » : réservé à un utilisateur connecté. */
  canFilterMine: boolean;
  /** Organisations fermées ou suspendues qui répondent à la recherche ; à zéro, la case ne s'affiche pas. */
  inactiveCount: number;
};

const text = ORGANIZATIONS_LABELS.list;
const SORTS = Object.values(DIRECTORY_SORT);

/** Barre de l'annuaire : recherche, « All / Mine », organisations fermées, tri. Sans état : la vue vit dans l'URL. */
export function DirectoryToolbar({ view, onChange, canFilterMine, inactiveCount }: DirectoryToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
        <FloatingField
          id="organization-search"
          type="text"
          label={text.search}
          autoComplete="off"
          value={view.query}
          onChange={(event) => onChange({ ...view, query: event.target.value })}
        />
      </form>

      {canFilterMine && (
        <div className={styles.scope} role="group" aria-label={text.scope.label}>
          <Chip
            pressed={view.scope === DIRECTORY_SCOPE.ALL}
            onClick={() => onChange({ ...view, scope: DIRECTORY_SCOPE.ALL })}
          >
            {text.scope.all}
          </Chip>
          <Chip
            pressed={view.scope === DIRECTORY_SCOPE.MINE}
            onClick={() => onChange({ ...view, scope: DIRECTORY_SCOPE.MINE })}
          >
            {text.scope.mine}
          </Chip>
        </div>
      )}

      {(inactiveCount > 0 || view.closed) && (
        <Checkbox
          id="organization-show-closed"
          checked={view.closed}
          onChange={(event) => onChange({ ...view, closed: event.target.checked })}
        >
          {text.showClosed(inactiveCount)}
        </Checkbox>
      )}

      <label className={styles.sort}>
        {text.sort}
        <select
          className={styles.select}
          value={view.sort}
          onChange={(event) => {
            const sort = SORTS.find((value) => value === event.target.value);
            if (sort) onChange({ ...view, sort });
          }}
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {DIRECTORY_SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
