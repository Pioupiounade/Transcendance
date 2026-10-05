import { formatDateTime } from '@/shared/lib/formatDate';
import { Avatar } from '../Avatar/Avatar';
import styles from './CommentThread.module.css';
import { Link } from 'react-router';

export type ThreadComment = {
  id: string;
  /** Nom affiché de l'auteur (initiales de l'avatar). */
  author: string;
  authorId?: string;
  avatar?: string | null;
  /** Date ISO. */
  createdAt: string;
  content: string;
  /** Commentaire de la personne connectée : marqué par `mineLabel`. */
  mine?: boolean;
};

type CommentThreadProps = {
  /** Dans l'ordre d'affichage (l'appelant décide : plus récent en premier ou non). */
  comments: ThreadComment[];
  /** Étiquette posée sur mes commentaires (« You »). */
  mineLabel: string;
};

/** Fil de commentaires à plat : avatar, auteur, date, texte (retours à la ligne conservés). Aucun métier. */
export function CommentThread({ comments, mineLabel }: CommentThreadProps) {
  return (
    <ol className={styles.list}>
      {comments.map((comment) => (
        <li key={comment.id} className={styles.item}>
          <Avatar name={comment.author} src={comment.avatar} size={36} />
          <div className={styles.body}>
            <p className={styles.meta}>
              {comment.authorId ? (
                <Link
                  to={`/profiles/${comment.authorId}`}
                  className={styles.author}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {comment.author}
                </Link>
              ) : (
                <span className={styles.author}>{comment.author}</span>
              )}
              {comment.mine && <span className={styles.mineTag}>{mineLabel}</span>}
              <time dateTime={comment.createdAt} className={styles.date}>
                {formatDateTime(comment.createdAt)}
              </time>
            </p>
            <p className={styles.content}>{comment.content}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
