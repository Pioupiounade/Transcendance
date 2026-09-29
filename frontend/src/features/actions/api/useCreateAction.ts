import { useCallback } from 'react';
import { createAction, type CreateActionInput } from './actionsApi';

/**
 * Mutation « créer une action ». Les composants ne voient que ce hook (jamais `actionsApi`),
 * ce qui rend TanStack Query (`useMutation`) branchable sans les toucher.
 */
export function useCreateAction() {
  return useCallback((input: CreateActionInput) => createAction(input), []);
}
