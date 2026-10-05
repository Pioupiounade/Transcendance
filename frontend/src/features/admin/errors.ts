import { isApiError } from '@/shared/api';
import { ADMIN_LABELS } from './labels';

const t = ADMIN_LABELS.errors;

/** Traduit une erreur de blocage ou de déblocage en message affichable. */
export const toAdminErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.status === 403) return t.notAllowed;
  if (error.status === 404) return t.notFound;
  // 400 : règle métier (déjà bloqué, compte désactivé) ; le backend explique en anglais.
  if (error.status === 400 && error.messages.length > 0) return t.rejected(error.messages.join(' '));
  return t.unknown;
};
