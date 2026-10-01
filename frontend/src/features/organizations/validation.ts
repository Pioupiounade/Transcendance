import { ORGANIZATIONS_LABELS } from './labels';

const t = ORGANIZATIONS_LABELS.validation;

/** Miroir de `OrganizationCommentDto` : non vide, ≤ 1024 caractères (le backend accepte des espaces seuls, pas nous). */
export const COMMENT_MAX_LENGTH = 1024;

export const validateComment = (value: string): string | null => {
  const content = value.trim();
  if (content === '') return t.commentRequired;
  if (content.length > COMMENT_MAX_LENGTH) return t.tooLong(COMMENT_MAX_LENGTH);
  return null;
};
