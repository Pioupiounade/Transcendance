import { isApiError } from '@/shared/api';
import { ORGANIZATIONS_LABELS } from './labels';

const t = ORGANIZATIONS_LABELS.errors;

/** Traduit une erreur d'envoi ou de suppression de commentaire en message affichable. */
export const toCommentErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.status === 403) return t.notAllowed;
  if (error.status === 404) return t.notFound;
  if (error.status === 429) return t.tooManyRequests;
  // 400 : validation du DTO ; le backend explique en anglais.
  if (error.status === 400 && error.messages.length > 0) return t.rejected(error.messages.join(' '));
  return t.unknown;
};
