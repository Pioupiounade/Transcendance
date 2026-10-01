import { useId } from 'react';
import { formatDateTime } from '@/shared/lib/formatDate';
import { Avatar } from '../Avatar/Avatar';
import styles from './CommentThread.module.css';

export type ThreadComment = {
  id: string;
  /** Nom affiché de l'auteur (initiales de l'avatar). */
  author: string;
  avatar?: string | null;
  /** Date ISO. */
  createdAt: string;
  content: string;
  /** Commentaire de la personne connectée : marqué par `mineLabel`. */
  mine?: boolean;
  /** La personne connectée peut le supprimer : bouton affiché si `deletion` est fourni. */
  canDelete?: boolean;
};

type CommentThreadProps = {
  /** Dans l'ordre d'affichage (l'appelant décide : plus récent en premier ou non). */
  comments: ThreadComment[];
  /** Étiquette posée sur mes commentaires (« You »). */
  mineLabel: string;
  /** Suppression : libellé du bouton et demande de l'appelant (qui confirme et appelle l'API). */
  deletion?: { label: string; onRequest: (id: string) => void };
};

/** Fil de commentaires à plat : avatar, auteur, date, texte (retours à la ligne conservés). Aucun métier. */
export function CommentThread({ comments, mineLabel, deletion }: CommentThreadProps) {
  const baseId = useId();
  return (
    <ol className={styles.list}>
      {comments.map((comment) => {
        const contentId = `${baseId}-${comment.id}`;
        return (
          <li key={comment.id} className={styles.item}>
            <Avatar name={comment.author} src={comment.avatar} size={36} />
            <div className={styles.body}>
              <p className={styles.meta}>
                <span className={styles.author}>{comment.author}</span>
                {comment.mine && <span className={styles.mineTag}>{mineLabel}</span>}
                <time dateTime={comment.createdAt} className={styles.date}>
                  {formatDateTime(comment.createdAt)}
                </time>
                {deletion && comment.canDelete && (
                  <button
                    type="button"
                    className={styles.delete}
                    aria-describedby={contentId}
                    onClick={() => deletion.onRequest(comment.id)}
                  >
                    {deletion.label}
                  </button>
                )}
              </p>
              <p id={contentId} className={styles.content}>
                {comment.content}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
