import { ACTIONS_LABELS } from './labels';
import { CATEGORY, type Category } from './types';

/** Miroir de `CreateActionDto` (docs/api_contract.md §15) et des règles du service. */
export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 600;
/** Le backend refuse `max_participants` sous 3. */
export const MAX_PARTICIPANTS_MIN = 3;

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

export const isCategory = (value: string): value is Category => Object.values<string>(CATEGORY).includes(value);

export const validateCategory = (value: string): string | null => (isCategory(value) ? null : t.categoryRequired);

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
  if (!Number.isInteger(count) || count < MAX_PARTICIPANTS_MIN) return t.maxParticipantsInvalid(MAX_PARTICIPANTS_MIN);
  return null;
};

/** Valeur `min` d'un `datetime-local` : maintenant, en heure locale, à la minute. */
export const localDateTimeNow = (): string => {
  const now = new Date();
  now.setSeconds(0, 0);
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};
