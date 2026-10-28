import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import type { Organization } from '@/features/organizations';
import { useForm } from '@/shared/hooks/useForm';
import { Button, FloatingField, FloatingTextarea, Icon } from '@/shared/ui';
import { fetchManageableOrganizations } from '../api/actionOrganizations';
import { useCreateAction } from '../api/useCreateAction';
import { useUpdateAction } from '../api/useUpdateAction';
import { useUploadPhotosBefore } from '../api/useUploadPhotosBefore';
import { toActionErrorMessage } from '../errors';
import { ACTIONS_LABELS, CATEGORY_ICONS, CATEGORY_LABELS } from '../labels';
import { ACTION_STATUS, CATEGORY, type ActionRecord, type LatLng } from '../types';

import {
  DESCRIPTION_MAX_LENGTH,
  MAX_PARTICIPANTS_MIN,
  MAX_PARTICIPANTS_LIMIT,
  TITLE_MAX_LENGTH,
  isCategory,
  localDateTimeNow,
  toLocalDateTimeValue,
  validateCategory,
  validateDescription,
  validateMaxParticipants,
  validateScheduledAt,
  validateTitle,
} from '../validation';
import styles from './ActionForm.module.css';
import { PhotoPicker } from './PhotoPicker';

type ActionFormProps = {
  /** Lieu choisi sur la carte ; `null` = pas encore choisi (le formulaire le réclame à l'envoi). */
  location: LatLng | null;
  /** Présente = modification de cette action (`PATCH`) ; absente = création (`POST`). */
  action?: ActionRecord;
  /** `failedPhotos` : noms des photos « avant » choisies que l'upload a refusées (l'action reste enregistrée). */
  onSaved: (action: ActionRecord, failedPhotos: string[]) => void;
  onCancel: () => void;
};

type Values = { title: string; description: string; category: string; scheduledAt: string; maxParticipants: string };

const text = ACTIONS_LABELS.form;
const photoText = ACTIONS_LABELS.photos;

const toValues = (action: ActionRecord | undefined): Values =>
  action
    ? {
        title: action.title,
        description: action.description,
        category: action.category,
        scheduledAt: toLocalDateTimeValue(action.scheduled_at),
        maxParticipants: action.max_participants?.toString() ?? '',
      }
    : { title: '', description: '', category: '', scheduledAt: '', maxParticipants: '' };

/**
 * Formulaire d'action, création ou modification : validation miroir du DTO, envoi, erreurs serveur,
 * focus sur le premier champ invalide. Le parent fournit le lieu et reçoit l'action enregistrée.
 */
