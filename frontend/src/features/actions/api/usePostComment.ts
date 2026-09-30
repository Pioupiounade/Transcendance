import { useCallback } from 'react';
import { postComment } from './commentsApi';

/** Mutation « commenter une action » ; même rôle que `useCreateAction`. */
export function usePostComment() {
  return useCallback((actionId: string, content: string) => postComment(actionId, content), []);
}
