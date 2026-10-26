import { isApiError } from '@/shared/api';

/** Message lisible pour une erreur d'API du profil : les messages du backend, sinon le repli fourni. */
export function toProfileErrorMessage(error: unknown, fallback: string): string {
  return isApiError(error) && error.messages.length > 0 ? error.messages.join(' ') : fallback;
}