export function ActionForm({ location, action, onSaved, onCancel }: ActionFormProps) {
  const create = useCreateAction();
  const update = useUpdateAction();
  const uploadPhotos = useUploadPhotosBefore();
  const [photos, setPhotos] = useState<File[]>([]);
  const [initial] = useState(() => toValues(action));
  const [spotMissing, setSpotMissing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');

  const { user } = useAuth();
  const userId = user?.user_id ?? null;
  // Photos « avant » : rôle créateur comme le backend ; la condition PENDING n'est vérifiée que côté UI.
  const canAddPhotos = !action || (action.creator_id === userId && action.status === ACTION_STATUS.PENDING);

  // Création seulement : les organisations que je gère, pour le choix facultatif. En cas d'échec la liste reste
  // vide et l'action se crée sans organisation.
  useEffect(() => {
    if (action || userId === null) return;
    const controller = new AbortController();
    fetchManageableOrganizations(userId, controller.signal)
      .then(setOrganizations)
      .catch(() => undefined);
    return () => controller.abort();
  }, [action, userId]);

  const form = useForm<Values>(
    initial,
    {
      title: validateTitle,
      description: validateDescription,
      category: validateCategory,
      // Une date déjà passée reste acceptée tant qu'elle n'est pas modifiée (action en cours).
      scheduledAt: (value) => (action && value === initial.scheduledAt ? null : validateScheduledAt(value)),
      maxParticipants: validateMaxParticipants,
    },
    async (values) => {
      if (!isCategory(values.category)) return; // exclu par la validation
      if (location === null) {
        setSpotMissing(true);
        document.getElementById('spot')?.focus();
        return;
      }
      const input = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        location,
        scheduled_at: new Date(values.scheduledAt).toISOString(),

        ...(values.maxParticipants.trim() !== '' && {
          max_participants: Number(values.maxParticipants),
        }),

        ...(!action &&
          organizationId !== '' && {
            organization_id: Number(organizationId),
          }),
      };
      const saved = action
        ? await update(action.action_id, {
            ...input,
            images_before: action.images_before,
            images_after: action.images_after,
          })
        : await create(input);
      onSaved(saved, await uploadPhotos(saved.action_id, photos));
    },
    toActionErrorMessage,
  );

  const categoryError = form.errorOf('category');
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
        label={text.title}
        maxLength={TITLE_MAX_LENGTH}
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
        maxLength={DESCRIPTION_MAX_LENGTH}
        value={form.values.description}
        onChange={(event) => form.setValue('description', event.target.value)}
        onBlur={() => form.touch('description')}
        error={form.errorOf('description')}
      />

      <fieldset
        id="category"
        tabIndex={-1}
        className={[styles.group, categoryError && styles.invalid].filter(Boolean).join(' ')}
        aria-describedby={categoryError ? 'category-help' : undefined}
      >
        <legend className={styles.legend}>{text.category}</legend>
        <div className={styles.options}>
          {Object.values(CATEGORY).map((category) => (
            <label key={category} className={styles.option}>
              <input
                type="radio"
                name="category"
                value={category}
                checked={form.values.category === category}
                onChange={() => form.setValue('category', category)}
                onBlur={() => form.touch('category')}
              />
              <Icon name={CATEGORY_ICONS[category]} size={18} />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
        {categoryError && (
          <p id="category-help" className={styles.error}>
            <Icon name="alert" size={14} strokeWidth={2.4} />
            <span>{categoryError}</span>
          </p>
        )}
      </fieldset>

      {/* Création seulement : en mon nom ou pour une organisation que je gère. Des puces plutôt qu'un menu
          déroulant : rien ne dépasse de l'écran sur téléphone, et le choix est visible d'un coup d'œil. */}
      {!action && organizations.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{text.createAs}</legend>
          <div className={styles.options}>
            <label className={styles.option}>
              <input
                type="radio"
                name="organization"
                value=""
                checked={organizationId === ''}
                onChange={() => setOrganizationId('')}
              />
              <Icon name="user" size={18} />
              {text.myself}
            </label>
            {organizations.map((organization) => (
              <label key={organization.organization_id} className={styles.option}>
                <input
                  type="radio"
                  name="organization"
                  value={organization.organization_id}
                  checked={organizationId === organization.organization_id}
                  onChange={() => setOrganizationId(organization.organization_id)}
                />
                <Icon name="building" size={18} />
                {organization.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className={styles.row}>
        <FloatingField
          id="scheduledAt"
          type="datetime-local"
          label={text.scheduledAt}
          min={localDateTimeNow()}
          value={form.values.scheduledAt}
          onChange={(event) => form.setValue('scheduledAt', event.target.value)}
          onBlur={() => form.touch('scheduledAt')}
          error={form.errorOf('scheduledAt')}
        />
        <FloatingField
          id="maxParticipants"
          type="number"
          inputMode="numeric"
          min={MAX_PARTICIPANTS_MIN}
          max={MAX_PARTICIPANTS_LIMIT}
          step={1}
          label={text.maxParticipants}
          help={text.maxParticipantsHelp(MAX_PARTICIPANTS_MIN)}
          value={form.values.maxParticipants}
          onChange={(event) => form.setValue('maxParticipants', event.target.value)}
          onBlur={() => form.touch('maxParticipants')}
          error={form.errorOf('maxParticipants')}
        />
      </div>

      {canAddPhotos && (
        <div className={styles.group}>
          <p className={styles.legend}>{photoText.formLabel}</p>
          <PhotoPicker
            id="photosBefore"
            label={photoText.add}
            stored={(action?.images_before.length ?? 0) + photos.length}
            onPick={(files) => setPhotos((previous) => [...previous, ...files])}
          />
          {photos.length > 0 && (
            <ul className={styles.photos}>
              {photos.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {form.serverError && (
        <p className={styles.serverError} role="alert">
          {form.serverError}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={form.submitting}>
          {text.cancel}
        </Button>
        <Button
          type="submit"
          loading={form.submitting}
          loadingLabel={action ? text.saving : text.submitting}
        >
          {action ? text.save : text.submit}
        </Button>
      </div>
    </form>
  );
}
