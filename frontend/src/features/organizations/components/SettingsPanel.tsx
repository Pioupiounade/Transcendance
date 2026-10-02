import { useState } from 'react';
import { useForm } from '@/shared/hooks/useForm';
import { Button, FloatingField, FloatingTextarea, type Confirmation } from '@/shared/ui';
import { closeOrganization, reopenOrganization, updateOrganization } from '../api/organizationsApi';
import { toManageErrorMessage } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import { ORGANIZATION_STATUS, type Organization } from '../types';
import styles from './ManagePanels.module.css';
import own from './SettingsPanel.module.css';

type SettingsPanelProps = {
  organization: Organization;
  /** ADMIN de la plateforme : seul à pouvoir réactiver une organisation suspendue. */
  isAdmin: boolean;
  /** L'organisation telle que le backend la renvoie après une modification, avec le message à annoncer. */
  onChanged: (organization: Organization, notice: string) => void;
  /** Fermer l'organisation passe par une confirmation, tenue par la page. */
  onConfirm: (confirmation: Confirmation) => void;
};

const text = ORGANIZATIONS_LABELS.manage.settings;
const required = (value: string) => (value.trim() === '' ? text.required : null);

/** Réglages : nom, description, adresse (`PATCH /organizations/:id`), puis fermer ou rouvrir l'organisation. */
export function SettingsPanel({ organization, isAdmin, onChanged, onConfirm }: SettingsPanelProps) {
  const form = useForm(
    { title: organization.title, description: organization.description, address: organization.address },
    { title: required, description: required, address: required },
    async (values) => {
      const updated = await updateOrganization(organization.organization_id, {
        title: values.title.trim(),
        description: values.description.trim(),
        address: values.address.trim(),
      });
      onChanged(updated, text.saved);
    },
    toManageErrorMessage,
  );
  const [reopening, setReopening] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const status = organization.organization_status;
  const suspended = status === ORGANIZATION_STATUS.SUSPENDED;

  const close = () =>
    onConfirm({
      title: text.closeConfirm.title,
      body: text.closeConfirm.body(organization.title),
      effects: text.closeConfirm.effects,
      confirmLabel: text.closeConfirm.confirm,
      confirmingLabel: text.closeConfirm.confirming,
      danger: true,
      run: async () => onChanged(await closeOrganization(organization.organization_id), text.closed),
    });

  const reopen = async () => {
    setReopening(true);
    setStatusError(null);
    try {
      onChanged(await reopenOrganization(organization.organization_id), text.reopened);
    } catch (failure) {
      setStatusError(toManageErrorMessage(failure));
    } finally {
      setReopening(false);
    }
  };

  return (
    <>
      <section className={styles.panel} aria-labelledby="settings-details-title">
        <h2 id="settings-details-title">{text.details}</h2>
        <form className={own.form} noValidate onSubmit={form.handleSubmit}>
          <FloatingField
            id="title"
            type="text"
            label={text.title}
            autoComplete="off"
            value={form.values.title}
            onChange={(event) => form.setValue('title', event.target.value)}
            onBlur={() => form.touch('title')}
            error={form.errorOf('title')}
          />
          <FloatingTextarea
            id="description"
            label={text.description}
            rows={4}
            value={form.values.description}
            onChange={(event) => form.setValue('description', event.target.value)}
            onBlur={() => form.touch('description')}
            error={form.errorOf('description')}
          />
          <FloatingField
            id="address"
            type="text"
            label={text.address}
            autoComplete="off"
            value={form.values.address}
            onChange={(event) => form.setValue('address', event.target.value)}
            onBlur={() => form.touch('address')}
            error={form.errorOf('address')}
          />
          {form.serverError && (
            <p className={styles.error} role="alert">
              {form.serverError}
            </p>
          )}
          <div className={own.submit}>
            <Button type="submit" loading={form.submitting} loadingLabel={text.saving}>
              {text.save}
            </Button>
          </div>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="settings-status-title">
        <h2 id="settings-status-title">{text.status}</h2>
        {statusError && (
          <p className={styles.error} role="alert">
            {statusError}
          </p>
        )}
        {status === ORGANIZATION_STATUS.ACTIVE && (
          <div className={own.statusRow}>
            <p className={styles.muted}>{text.activeLead}</p>
            <Button variant="secondary" className={own.danger} onClick={close}>
              {text.closeButton}
            </Button>
          </div>
        )}
        {status === ORGANIZATION_STATUS.CLOSED && (
          <div className={own.statusRow}>
            <p className={styles.muted}>{text.closedLead}</p>
            <Button onClick={reopen} loading={reopening} loadingLabel={text.reopening}>
              {text.reopen}
            </Button>
          </div>
        )}
        {suspended && (
          <div className={own.statusRow}>
            <p className={styles.muted}>{isAdmin ? text.suspendedAdminLead : text.suspendedLead}</p>
            {isAdmin && (
              <Button onClick={reopen} loading={reopening} loadingLabel={text.reopening}>
                {text.reopen}
              </Button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
