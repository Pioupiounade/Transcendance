import { useState } from 'react';
import type { LatLng } from '@/features/actions';
import { useForm } from '@/shared/hooks/useForm';
import { Button, FloatingField, FloatingTextarea, Icon } from '@/shared/ui';
import { createOrganization } from '../api/organizationsApi';
import { toManageErrorMessage } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { Organization } from '../types';
import { DESCRIPTION_MAX_LENGTH, validateDescription, validateRequired } from '../validation';
import styles from './OrganizationForm.module.css';

type OrganizationFormProps = {
  /** Lieu choisi sur la carte ; `null` = pas encore choisi (le formulaire le réclame à l'envoi). */
  location: LatLng | null;
  onSaved: (organization: Organization) => void;
  onCancel: () => void;
};

type Values = { title: string; description: string; address: string };

const text = ORGANIZATIONS_LABELS.create;
const INITIAL: Values = { title: '', description: '', address: '' };

/**
 * Formulaire de création (#106) : nom, description, adresse ; le lieu vient du parent (carte). Validation miroir
 * de `CreateOrganizationDto`, erreurs serveur, focus sur le premier champ invalide ; rend l'organisation créée.
 */
export function OrganizationForm({ location, onSaved, onCancel }: OrganizationFormProps) {
  const [spotMissing, setSpotMissing] = useState(false);

  const form = useForm<Values>(
    INITIAL,
    { title: validateRequired, description: validateDescription, address: validateRequired },
    async (values) => {
      if (location === null) {
        setSpotMissing(true);
        document.getElementById('spot')?.focus();
        return;
      }
      onSaved(
        await createOrganization({
          title: values.title.trim(),
          description: values.description.trim(),
          address: values.address.trim(),
          location,
        }),
      );
    },
    toManageErrorMessage,
  );

  const spotError = spotMissing && location === null;

  return (
    <form className={styles.form} noValidate onSubmit={form.handleSubmit}>
      <p
        id="spot"
        tabIndex={-1}
        className={[styles.location, spotError && styles.locationMissing].filter(Boolean).join(' ')}
        role={spotError ? 'alert' : undefined}
      >
        <Icon name={spotError ? 'alert' : 'pin'} size={16} />
        {location ? text.location(location[0], location[1]) : spotError ? text.spotMissing : text.pickSpot}
      </p>

      <FloatingField
        id="title"
        type="text"
        label={text.title}
        autoComplete="organization"
        value={form.values.title}
        onChange={(event) => form.setValue('title', event.target.value)}
        onBlur={() => form.touch('title')}
        error={form.errorOf('title')}
      />

      <FloatingTextarea
        id="description"
        label={text.description}
        rows={4}
        maxLength={DESCRIPTION_MAX_LENGTH}
        help={`${form.values.description.length}/${DESCRIPTION_MAX_LENGTH}`}
        value={form.values.description}
        onChange={(event) => form.setValue('description', event.target.value)}
        onBlur={() => form.touch('description')}
        error={form.errorOf('description')}
      />

      <FloatingField
        id="address"
        type="text"
        label={text.address}
        autoComplete="street-address"
        help={text.addressHelp}
        value={form.values.address}
        onChange={(event) => form.setValue('address', event.target.value)}
        onBlur={() => form.touch('address')}
        error={form.errorOf('address')}
      />

      {form.serverError && (
        <p className={styles.serverError} role="alert">
          {form.serverError}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={form.submitting}>
          {text.cancel}
        </Button>
        <Button type="submit" loading={form.submitting} loadingLabel={text.submitting}>
          {text.submit}
        </Button>
      </div>
    </form>
  );
}
