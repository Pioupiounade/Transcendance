import { useEffect, useMemo, useRef } from 'react';
import { MESSAGES_LABELS } from '../labels';
import { dayKey, dayLabel, timeLabel } from '../time';
import type { DirectMessage } from '../types';
import styles from './MessageThread.module.css';

type MessageThreadProps = {
  messages: DirectMessage[];
  currentUserId: string;
  friendName: string;
};

type DayGroup = { key: string; label: string; items: DirectMessage[] };

const groupByDay = (messages: DirectMessage[]): DayGroup[] =>
  messages.reduce<DayGroup[]>((groups, message) => {
    const key = dayKey(message.created_at);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(message);
    else groups.push({ key, label: dayLabel(message.created_at), items: [message] });
    return groups;
  }, []);

/** Messages groupés par jour ; le défilement suit le dernier message (d'un coup à l'ouverture, en douceur ensuite). */
export function MessageThread({ messages, currentUserId, friendName }: MessageThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const shownCount = useRef(0);
  const groups = useMemo(() => groupByDay(messages), [messages]);

  useEffect(() => {
    const element = scroller.current;
    if (!element || messages.length === shownCount.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: shownCount.current === 0 ? 'auto' : 'smooth' });
    shownCount.current = messages.length;
  }, [messages]);

  return (
    <div ref={scroller} className={styles.scroller} role="log" aria-label={MESSAGES_LABELS.title}>
      {messages.length === 0 && <p className={styles.empty}>{MESSAGES_LABELS.emptyThread(friendName)}</p>}
      {groups.map((group) => (
        <section key={group.key} className={styles.day}>
          <h3 className={styles.dayLabel}>{group.label}</h3>
          <ol className={styles.bubbles}>
            {group.items.map((message) => (
              <li
                key={message.message_id}
                className={message.sender_id === currentUserId ? styles.mine : styles.theirs}
              >
                <p className={styles.bubble}>{message.content}</p>
                <time className={styles.time} dateTime={message.created_at}>
                  {timeLabel(message.created_at)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
