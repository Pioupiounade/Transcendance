import { Dialog } from '@/shared/ui';
import { ORGANIZATIONS_LABELS } from '../labels';
import { memberName } from '../memberName';
import type { MemberActionKind } from '../permissions';
import type { OrganizationMember } from '../types';
import styles from './MemberActionDialog.module.css';

type MemberActionDialogProps = {
  /** Membre à gérer ; `null` = fermé. */
  member: OrganizationMember | null;
  /** Actions permises sur ce membre (`permissions.ts`). */
  actions: MemberActionKind[];
  onClose: () => void;
  /** Le choix seulement : la page demande ensuite confirmation. */
  onChoose: (kind: MemberActionKind, member: OrganizationMember) => void;
};

const manage = ORGANIZATIONS_LABELS.manage;
const text = manage.members;
const DANGEROUS: readonly MemberActionKind[] = ['remove', 'ban'];

/** Que faire de ce membre ? Une liste d'actions avec leur conséquence, au lieu de quatre boutons par ligne. */
export function MemberActionDialog({ member, actions, onClose, onChoose }: MemberActionDialogProps) {
  return (
    <Dialog
      open={member !== null}
      onClose={onClose}
      title={member ? text.dialogTitle(memberName(member)) : ''}
      closeLabel={manage.close}
    >
      {member && (
        <ul className={styles.choices}>
          {actions.map((kind) => (
            <li key={kind}>
              <button
                type="button"
                className={[styles.choice, DANGEROUS.includes(kind) && styles.danger].filter(Boolean).join(' ')}
                onClick={() => onChoose(kind, member)}
              >
                <span className={styles.label}>{text.choices[kind].label}</span>
                <span className={styles.hint}>{text.choices[kind].hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
