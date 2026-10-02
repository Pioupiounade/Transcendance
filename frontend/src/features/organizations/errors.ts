import { isApiError } from '@/shared/api';
import { ORGANIZATIONS_LABELS } from './labels';

const t = ORGANIZATIONS_LABELS.errors;

export type JoinFailure = { state: 'pending' | 'declined' | 'banned' | 'member' | 'error'; message: string };

/**
 * Traduit le refus d'une demande d'adhésion. Le backend répond 409 pour trois situations distinctes, qui ne se
 * distinguent que par leur message : c'est la seule façon pour un demandeur de connaître l'état de sa demande.
 */
export const toJoinFailure = (error: unknown): JoinFailure => {
  const m = ORGANIZATIONS_LABELS.membership;
  const fail = (message: string): JoinFailure => ({ state: 'error', message });
  if (!isApiError(error)) return fail(t.unknown);
  if (error.isNetwork) return fail(t.network);
  const reason = error.messages.join(' ');
  if (error.status === 409 && /pending/i.test(reason)) return { state: 'pending', message: m.pending };
  if (error.status === 409 && /rejected/i.test(reason)) return { state: 'declined', message: m.declined };
  if (error.status === 409) return { state: 'member', message: m.alreadyMember };
  if (error.status === 403 && /banned/i.test(reason)) return { state: 'banned', message: m.banned };
  if (error.status === 401) return fail(t.signedOut);
  if (error.status === 403) return fail(t.notAllowed);
  if (error.messages.length > 0) return fail(t.joinRejected(reason));
  return fail(t.unknown);
};

/** Traduit une erreur de gestion (adhésions, rôles, réglages) : le backend explique ses refus en anglais. */
export const toManageErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.messages.length > 0) return t.manageRejected(error.messages.join(' '));
  if (error.status === 403) return t.notAllowed;
  return t.unknown;
};

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
