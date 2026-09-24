import { isApiError } from '@/shared/api';
import { ACTIONS_LABELS } from './labels';

const t = ACTIONS_LABELS.errors;

/** Traduit une erreur de création d'action en message affichable. */
export const toActionErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.status === 403) return t.notAllowed;
  // 400 : règle métier ou validation du DTO ; le backend explique en anglais.
  if (error.status === 400 && error.messages.length > 0) return t.rejected(error.messages.join(' '));
  return t.unknown;
};
