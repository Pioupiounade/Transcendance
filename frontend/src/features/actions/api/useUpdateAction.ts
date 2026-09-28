import { useCallback } from 'react';
import { updateAction, type UpdateActionInput } from './actionsApi';

/** Mutation « modifier une action » ; même rôle que `useCreateAction`. */
export function useUpdateAction() {
  return useCallback((id: string, input: UpdateActionInput) => updateAction(id, input), []);
}
