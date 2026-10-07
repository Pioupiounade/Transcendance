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

/** Champ texte obligatoire (nom, adresse). */
export const validateRequired = (value: string): string | null => (value.trim() === '' ? t.required : null);

export const validateComment = (value: string): string | null => {
  const content = value.trim();
  if (content === '') return t.commentRequired;
  if (content.length > COMMENT_MAX_LENGTH) return t.tooLong(COMMENT_MAX_LENGTH);
  return null;
};
