import { useCallback } from 'react';
import { cancelAction } from './actionsApi';

/** Mutation « annuler une action » ; même rôle que `useCreateAction`. */
export function useCancelAction() {
  return useCallback((id: string) => cancelAction(id), []);
}
