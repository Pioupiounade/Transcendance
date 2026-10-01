import { isApiError } from '@/shared/api';
import { ACTIONS_LABELS } from './labels';

const t = ACTIONS_LABELS.errors;

const describe = (error: unknown, rejected: (reason: string) => string): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.status === 403) return t.notAllowed;
  if (error.status === 404) return t.notFound;
  // 400 : règle métier ou validation du DTO ; le backend explique en anglais.
  if (error.status === 400 && error.messages.length > 0) return rejected(error.messages.join(' '));
  return t.unknown;
};

/** Traduit une erreur de création, modification ou annulation d'action en message affichable. */
export const toActionErrorMessage = (error: unknown): string => describe(error, t.rejected);

/** Traduit une erreur d'envoi de commentaire. */
export const toCommentErrorMessage = (error: unknown): string => describe(error, t.commentRejected);
