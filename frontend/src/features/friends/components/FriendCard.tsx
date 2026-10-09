import React from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import type { FriendUserSummary } from '../types';

interface FriendCardProps {
  friend: FriendUserSummary;
  onRemove: (userId: string) => void;
  onBlock: (userId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onRemove, onBlock }) => {
  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1px solid var(--line, #e2e8f0)',
        background: 'var(--ground, #ffffff)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar
          src={friend.profile_picture || undefined}
          name={friend.username || 'User'}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Link
            to={`/profiles/${friend.user_id}`}
            style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--ink, #1f2937)', textDecoration: 'none' }}
          >
            @{friend.username || 'unknown'}
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>
            Friend since {new Date(friend.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* <Link
          to={`/messages`}
          className="btn btn--secondary"
          style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.85rem', borderRadius: '999px' }}
        >
          Message
        </Link> */}
        <button
          type="button"
          disabled
          className="btn btn--secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '999px', cursor: 'pointer' }}
          >
          Message
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '999px', cursor: 'pointer' }}
          onClick={() => onRemove(friend.user_id)}
        >
          Unfriend
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          style={{
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '999px',
            color: 'var(--danger, #b93832)',
            borderColor: 'var(--danger-soft, #fbedea)',
            cursor: 'pointer',
          }}
          onClick={() => onBlock(friend.user_id)}
        >
          Block
        </button>
      </div>
    </div>
  );
};