import { Avatar, Button } from '@/shared/ui';
import { formatFullDate } from '@/shared/lib/formatDate';
import { ORGANIZATIONS_LABELS, ROLE_ORG_LABELS } from '../labels';
import { memberName } from '../memberName';
import { memberActions, type ManagerLevel } from '../permissions';
import type { OrganizationMember } from '../types';
import styles from './ManagePanels.module.css';

type MembersPanelProps = {
  active: OrganizationMember[];
  banned: OrganizationMember[];
  level: ManagerLevel;
  selfId: string;
  /** Organisation inactive : le backend refuse toute modification. */
  disabled: boolean;
  onManage: (member: OrganizationMember) => void;
  onReactivate: (member: OrganizationMember) => void;
};

const manage = ORGANIZATIONS_LABELS.manage;
const text = manage.members;

/** Membres actifs avec leur rôle (« Manage » quand j'ai le droit d'agir sur eux), puis les bannis en lecture seule. */
export function MembersPanel({
  active,
  banned,
  level,
  selfId,
  disabled,
  onManage,
  onReactivate,
}: MembersPanelProps) {
  return (
    <>
      <section className={styles.panel} aria-labelledby="members-active-title">
        <h2 id="members-active-title">{text.active}</h2>
        {active.length === 0 && <p className={styles.muted}>{text.empty}</p>}
        {active.length > 0 && (
          <ul className={styles.rows}>
            {active.map((member) => {
              const name = memberName(member);
              return (
                <li key={member.user_id} className={styles.row}>
                  <Avatar name={name} src={member.user.profile?.profile_picture ?? undefined} size={40} />
                  <span className={styles.identity}>
                    <span className={styles.name}>
                      {name}
                      {member.user_id === selfId && <span className={styles.you}>{manage.you}</span>}
                    </span>
                    <span className={styles.meta}>{ROLE_ORG_LABELS[member.role]}</span>
                  </span>
                  {memberActions(level, member, selfId).length > 0 && (
                    <span className={styles.buttons}>
                      <Button
                        variant="secondary"
                        disabled={disabled}
                        aria-label={text.manageOf(name)}
                        onClick={() => onManage(member)}
                      >
                        {text.manage}
                      </Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {banned.length > 0 && (
        <section className={styles.panel} aria-labelledby="members-banned-title">
          <h2 id="members-banned-title">{text.bannedTitle}</h2>
          <p className={styles.muted}>{text.bannedLead}</p>
                    <ul className={styles.rows}>
                      {banned.map((member) => {
                        const name = memberName(member);

                        return (
                          <li key={member.user_id} className={`${styles.row} ${styles.past}`}>
                            <Avatar name={name} src={member.user.profile?.profile_picture ?? undefined} size={40} />
                            <span className={styles.identity}>
                              <span className={styles.name}>{name}</span>
                              <span className={styles.meta}>{formatFullDate(member.updated_at)}</span>
                            </span>
                            <span className={styles.buttons}>
                              <Button
                                variant="secondary"
                                disabled={disabled}
                                onClick={() => onReactivate(member)}
                              >
                                {manage.requests.reactivate}
                              </Button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
        </section>
      )}
    </>
  );
}
