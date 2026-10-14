import { isApiError } from '@/shared/api';
import { AUTH_LABELS } from './labels';

const EMAIL_TAKEN = 'Email is already used';

type AuthFailure = {
  success: false;
  reason:
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_DISABLED'
    | 'EMAIL_TAKEN';
};

const isAuthFailure = (error: unknown): error is AuthFailure => {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as Partial<AuthFailure>;

  return (
    candidate.success === false &&
    (
      candidate.reason === 'INVALID_CREDENTIALS' ||
      candidate.reason === 'ACCOUNT_DISABLED' ||
      candidate.reason === 'EMAIL_TAKEN'
    )
  );
};

/** Traduit une erreur de `signIn` / `signUp` en message affichable. */
export const toAuthErrorMessage = (error: unknown): string => {
  if (isAuthFailure(error)) {
    if (error.reason === 'INVALID_CREDENTIALS') {
      return AUTH_LABELS.errors.invalidCredentials;
    }

    if (error.reason === 'ACCOUNT_DISABLED') {
      return AUTH_LABELS.errors.accountDisabled;
    }

    if (error.reason === 'EMAIL_TAKEN') {
      return AUTH_LABELS.errors.emailTaken;
    }
  }

  if (!isApiError(error)) return AUTH_LABELS.errors.unknown;
  if (error.isNetwork) return AUTH_LABELS.errors.network;
  if (error.status === 401) return AUTH_LABELS.errors.invalidCredentials;
  if (error.status === 400 && error.messages.includes(EMAIL_TAKEN)) {
    return AUTH_LABELS.errors.emailTaken;
  }
  if (error.status === 403) return AUTH_LABELS.errors.disabled;

  return AUTH_LABELS.errors.unknown;
};
