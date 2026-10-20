import { useRef, useState, type ChangeEvent } from 'react';
import { Button, Icon } from '@/shared/ui';
import { toPhotoErrorMessage } from '../errors';
import { ACTIONS_LABELS } from '../labels';
import { PHOTO_ACCEPT, PHOTO_MAX_COUNT, PHOTO_MAX_MB, validatePhotos } from '../validation';
import styles from './PhotoPicker.module.css';

type PhotoPickerProps = {
  id: string;
  label: string;
  /** Photos déjà comptées contre le plafond de la liste (en base et déjà choisies). */
  stored: number;
  /** Reçoit les fichiers valides ; une promesse rejetée s'affiche sous le bouton. */
  onPick: (files: File[]) => Promise<void> | void;
  loadingLabel?: string;
};

const text = ACTIONS_LABELS.photos;

/** Bouton « ajouter des photos » : sélecteur de fichiers caché, validation miroir de l'upload, erreur en ligne. */
export function PhotoPicker({ id, label, stored, onPick, loadingLabel }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    const invalid = validatePhotos(files, stored);
    setError(invalid);
    if (invalid) return;
    setBusy(true);
    try {
      await onPick(files);
    } catch (uploadError) {
      setError(toPhotoErrorMessage(uploadError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.picker}>
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={stored >= PHOTO_MAX_COUNT}
        loading={busy}
        loadingLabel={loadingLabel}
        aria-describedby={`${id}-help`}
      >
        <Icon name="plus" size={16} />
        {label}
      </Button>
      <input ref={inputRef} id={id} type="file" accept={PHOTO_ACCEPT} multiple hidden onChange={handleChange} />
      <p id={`${id}-help`} className={error ? styles.error : styles.help} role={error ? 'alert' : undefined}>
        {error && <Icon name="alert" size={14} strokeWidth={2.4} />}
        <span>{error ?? text.help(PHOTO_MAX_COUNT, PHOTO_MAX_MB)}</span>
      </p>
    </div>
  );
}
