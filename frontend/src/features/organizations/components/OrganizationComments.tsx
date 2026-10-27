import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { AUTH_ROUTES, useAuth } from '@/features/auth';
import { Button, CommentComposer, CommentThread, type ThreadComment } from '@/shared/ui';
import { postOrganizationComment } from '../api/organizationsApi';
import { useOrganizationComments } from '../api/useOrganizationComments';
import { toCommentErrorMessage, CommentSubmissionError } from '../errors';
import { ORGANIZATIONS_LABELS } from '../labels';
import type { OrganizationComment } from '../types';
import { COMMENT_MAX_LENGTH, validateComment } from '../validation';
import { DeleteCommentDialog } from './DeleteCommentDialog';
import styles from './OrganizationComments.module.css';

type OrganizationCommentsProps = {
  organizationId: string;
  /** Créateur de l'organisation : il peut supprimer n'importe quel commentaire (règle du backend). */
  creatorId: string;
  canComment: boolean;
};

const text = ORGANIZATIONS_LABELS.comments;
const COMMENT_COOLDOWN_MS = 15_000;

const cooldownKey = (organizationId: string) => `organization-comment-cooldown:${organizationId}`;

const readCooldownUntil = (organizationId: string): number => {
  const stored = window.sessionStorage.getItem(cooldownKey(organizationId));
  const until = stored === null ? 0 : Number(stored);
  return Number.isFinite(until) && until > Date.now() ? until : 0;
};

/**
 * Discussion publique d'une organisation (Epic 4, #71) : lecture pour tous, écriture connecté (lien de connexion
 * sinon), plus récent en premier. Suppression par l'auteur ou le créateur de l'organisation, après confirmation.
 */
export function OrganizationComments({ organizationId, creatorId, canComment }: OrganizationCommentsProps) {
  const titleId = useId();
  const { status, user } = useAuth();
  const location = useLocation();
  const { comments, loading, error, reload, prepend, remove } = useOrganizationComments(organizationId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(() => readCooldownUntil(organizationId));
  const isCoolingDown = cooldownUntil !== 0;

  // Fin du délai par minuteur (0 ms s'il est déjà écoulé) : jamais de setState synchrone dans l'effet.
  useEffect(() => {
    if (cooldownUntil === 0) return;
    const timeout = window.setTimeout(() => setCooldownUntil(0), Math.max(0, cooldownUntil - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [cooldownUntil]);

  const myUserId = user?.user_id ?? null;
  const toThreadComment = (comment: OrganizationComment): ThreadComment => ({
    id: comment.comment_id,
    author: comment.user.profile?.username ?? text.anonymousAuthor,
    avatar: comment.user.profile?.profile_picture,
    createdAt: comment.created_at,
    content: comment.content,
    mine: comment.user_id === myUserId,
    canDelete: myUserId !== null && (comment.user_id === myUserId || creatorId === myUserId),
  });
  const items = comments.map(toThreadComment);
  const ready = !loading && error === null;

  const submit = async (content: string) => {
    const result = await postOrganizationComment(organizationId, content);

    if ('success' in result) {
      throw new CommentSubmissionError(result.code);
    }

    prepend(result);

    const until = Date.now() + COMMENT_COOLDOWN_MS;
    window.sessionStorage.setItem(cooldownKey(organizationId), String(until));
    setCooldownUntil(until);
  };

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
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
          <p>{text.error}</p>
          <Button variant="text" onClick={reload}>
            {text.retry}
          </Button>
        </div>
      )}
      {ready && items.length === 0 && <p className={styles.muted}>{text.empty}</p>}
      {ready && items.length > 0 && (
        <CommentThread
          comments={items}
          mineLabel={text.you}
          deletion={{ label: text.delete, onRequest: setDeletingId }}
        />
      )}

      <DeleteCommentDialog
        comment={items.find((item) => item.id === deletingId) ?? null}
        onClose={() => setDeletingId(null)}
        onDeleted={(commentId) => {
          remove(commentId);
          setDeletingId(null);
        }}
      />
    </section>
  );
}
