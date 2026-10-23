import { useCallback, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ROLE_APP, useAuth } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, ButtonLink, ConfirmDialog, Icon, type Confirmation } from '@/shared/ui';
import {
  approveMembership,
  banMember,
  demoteMember,
  denyMembership,
  fetchMemberships,
  promoteMember,
  removeMember,
  transferOwnership,
} from '../api/organizationsApi';
import { useOrganization, useOrganizationMembers } from '../api/useOrganization';
import { ManageTabs, type ManageTab } from '../components/ManageTabs';
import { MemberActionDialog } from '../components/MemberActionDialog';
import { MembersPanel } from '../components/MembersPanel';
import { RequestsPanel } from '../components/RequestsPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { toManageErrorMessage } from '../errors';
import { ORGANIZATIONS_LABELS, ORGANIZATION_STATUS_LABELS } from '../labels';
import { panelId, tabId } from '../manageTabIds';
import { memberName } from '../memberName';
import { managerLevel, memberActions, type MemberActionKind } from '../permissions';
import {
  MEMBER_STATUS,
  ORGANIZATION_STATUS,
  type Membership,
  type Organization,
  type OrganizationMember,
  type RoleOrg,
} from '../types';
import styles from './OrganizationManagePage.module.css';

type OrganizationManagePageProps = {
  /** Chemin de la fiche publique, pour le retour. */
  organizationPath: (id: string) => string;
};

type TabId = 'requests' | 'members' | 'settings';

const text = ORGANIZATIONS_LABELS.manage;
const TAB_PARAM = 'tab';
const TAB_IDS: readonly TabId[] = ['requests', 'members', 'settings'];
const ROLE_ORDER: Record<RoleOrg, number> = { OWNER: 0, MANAGER: 1, MEMBER: 2 };
const NO_MEMBERS: OrganizationMember[] = [];

const byRoleThenName = (a: OrganizationMember, b: OrganizationMember) =>
  ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || memberName(a).localeCompare(memberName(b));

/**
 * `/organizations/:id/manage` (#62) : tableau de bord des gestionnaires (MANAGER, OWNER) et des ADMIN de la
 * plateforme. Trois onglets, gardés dans l'URL (`?tab=`) : demandes d'adhésion, membres et rôles, réglages.
 *
 * Le droit d'entrer se lit d'abord dans la liste publique des membres : la route des adhésions répond 403 aux
 * autres, ce que le navigateur inscrirait en erreur dans la console. Le backend reste le seul juge.
 */
