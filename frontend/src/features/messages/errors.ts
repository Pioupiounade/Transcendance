import { isApiError } from '@/shared/api';
import { MESSAGES_LABELS } from './labels';
import { MESSAGE_MAX_LENGTH } from './types';

/** Règle du contenu avant envoi : vide ou trop long. */
export const validateMessage = (content: string): string | null => {
  if (content.length === 0) return MESSAGES_LABELS.errors.empty;
  if (content.length > MESSAGE_MAX_LENGTH) return MESSAGES_LABELS.errors.tooLong(MESSAGE_MAX_LENGTH);
  return null;
};

/** Traduction d'un échec d'envoi : 403 = plus amis (ou compte inactif), 400 = contenu refusé, sinon générique. */
export const toSendErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    if (error.status === 403) return MESSAGES_LABELS.errors.notFriends;
    if (error.status === 400) return MESSAGES_LABELS.errors.tooLong(MESSAGE_MAX_LENGTH);
  }
  return MESSAGES_LABELS.errors.sendFailed;
};
