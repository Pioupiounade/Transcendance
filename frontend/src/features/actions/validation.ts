import { ACTIONS_LABELS } from './labels';
import { CATEGORY, type Category } from './types';

/** Miroir de `CreateActionDto` (docs/api_contract.md §15) et des règles du service. */
export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 600;
/** Le backend refuse `max_participants` sous 3. */
export const MAX_PARTICIPANTS_MIN = 3;
export const MAX_PARTICIPANTS_LIMIT = 100;

const t = ACTIONS_LABELS.validation;

export const validateTitle = (value: string): string | null => {
  const title = value.trim();
  if (title === '') return t.titleRequired;
  if (title.length > TITLE_MAX_LENGTH) return t.tooLong(TITLE_MAX_LENGTH);
  return null;
};

export const validateDescription = (value: string): string | null => {
  const description = value.trim();
  if (description === '') return t.descriptionRequired;
  if (description.length > DESCRIPTION_MAX_LENGTH) return t.tooLong(DESCRIPTION_MAX_LENGTH);
  return null;
};

/** Miroir de `CreateCommentDto` : non vide, ≤ 1024 caractères. */
export const COMMENT_MAX_LENGTH = 1024;

export const validateComment = (value: string): string | null => {
  const content = value.trim();
  if (content === '') return t.commentRequired;
  if (content.length > COMMENT_MAX_LENGTH) return t.tooLong(COMMENT_MAX_LENGTH);
  return null;
};

export const isCategory = (value: string): value is Category => Object.values<string>(CATEGORY).includes(value);

export const validateCategory = (value: string): string | null => (isCategory(value) ? null : t.categoryRequired);

/** Miroir de l'upload `photo-before` / `photo-after` : extension, 10 Mo par fichier, 3 photos par liste. */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PHOTO_MAX_MB = 10;
export const PHOTO_MAX_COUNT = 3;
const PHOTO_EXTENSION = /\.(jpg|jpeg|png|webp)$/i;

/** `stored` = photos déjà comptées dans la liste (en base et déjà choisies). */
export const validatePhotos = (files: readonly File[], stored: number): string | null => {
  if (files.some((file) => !PHOTO_EXTENSION.test(file.name))) return t.photoType;
  if (files.some((file) => file.size > PHOTO_MAX_MB * 1024 * 1024)) return t.photoTooLarge(PHOTO_MAX_MB);
  if (stored + files.length > PHOTO_MAX_COUNT) return t.photoTooMany(PHOTO_MAX_COUNT);
  return null;
};

/** Valeur d'un `datetime-local` (`YYYY-MM-DDTHH:mm`, heure locale) : requise, valide, à venir. */
export const validateScheduledAt = (value: string): string | null => {
  if (value === '') return t.dateRequired;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t.dateInvalid;
  if (date.getTime() <= Date.now()) return t.datePast;
  return null;
};

/** Optionnel ; sinon entier ≥ 3. */
export const validateMaxParticipants = (value: string): string | null => {
  if (value.trim() === '') return null;

  const count = Number(value);

  if (
    !Number.isInteger(count) ||
    count < MAX_PARTICIPANTS_MIN ||
    count > MAX_PARTICIPANTS_LIMIT
  ) {
    return t.maxParticipantsInvalid(MAX_PARTICIPANTS_MIN);
  }

  return null;
};

/** `YYYY-MM-DDTHH:mm` en heure locale, la forme d'un `datetime-local`. */
const toLocalDateTimeInput = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

/** Valeur `min` d'un `datetime-local` : maintenant, en heure locale, à la minute. */
export const localDateTimeNow = (): string => {
  const now = new Date();
  now.setSeconds(0, 0);
  return toLocalDateTimeInput(now);
};

/** Date ISO de l'API → valeur d'un `datetime-local` ; chaîne vide si invalide. */
export const toLocalDateTimeValue = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : toLocalDateTimeInput(date);
};