export function OrganizationManagePage({ organizationPath }: OrganizationManagePageProps) {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();

  const loaded = useOrganization(id);

  const organizationAvailable =
    !loaded.loading &&
    loaded.organization != null &&
    !loaded.notFound &&
    !loaded.error;

  const members = useOrganizationMembers(
    id,
    organizationAvailable,
  );

  const backTo = organizationPath(id);
  const myRole = members.members.find((member) => member.user_id === user?.user_id)?.role ?? null;
  const allowed = managerLevel(myRole, user?.role === ROLE_APP.ADMIN) !== null;
  const loading = loaded.loading || members.loading;
  const message = loaded.notFound
    ? text.notFound
    : loaded.error || members.error
      ? text.error
      : !loading && !allowed
        ? text.forbidden
        : null;

  return (
    <section className={styles.page}>
      <title>
        {pageTitle(loaded.organization ? `${text.eyebrow} · ${loaded.organization.title}` : text.eyebrow)}
      </title>
      <Link to={backTo} className={styles.back}>
        ← {loaded.organization ? text.back(loaded.organization.title) : text.backFallback}
      </Link>

      {loading && !message && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {message && (
        <div className={styles.state} role="alert">
          <p>{message}</p>
          <ButtonLink to={backTo} variant="secondary">
            {text.backFallback}
          </ButtonLink>
        </div>
      )}
      {/* Une organisation = un tableau de bord : l'état local ne survit pas au changement d'id. */}
      {!loading && !message && loaded.organization && <Dashboard key={id} loaded={loaded.organization} />}
    </section>
  );
}

/** Le tableau de bord lui-même. Les adhésions modifiées sont rejouées localement à partir des réponses du backend. */
function Dashboard({ loaded }: { loaded: Organization }) {
  const id = loaded.organization_id;
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const load = useCallback((signal: AbortSignal) => fetchMemberships(id, signal), [id]);
  const memberships = useResource(load);

  // Réponses du backend depuis le chargement : adhésion modifiée, ou `null` quand le membre a été retiré.
  const [changes, setChanges] = useState<Record<string, Membership | null>>({});
  const [edited, setEdited] = useState<Organization | null>(null);
  const [managing, setManaging] = useState<OrganizationMember | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const organization = edited ?? loaded;
  const selfId = user?.user_id ?? '';
  const isAdmin = user?.role === ROLE_APP.ADMIN;

  const members = useMemo(
    () =>
      (memberships.data ?? NO_MEMBERS).flatMap((member) => {
        if (!(member.user_id in changes)) return [member];
        const change = changes[member.user_id];
        return change ? [{ ...member, ...change }] : [];
      }),
    [memberships.data, changes],
  );
  const groups = useMemo(
    () => ({
      pending: members.filter((member) => member.status === MEMBER_STATUS.PENDING),
      declined: members.filter((member) => member.status === MEMBER_STATUS.REJECTED),
      active: members.filter((member) => member.status === MEMBER_STATUS.ACTIVE).sort(byRoleThenName),
      banned: members.filter((member) => member.status === MEMBER_STATUS.BANNED),
    }),
    [members],
  );

  const myRole = groups.active.find((member) => member.user_id === selfId)?.role ?? null;
  const level = managerLevel(myRole, isAdmin);
  const inactive = organization.organization_status !== ORGANIZATION_STATUS.ACTIVE;

  const requested = params.get(TAB_PARAM);
  const tab: TabId = TAB_IDS.find((value) => value === requested) ?? 'requests';
  const selectTab = (next: TabId) => setParams({ [TAB_PARAM]: next }, { replace: true });
  const tabs: ManageTab<TabId>[] = [
    { id: 'requests', label: text.tabs.requests, count: groups.pending.length },
    { id: 'members', label: text.tabs.members },
    { id: 'settings', label: text.tabs.settings },
  ];

  const apply = (...updated: Membership[]) =>
    setChanges((current) => ({ ...current, ...Object.fromEntries(updated.map((m) => [m.user_id, m])) }));

  const approve = async (member: OrganizationMember) => {
    apply(await approveMembership(id, member.user_id));
    setNotice(text.requests.approved(memberName(member)));
  };

  const decline = (member: OrganizationMember) => {
    const name = memberName(member);
    const copy = text.requests.declineConfirm;
    setConfirmation({
      title: copy.title,
      body: copy.body(name),
      effects: copy.effects,
      confirmLabel: copy.confirm,
      confirmingLabel: copy.confirming,
      danger: true,
      run: async () => {
        apply(await denyMembership(id, member.user_id));
        setNotice(text.requests.declined(name));
      },
    });
  };

  // Chaque action sur un membre : sa confirmation, sa requête, son effet local et son message.
  const choose = (kind: MemberActionKind, member: OrganizationMember) => {
    const name = memberName(member);
    const t = text.members;
    const userId = member.user_id;
    const specs: Record<MemberActionKind, Confirmation> = {
      promote: {
        title: t.promoteConfirm.title,
        body: t.promoteConfirm.body(name),
        confirmLabel: t.promoteConfirm.confirm,
        confirmingLabel: t.promoteConfirm.confirming,
        run: async () => {
          apply(await promoteMember(id, userId));
          setNotice(t.promoted(name));
        },
      },
      demote: {
        title: t.demoteConfirm.title,
        body: t.demoteConfirm.body(name),
        confirmLabel: t.demoteConfirm.confirm,
        confirmingLabel: t.demoteConfirm.confirming,
        run: async () => {
          apply(await demoteMember(id, userId));
          setNotice(t.demoted(name));
        },
      },
      transfer: {
        title: t.transferConfirm.title,
        body: t.transferConfirm.body(name),
        effects: t.transferConfirm.effects,
        confirmLabel: t.transferConfirm.confirm,
        confirmingLabel: t.transferConfirm.confirming,
        danger: true,
        run: async () => {
          apply(...(await transferOwnership(id, userId)));
          setNotice(t.transferred(name));
        },
      },
      remove: {
        title: t.removeConfirm.title,
        body: t.removeConfirm.body(name),
        effects: t.removeConfirm.effects,
        confirmLabel: t.removeConfirm.confirm,
        confirmingLabel: t.removeConfirm.confirming,
        danger: true,
        run: async () => {
          await removeMember(id, userId);
          setChanges((current) => ({ ...current, [userId]: null }));
          setNotice(t.removed(name));
        },
      },
      ban: {
        title: t.banConfirm.title,
        body: t.banConfirm.body(name),
        effects: t.banConfirm.effects,
        confirmLabel: t.banConfirm.confirm,
        confirmingLabel: t.banConfirm.confirming,
        danger: true,
        run: async () => {
          apply(await banMember(id, userId));
          setNotice(t.banned(name));
        },
      },
    };
    setManaging(null);
    setConfirmation(specs[kind]);
  };

  const retry = () => {
    setChanges({});
    memberships.reload();
  };

  if (memberships.loading) {
    return (
      <p className={styles.state} role="status">
        {text.loading}
      </p>
    );
  }
  if (memberships.error) {
    return (
      <div className={styles.state} role="alert">
        <p>{memberships.error.status === 403 ? text.forbidden : text.error}</p>
        <Button variant="secondary" onClick={retry}>
          {text.retry}
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          {text.eyebrow}
          {inactive && (
            <span className={styles.status}>{ORGANIZATION_STATUS_LABELS[organization.organization_status]}</span>
          )}
        </p>
        <h1>{organization.title}</h1>
      </header>

      <ManageTabs label={text.tabsLabel} tabs={tabs} value={tab} onChange={selectTab} />

      {notice && (
        <p className={styles.notice} role="status">
          <Icon name="check" size={16} strokeWidth={2.4} />
          {notice}
        </p>
      )}
      {inactive && tab !== 'settings' && <p className={styles.state}>{text.inactive}</p>}

      <div className={styles.panels} role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)}>
        {tab === 'requests' && (
          <RequestsPanel
            pending={groups.pending}
            declined={groups.declined}
            disabled={inactive}
            onApprove={approve}
            onDecline={decline}
          />
        )}
        {tab === 'members' && (
          <MembersPanel
            active={groups.active}
            banned={groups.banned}
            level={level}
            selfId={selfId}
            disabled={inactive}
            onManage={setManaging}
          />
        )}
        {tab === 'settings' && (
          <SettingsPanel
            key={organization.organization_id}
            organization={organization}
            isAdmin={isAdmin}
            onChanged={(updated, changed) => {
              setEdited(updated);
              setNotice(changed);
            }}
            onConfirm={setConfirmation}
          />
        )}
      </div>

      <MemberActionDialog
        member={managing}
        actions={managing ? memberActions(level, managing, selfId) : []}
        onClose={() => setManaging(null)}
        onChoose={choose}
      />
      <ConfirmDialog
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
        cancelLabel={text.cancel}
        closeLabel={text.close}
        toErrorMessage={toManageErrorMessage}
      />
    </>
  );
}
