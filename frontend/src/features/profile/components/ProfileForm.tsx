import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Avatar, Button, FloatingField, FloatingTextarea, Icon, type IconName } from '@/shared/ui';
import { isUsernameAvailable } from '../api/profileApi';
import {
  INTEREST_FAMILIES,
  INTEREST_FAMILY_ICONS,
  INTEREST_FAMILY_LABELS,
  INTERESTS_BY_FAMILY,
} from '../interestLabels';
import { PROFILE_LABELS } from '../labels';
import type { InterestCategory, ProfileVisibility, UserProfile } from '../types';
import { InterestTag } from './InterestTag';
import { NeighbourhoodPicker, type PickedLocation } from './NeighbourhoodPicker';
import panels from './ProfilePanels.module.css';
import styles from './ProfileForm.module.css';

type ProfileFormProps = {
  /** Sans `initialData` : création. */
  initialData?: UserProfile;
  initialInterests?: readonly InterestCategory[];
  onSave: (profile: UserProfile, interests: InterestCategory[], avatar: File | null) => void;
  onCancel: () => void;
  isSaving?: boolean;
  /** Erreur renvoyée par l'enregistrement (la page la possède). */
  error?: string | null;
};

const text = PROFILE_LABELS.form;
const USERNAME_PATTERN = /^[a-z0-9_]{4,15}$/;
const DESCRIPTION_MAX = 300;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const VISIBILITIES: readonly ProfileVisibility[] = ['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'];
const VISIBILITY_ICONS: Record<ProfileVisibility, IconName> = { PUBLIC: 'users', FRIENDS_ONLY: 'heart', PRIVATE: 'lock' };

const EMPTY_PROFILE: UserProfile = { username: '', location: null, description: '', visibility: 'PUBLIC', profilePicture: '' };

const toPicked = (location: UserProfile['location']): PickedLocation | null =>
  location ? [location.latitude, location.longitude] : null;

/**
 * Créer ou modifier son profil : identité (photo, pseudo, présentation, visibilité, intérêts) à gauche,
 * quartier sur la carte à droite. Validation miroir du backend ; les intérêts sont enregistrés par la page.
 */
