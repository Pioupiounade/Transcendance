import { isApiError } from '@/shared/api';
import { AUTH_LABELS } from './labels';

const EMAIL_TAKEN = 'Email is already used'; // docs/api_contract.md §5, POST /auth/register

/** Traduit une erreur de `signIn` / `signUp` en message affichable. */
export const toAuthErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return AUTH_LABELS.errors.unknown;
  if (error.isNetwork) return AUTH_LABELS.errors.network;
  if (error.status === 401) return AUTH_LABELS.errors.invalidCredentials;
  if (error.status === 400 && error.messages.includes(EMAIL_TAKEN)) return AUTH_LABELS.errors.emailTaken;
  if (error.status === 403) return AUTH_LABELS.errors.disabled;
  //if (error.status === XXX) return AUTH_LABELS.errors.suspended;
  return AUTH_LABELS.errors.unknown;
};
