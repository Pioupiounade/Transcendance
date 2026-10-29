import { ORGANIZATIONS_LABELS } from './labels';

const t = ORGANIZATIONS_LABELS.validation;

/** Miroir de `OrganizationCommentDto` : non vide, ≤ 1024 caractères (le backend accepte des espaces seuls, pas nous). */
export const COMMENT_MAX_LENGTH = 1024;

/** Description d'une organisation : obligatoire, ≤ 500 caractères (règle du frontend, le DTO n'en fixe aucune). */
export const DESCRIPTION_MAX_LENGTH = 500;

export const validateDescription = (value: string): string | null => {
  const description = value.trim();
  if (description === '') return t.required;
  if (description.length > DESCRIPTION_MAX_LENGTH) return t.tooLong(DESCRIPTION_MAX_LENGTH);
  return null;
};

/** Nom et adresse : obligatoires et bornés côté client (le DTO ne fixe rien ; au-delà de 100 Ko de body, 413). */
export const TITLE_MAX_LENGTH = 80;
export const ADDRESS_MAX_LENGTH = 200;

const validateBounded = (value: string, max: number): string | null => {
  const text = value.trim();
  if (text === '') return t.required;
  if (text.length > max) return t.tooLong(max);
  return null;
};

export const validateTitle = (value: string): string | null => validateBounded(value, TITLE_MAX_LENGTH);
export const validateAddress = (value: string): string | null => validateBounded(value, ADDRESS_MAX_LENGTH);

export const validateComment = (value: string): string | null => {
  const content = value.trim();
  if (content === '') return t.commentRequired;
  if (content.length > COMMENT_MAX_LENGTH) return t.tooLong(COMMENT_MAX_LENGTH);
  return null;
};