export function ProfileForm({ initialData, initialInterests = [], onSave, onCancel, isSaving = false, error }: ProfileFormProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  const [formData, setFormData] = useState<UserProfile>(initialData ?? EMPTY_PROFILE);
  const [interests, setInterests] = useState<InterestCategory[]>([...initialInterests]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsernameError(null);
    const username = event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);
    setFormData((current) => ({ ...current, username }));
  };

  const onDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const description = event.target.value.slice(0, DESCRIPTION_MAX);
    setFormData((current) => ({ ...current, description }));
  };

  const onVisibilityChange = (visibility: ProfileVisibility) => setFormData((current) => ({ ...current, visibility }));

  const onLocationChange = useCallback((picked: PickedLocation) => {
    setLocationError(null);
    setFormData((current) => ({ ...current, location: { latitude: picked[0], longitude: picked[1] } }));
  }, []);

  const toggleInterest = (interest: InterestCategory) =>
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );

  const locate = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError(text.geoUnsupported);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      (failure) => {
        setLocating(false);
        setLocationError(failure.code === failure.PERMISSION_DENIED ? text.geoDenied : text.geoFailed);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError(text.photoInvalidType);
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError(text.photoTooLarge);
      return;
    }

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);
    setAvatar(file);
    setFormData((current) => ({ ...current, profilePicture: previewUrl.current ?? undefined }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const usernameInvalid = !USERNAME_PATTERN.test(formData.username);
    const locationMissing = !formData.location;
    if (usernameInvalid) setUsernameError(text.usernameInvalid);
    if (locationMissing) setLocationError(text.locationMissing);
    if (usernameInvalid || locationMissing) {
      document.getElementById(usernameInvalid ? 'username' : 'locate')?.focus();
      return;
    }

    try {
      if (formData.username !== initialData?.username && !(await isUsernameAvailable(formData.username))) {
        setUsernameError(text.usernameTaken);
        document.getElementById('username')?.focus();
        return;
      }
    } catch {
      setUsernameError(text.usernameCheckFailed);
      return;
    }

    onSave(formData, interests, avatar);
  };

  const creating = !initialData;
  const descriptionLength = formData.description?.length ?? 0;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={isSaving || undefined}>
      <div className={styles.columns}>
        <section className={[panels.panel, styles.identity].join(' ')} aria-labelledby="profile-form-identity">
          <h2 id="profile-form-identity">{text.identity}</h2>
          <p className={panels.muted}>{text.required}</p>

          <div className={styles.photo}>
            <Avatar name={formData.username || '?'} src={formData.profilePicture} size={96} className={styles.photoAvatar} />
            <div className={styles.photoText}>
              <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={isSaving}>
                <Icon name="plus" size={16} strokeWidth={2.2} />
                {text.photo}
              </Button>
              <p className={[styles.hint, avatarError && styles.hintError].filter(Boolean).join(' ')} role={avatarError ? 'alert' : undefined}>
                {avatarError && <Icon name="alert" size={14} strokeWidth={2.4} />}
                {avatarError ?? text.photoHelp}
              </p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES.join(', ')}
              hidden
              onChange={onAvatarChange}
              aria-label={text.photo}
            />
          </div>

          <FloatingField
            id="username"
            name="username"
            label={text.username}
            value={formData.username}
            onChange={onUsernameChange}
            error={usernameError}
            help={text.usernameHelp}
            autoComplete="username"
            disabled={isSaving}
          />

          <FloatingTextarea
            id="description"
            name="description"
            label={text.description}
            value={formData.description ?? ''}
            onChange={onDescriptionChange}
            rows={4}
            maxLength={DESCRIPTION_MAX}
            help={text.descriptionHelp(descriptionLength, DESCRIPTION_MAX)}
            disabled={isSaving}
          />

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{text.visibility}</legend>
            <div className={styles.options}>
              {VISIBILITIES.map((visibility) => (
                <label key={visibility} className={styles.option}>
                  <input
                    type="radio"
                    name="visibility"
                    value={visibility}
                    className={styles.radio}
                    checked={formData.visibility === visibility}
                    onChange={() => onVisibilityChange(visibility)}
                    disabled={isSaving}
                  />
                  <span className={styles.optionIcon}>
                    <Icon name={VISIBILITY_ICONS[visibility]} size={18} />
                  </span>
                  <span className={styles.optionText}>
                    <strong>{PROFILE_LABELS.visibility[visibility].label}</strong>
                    <span>{PROFILE_LABELS.visibility[visibility].body}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{text.interests}</legend>
            <p className={styles.hint}>{text.interestsHelp}</p>
            {INTEREST_FAMILIES.map((family) => (
              <div key={family} className={styles.family}>
                <p className={panels.subhead}>
                  <Icon name={INTEREST_FAMILY_ICONS[family]} size={14} />
                  {INTEREST_FAMILY_LABELS[family]}
                </p>
                <div className={panels.tags}>
                  {INTERESTS_BY_FAMILY[family].map((interest) => (
                    <InterestTag
                      key={interest}
                      interest={interest}
                      pressed={interests.includes(interest)}
                      onToggle={toggleInterest}
                      disabled={isSaving}
                    />
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        </section>

        <section className={[panels.panel, styles.place].join(' ')} aria-labelledby="profile-form-place">
          <div className={panels.panelHead}>
            <h2 id="profile-form-place">{text.neighbourhood}</h2>
            {formData.location && (
              <span className={styles.ok}>
                <Icon name="check" size={14} strokeWidth={2.4} />
                {text.neighbourhoodSet}
              </span>
            )}
          </div>
          <p className={panels.muted}>{text.neighbourhoodLead}</p>
          <NeighbourhoodPicker location={toPicked(formData.location)} onChange={onLocationChange} label={text.neighbourhood} />
          <div className={styles.placeActions}>
            <Button
              id="locate"
              variant="secondary"
              onClick={locate}
              loading={locating}
              loadingLabel={text.locating}
              disabled={isSaving}
              aria-describedby={locationError ? 'location-error' : undefined}
            >
              <Icon name="target" size={16} />
              {text.locate}
            </Button>
          </div>
          {locationError && (
            <p id="location-error" className={[styles.hint, styles.hintError].join(' ')} role="alert">
              <Icon name="alert" size={14} strokeWidth={2.4} />
              {locationError}
            </p>
          )}
        </section>
      </div>

      {error && (
        <p className={[panels.state, panels.error].join(' ')} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          {text.cancel}
        </Button>
        <Button type="submit" loading={isSaving} loadingLabel={creating ? text.creating : text.saving}>
          {creating ? text.create : text.save}
        </Button>
      </div>
    </form>
  );
}
