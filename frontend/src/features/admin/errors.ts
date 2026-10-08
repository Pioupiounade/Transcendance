import { isApiError } from '@/shared/api';
import { ADMIN_LABELS } from './labels';

const t = ADMIN_LABELS.errors;

const describe = (error: unknown, notFound: string): string => {
  if (!isApiError(error)) return t.unknown;
  if (error.isNetwork) return t.network;
  if (error.status === 401) return t.signedOut;
  if (error.status === 403) return t.notAllowed;
  if (error.status === 404) return notFound;
  // 400 : règle métier (déjà bloqué, trop peu de participants, organisation inactive) ; le backend explique en anglais.
  if (error.status === 400 && error.messages.length > 0) return t.rejected(error.messages.join(' '));
  return t.unknown;
};

/** Traduit une erreur de blocage ou de déblocage de compte en message affichable. */
export const toAccountErrorMessage = (error: unknown): string => describe(error, t.accountNotFound);

/** Traduit une erreur d'approbation ou de masquage d'action. */
export const toActionErrorMessage = (error: unknown): string => describe(error, t.actionNotFound);

/** Traduit une erreur de suspension, de fermeture ou de réactivation d'organisation. */
export const toOrganizationErrorMessage = (error: unknown): string => describe(error, t.organizationNotFound);
