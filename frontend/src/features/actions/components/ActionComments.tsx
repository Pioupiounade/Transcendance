import { useId, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { AUTH_ROUTES, useAuth } from '@/features/auth';
import { isApiError } from '@/shared/api';
import { Button, CommentComposer, CommentThread, type ThreadComment } from '@/shared/ui';
import { useActionComments } from '../api/useActionComments';
import { usePostComment } from '../api/usePostComment';
import { toCommentErrorMessage } from '../errors';
import { ACTIONS_LABELS } from '../labels';
import type { ActionComment } from '../types';
import { COMMENT_MAX_LENGTH, validateComment } from '../validation';
import styles from './ActionComments.module.css';

type ActionCommentsProps = {
  /** Id réel (numérique) de l'action : la discussion vit dans l'API. */
  actionId: string;
  canComment: boolean;
};

const text = ACTIONS_LABELS.comments;
const COMMENT_COOLDOWN_MS = 15_000;

const cooldownKey = (actionId: string) => `action-comment-cooldown:${actionId}`;

const readCooldownUntil = (actionId: string): number => {
  const stored = window.sessionStorage.getItem(cooldownKey(actionId));
  const until = stored === null ? 0 : Number(stored);
  return Number.isFinite(until) && until > Date.now() ? until : 0;
}

const toThreadComment = (comment: ActionComment, myUserId: string | null): ThreadComment => ({
  id: comment.comment_id,
  authorId: comment.user_id,
  author: comment.user.profile?.username ?? text.anonymousAuthor,
  avatar: comment.user.profile?.profile_picture,
  createdAt: comment.created_at,
  content: comment.content,
  mine: comment.user_id === myUserId,
});

/**
 * Discussion publique d'une action (Epic 4, #70) : lecture pour tous, écriture connecté (lien de connexion sinon),
 * plus récent en premier, mon nouveau commentaire s'insère en tête. Pas d'édition ni de suppression (API).
 */
export function ActionComments({ actionId, canComment }: ActionCommentsProps) {
  const titleId = useId();
  const { status, user } = useAuth();
  const location = useLocation();
  const { comments, loading, notFound, error, reload, prepend } = useActionComments(actionId);

  useEffect(() => {
    const handleCommentsChanged = (event: Event) => {
      const { actionId: changedActionId } = (
        event as CustomEvent<{ actionId: string }>
      ).detail;

      if (changedActionId !== actionId) return;

      reload();
    };

    window.addEventListener('action:comments-changed', handleCommentsChanged);

    return () => {
      window.removeEventListener(
        'action:comments-changed',
        handleCommentsChanged,
      );
    };
  }, [actionId, reload]);

  const postComment = usePostComment();

  const [cooldownUntil, setCooldownUntil] = useState(() => readCooldownUntil(actionId));
  const isCoolingDown = cooldownUntil !== 0;

  // Fin du délai par minuteur (0 ms s'il est déjà écoulé) : jamais de setState synchrone dans l'effet.
  useEffect(() => {
    if (cooldownUntil === 0) return;
    const timeout = window.setTimeout(() => setCooldownUntil(0), Math.max(0, cooldownUntil - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [cooldownUntil]);

  const submit = async (content: string) => {
    if (isCoolingDown) return;

    try {
      const comment = await postComment(actionId, content);
      prepend(comment);

      const until = Date.now() + COMMENT_COOLDOWN_MS;
      window.sessionStorage.setItem(cooldownKey(actionId), String(until));
      setCooldownUntil(until);
    } catch (error: unknown) {
      // 429 : le backend impose lui aussi 15 s entre deux commentaires d'un même compte (api_contract §15).
      if (isApiError(error) && error.status === 429) {
        const until = Date.now() + COMMENT_COOLDOWN_MS;
        window.sessionStorage.setItem(cooldownKey(actionId), String(until));
        setCooldownUntil(until);
      }
      throw error; 
    }
  };
  const items = comments.map((comment) => toThreadComment(comment, user?.user_id ?? null));
  const ready = !loading && error === null;

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {text.title}
        </h2>
        {ready && <span className={styles.count}>{items.length}</span>}
      </div>

      {status === 'authenticated' && canComment && (
        <CommentComposer
          label={text.label}
          maxLength={COMMENT_MAX_LENGTH}
          submitLabel={text.submit}
          submittingLabel={text.submitting}
          validate={validateComment}
          onSubmit={submit}
          describeError={toCommentErrorMessage}
          disabled={isCoolingDown}
        />
      )}
      {status === 'anonymous' && (
        <p className={styles.signIn}>
          <Link to={AUTH_ROUTES.login} state={{ from: location }}>
            {text.signIn}
          </Link>
        </p>
      )}

      {loading && (
        <p className={styles.muted} role="status">
          {text.loading}
        </p>
      )}
      {error && (
        <div className={styles.state} role="alert">
          <p>{notFound ? text.notFound : text.error}</p>
          {!notFound && (
            <Button variant="text" onClick={reload}>
              {text.retry}
            </Button>
          )}
        </div>
      )}
      {ready && items.length === 0 && <p className={styles.muted}>{text.empty}</p>}
      {ready && items.length > 0 && <CommentThread comments={items} mineLabel={text.you} />}
    </section>
  );
}
